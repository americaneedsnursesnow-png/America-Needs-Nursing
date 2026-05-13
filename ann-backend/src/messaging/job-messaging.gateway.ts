import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  HttpException,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { ApplicationsService } from '../applications/applications.service';
import { User, UserRole } from '../database/entities';
import { ThreadApplicationIdWsDto } from './dto/thread-application-id-ws.dto';
import { ThreadSendWsDto } from './dto/thread-send-ws.dto';
import {
  jobThreadMessageFromEntity,
  type JobMessagingThreadListItem,
  type JobThreadMessagePayload,
} from './job-thread-message.payload';
import { MessagingService } from './messaging.service';

/**
 * 1:1 job application threads (Socket.IO), room per tenant + application.
 *
 * Connect: `io(baseUrl + '/job-messaging', { auth: { token: jwt }, path: '/socket.io' })`
 *
 * Client → server (all JSON bodies; nurse or employer only):
 * - `threads:list` — {} — list application threads for the connected user
 * - `thread:messages` — { applicationId: uuid } — list messages in that thread (same visibility rules as before)
 * - `thread:send` — { applicationId: uuid, body: string } — persist + broadcast
 * - `thread:join` — { applicationId: uuid } — join Socket.IO room for live `thread:message`
 * - `thread:leave` — { applicationId: uuid }
 *
 * Server → client:
 * - `thread:message` — JobThreadMessagePayload (after `thread:send`)
 *
 * Acks: `{ ok: true, ... }` or `{ ok: false, error: string }` (see handler return types in source).
 */

interface WsHandshakeJwt {
  sub: string;
  email: string;
  role: UserRole;
  clientName: string;
}

interface JobMessagingSocketData {
  userId: string;
  clientName: string;
  role: UserRole;
  email: string;
}

