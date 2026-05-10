import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
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
  WsException,
} from '@nestjs/websockets';
import { Repository } from 'typeorm';
import { Server, Socket } from 'socket.io';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { User, UserRole } from '../database/entities';
import { CommunityChatService } from './community-chat.service';
import { CommunityChatSendDto } from './dto/community-chat-send.dto';

/**
 * Main chat: `chat:join` { global: true } → `community_global:{client}`.
 * Sub-community: `chat:join` { nurseCommunityId } → `nurse_community:{uuid}`.
 * `chat:send` uses the room joined on this socket.
 */

interface WsHandshakeJwt {
  sub: string;
  email: string;
  role: UserRole;
  clientName: string;
}

interface CommunitySocketData {
  userId: string;
  clientName: string;
  role: UserRole;
  email: string;
  /** Actively joined sub-community (Socket.IO room). */
  activeNurseCommunityId: string | null;
  /** True when joined to the per-tenant main (legacy global) group chat. */
  activeGlobal: boolean;
}

@WebSocketGateway({
  namespace: '/community-chat',
  cors: { origin: true, credentials: true },
})
export class CommunityChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(CommunityChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: CommunityChatService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const token = extractBearerToken(client);
    if (!token) {
      this.logger.debug('WS connect rejected: no token');
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

      if (user.role === UserRole.NURSE) {
        const jwtUser: JwtUserPayload = {
          sub: user.id,
          email: user.email,
          role: user.role,
          clientName: user.clientName,
        };
        await this.chatService.assertWsParticipant(jwtUser);
      } else if (user.role !== UserRole.SUPER_ADMIN) {
        client.disconnect(true);
        return;
      }

      const data: CommunitySocketData = {
        userId: user.id,
        clientName: user.clientName,
        role: user.role,
        email: user.email,
        activeNurseCommunityId: null,
        activeGlobal: false,
      };
      (client.data as CommunitySocketData) = data;

      client.emit('chat:ready', { ok: true });
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const d = client.data as CommunitySocketData | undefined;
    if (d?.userId) {
      this.logger.debug(`WS disconnect user=${d.userId}`);
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<
    | { ok: true; room: string; nurseCommunityId: string; global: false }
    | { ok: true; room: string; nurseCommunityId: null; global: true }
    | { ok: false; error: string }
  > {
    const data = client.data as CommunitySocketData | undefined;
    if (!data?.userId) {
      return { ok: false, error: 'Not authenticated' };
    }
    const p = payload as { nurseCommunityId?: string; global?: boolean };
    const jwtUser: JwtUserPayload = {
      sub: data.userId,
      email: data.email,
      role: data.role,
      clientName: data.clientName,
    };

    if (p?.global === true) {
      try {
        await this.chatService.assertWsParticipant(jwtUser);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Not allowed';
        return { ok: false, error: msg };
      }
      await this.leaveActiveRooms(client, data);
      const room = this.chatService.roomForGlobal(data.clientName);
      await client.join(room);
      data.activeGlobal = true;
      data.activeNurseCommunityId = null;
      return { ok: true, room, nurseCommunityId: null, global: true };
    }

    const id =
      typeof p?.nurseCommunityId === 'string' ? p.nurseCommunityId.trim() : '';
    if (!id) {
      return { ok: false, error: 'nurseCommunityId or global required' };
    }
    try {
      await this.chatService.assertNurseCommunityChatAccess(jwtUser, id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Not allowed';
      return { ok: false, error: msg };
    }

    await this.leaveActiveRooms(client, data);
    const room = this.chatService.roomForNurseCommunity(id);
    await client.join(room);
    data.activeNurseCommunityId = id;
    data.activeGlobal = false;
    return { ok: true, room, nurseCommunityId: id, global: false };
  }

  @SubscribeMessage('chat:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
  ): Promise<{ ok: true } | { ok: false; error: string }> {
    const data = client.data as CommunitySocketData | undefined;
    if (!data?.userId) {
      return { ok: false, error: 'Not authenticated' };
    }
    await this.leaveActiveRooms(client, data);
    return { ok: true };
  }

  @SubscribeMessage('chat:send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: unknown,
  ): Promise<
    { ok: true; message: unknown } | { ok: false; error: string }
  > {
    const data = client.data as CommunitySocketData | undefined;
    if (!data?.userId) {
      return { ok: false, error: 'Not authenticated' };
    }

    const jwtUser: JwtUserPayload = {
      sub: data.userId,
      email: data.email,
      role: data.role,
      clientName: data.clientName,
    };

    if (!data.activeGlobal && !data.activeNurseCommunityId) {
      return { ok: false, error: 'Join a room first' };
    }

    const dto = plainToInstance(CommunityChatSendDto, payload);
    const ve = await validate(dto);
    if (ve.length > 0) {
      const parts = ve.flatMap((e) =>
        e.constraints ? Object.values(e.constraints) : [],
      );
      return { ok: false, error: parts.join(' ') || 'Invalid message' };
    }

    try {
      let room: string;
      let message: { id: string; body: string; createdAt: string };
      if (data.activeGlobal) {
        message = await this.chatService.saveAndMapGlobal(jwtUser, dto.body);
        room = this.chatService.roomForGlobal(data.clientName);
      } else {
        const nid = data.activeNurseCommunityId!;
        message = await this.chatService.saveAndMap(
          jwtUser,
          dto.body,
          nid,
        );
        room = this.chatService.roomForNurseCommunity(nid);
      }
      this.server.to(room).emit('chat:message', message);
      return { ok: true, message };
    } catch (e: unknown) {
      if (e instanceof WsException) {
        const err = e.getError();
        return {
          ok: false,
          error: typeof err === 'string' ? err : 'Invalid message',
        };
      }
      this.logger.error(e);
      return { ok: false, error: 'Failed to send message' };
    }
  }

  private async leaveActiveRooms(
    client: Socket,
    data: CommunitySocketData,
  ): Promise<void> {
    if (data.activeNurseCommunityId) {
      const r = this.chatService.roomForNurseCommunity(
        data.activeNurseCommunityId,
      );
      await client.leave(r);
      data.activeNurseCommunityId = null;
    }
    if (data.activeGlobal) {
      const r = this.chatService.roomForGlobal(data.clientName);
      await client.leave(r);
      data.activeGlobal = false;
    }
  }
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