@WebSocketGateway({
  namespace: '/job-messaging',
  cors: { origin: true, credentials: true },
})
export class JobMessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(JobMessagingGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly applicationsService: ApplicationsService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(forwardRef(() => MessagingService))
    private readonly messagingService: MessagingService,
  ) {}

  roomKey(clientName: string, applicationId: string): string {
    return `job-msg:${clientName}:${applicationId}`;
  }

  broadcastNewMessage(
    clientName: string,
    applicationId: string,
    message: JobThreadMessagePayload,
  ): void {
    try {
      const room = this.roomKey(clientName, applicationId);
      this.server?.to(room).emit('thread:message', message);
    } catch (e) {
      this.logger.warn(`broadcast failed: ${String(e)}`);
    }
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = extractBearerToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<WsHandshakeJwt>(token);
      const user = await this.usersRepository.findOne({
        where: { id: payload.sub, clientName: payload.clientName },
      });
      if (!user) {
        client.disconnect(true);
        return;
      }

      if (user.role !== UserRole.NURSE && user.role !== UserRole.COMPANY) {
        client.disconnect(true);
        return;
      }

      (client.data as JobMessagingSocketData) = {
        userId: user.id,
        clientName: user.clientName,
        role: user.role,
        email: user.email,
      };
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const d = client.data as JobMessagingSocketData | undefined;
    if (d?.userId) {
      this.logger.debug(`job-messaging disconnect user=${d.userId}`);
    }
  }

  @SubscribeMessage('thread:join')
  async handleThreadJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const data = client.data as JobMessagingSocketData | undefined;
    if (!data?.userId) {
      return { ok: false, error: 'Not authenticated' };
    }

    const applicationId = readApplicationId(body);
    if (!applicationId) {
      return { ok: false, error: 'Missing applicationId' };
    }

    const jwtUser = socketToJwtUser(data);

    try {
      await this.applicationsService.getForParticipant(jwtUser, applicationId);
    } catch {
      return { ok: false, error: 'Not allowed' };
    }

    await client.join(this.roomKey(data.clientName, applicationId));
    return { ok: true };
  }

  @SubscribeMessage('thread:leave')
  async handleThreadLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const data = client.data as JobMessagingSocketData | undefined;
    if (!data?.userId) {
      return { ok: false, error: 'Not authenticated' };
    }
    const applicationId = readApplicationId(body);
    if (!applicationId) {
      return { ok: false, error: 'Missing applicationId' };
    }
    await client.leave(this.roomKey(data.clientName, applicationId));
    return { ok: true };
  }

  @SubscribeMessage('threads:list')
  async handleThreadsList(
    @ConnectedSocket() client: Socket,
  ): Promise<
    | { ok: true; threads: JobMessagingThreadListItem[] }
    | { ok: false; error: string }
  > {
    const data = client.data as JobMessagingSocketData | undefined;
    if (!data?.userId) {
      return { ok: false, error: 'Not authenticated' };
    }

    try {
      const rows = await this.messagingService.listThreadsForUser(
        socketToJwtUser(data),
      );
      const threads: JobMessagingThreadListItem[] = rows.map((r) => ({
        applicationId: r.applicationId,
        lastMessageAt: r.lastMessageAt ? r.lastMessageAt.toISOString() : null,
      }));
      return { ok: true, threads };
    } catch (e) {
      return wsListError(e, this.logger, 'threads:list');
    }
  }

  @SubscribeMessage('thread:messages')
  async handleThreadMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<
    | { ok: true; messages: JobThreadMessagePayload[] }
    | { ok: false; error: string }
  > {
    const data = client.data as JobMessagingSocketData | undefined;
    if (!data?.userId) {
      return { ok: false, error: 'Not authenticated' };
    }

    const dto = plainToInstance(ThreadApplicationIdWsDto, body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const first = errors[0]?.constraints
        ? Object.values(errors[0].constraints)[0]
        : 'Invalid payload';
      return { ok: false, error: String(first) };
    }

    try {
      const list = await this.messagingService.listMessages(
        socketToJwtUser(data),
        dto.applicationId,
      );
      return {
        ok: true,
        messages: list.map((m) => jobThreadMessageFromEntity(m)),
      };
    } catch (e) {
      return wsListError(e, this.logger, 'thread:messages');
    }
  }

  @SubscribeMessage('thread:send')
  async handleThreadSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<
    | { ok: true; message: JobThreadMessagePayload }
    | { ok: false; error: string }
  > {
    const data = client.data as JobMessagingSocketData | undefined;
    if (!data?.userId) {
      return { ok: false, error: 'Not authenticated' };
    }

    const dto = plainToInstance(ThreadSendWsDto, body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      const first = errors[0]?.constraints
        ? Object.values(errors[0].constraints)[0]
        : 'Invalid payload';
      return { ok: false, error: String(first) };
    }

    const jwtUser = socketToJwtUser(data);

    try {
      const msg = await this.messagingService.sendMessage(
        jwtUser,
        dto.applicationId,
        dto.body,
      );
      return { ok: true, message: jobThreadMessageFromEntity(msg) };
    } catch (e) {
      if (e instanceof ForbiddenException) {
        return { ok: false, error: httpExceptionMessage(e) };
      }
      if (e instanceof BadRequestException) {
        return { ok: false, error: httpExceptionMessage(e) };
      }
      if (e instanceof HttpException) {
        return { ok: false, error: httpExceptionMessage(e) };
      }
      this.logger.warn(`thread:send failed: ${String(e)}`);
      return { ok: false, error: 'Send failed' };
    }
  }
}

function socketToJwtUser(data: JobMessagingSocketData): JwtUserPayload {
  return {
    sub: data.userId,
    email: data.email,
    role: data.role,
    clientName: data.clientName,
  };
}

function httpExceptionMessage(e: HttpException): string {
  const m = e.message;
  return typeof m === 'string' && m.length > 0 ? m : 'Request failed';
}

function wsListError(
  e: unknown,
  logger: Logger,
  label: string,
): { ok: false; error: string } {
  if (e instanceof HttpException) {
    return { ok: false, error: httpExceptionMessage(e) };
  }
  logger.warn(`${label} failed: ${String(e)}`);
  return { ok: false, error: 'Request failed' };
}

function readApplicationId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const id = (body as { applicationId?: unknown }).applicationId;
  if (typeof id !== 'string' || !id.trim()) return null;
  return id.trim();
}

function extractBearerToken(socket: Socket): string | undefined {
  const auth = socket.handshake.auth as { token?: unknown } | undefined;
  if (auth?.token && typeof auth.token === 'string') {
    return auth.token.trim();
  }

  const q = socket.handshake.query.token;
  if (typeof q === 'string' && q.length > 0) {
    return q.trim();
  }
  if (Array.isArray(q) && typeof q[0] === 'string') {
    return q[0].trim();
  }

  const header = socket.handshake.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  return undefined;
}
