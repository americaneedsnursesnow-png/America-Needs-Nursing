import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WsException } from '@nestjs/websockets';
import { In, IsNull, Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { sanitizeChatPlainHtml } from '../common/html/sanitize-stored-html';
import {
  CommunityChatMessage,
  User,
  UserRole,
} from '../database/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { CommunityService } from './community.service';
import { NurseCommunityService } from './nurse-community.service';

const MAX_BODY_LEN = 2000;
const MENTION_TYPE = 'community_chat_mention';
const MENTION_ALL_TYPE = 'community_chat_mention_all';

const EMAIL_MENTION_RE =
  /(?:^|[\s\n])@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
const ALL_MENTION_RE = /(?:^|[\s\n])@all\b/gi;

export interface CommunityChatMessageView {
  id: string;
  clientName: string;
  nurseCommunityId: string | null;
  senderUserId: string;
  senderEmail: string;
  senderRole: UserRole;
  body: string;
  createdAt: string;
}

@Injectable()
export class CommunityChatService {
  private readonly logger = new Logger(CommunityChatService.name);

  constructor(
    @InjectRepository(CommunityChatMessage)
    private readonly messagesRepository: Repository<CommunityChatMessage>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly communityService: CommunityService,
    private readonly nurseCommunityService: NurseCommunityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  roomForNurseCommunity(communityId: string): string {
    return `nurse_community:${communityId}`;
  }

  /** Per-tenant “main” group chat (legacy `nurse_community_id` IS NULL). */
  roomForGlobal(clientName: string): string {
    const safe = clientName.replace(/[^a-zA-Z0-9._-]+/g, '_');
    return `community_global:${safe}`;
  }

  async assertNurseCommunityChatAccess(
    user: JwtUserPayload,
    nurseCommunityId: string,
  ): Promise<void> {
    await this.nurseCommunityService.assertCanAccessChat(user, nurseCommunityId);
  }

  async assertHttpParticipant(user: JwtUserPayload): Promise<void> {
    await this.communityService.ensureCommunityParticipant(user);
  }

  async assertWsParticipant(user: JwtUserPayload): Promise<void> {
    try {
      await this.communityService.ensureCommunityParticipant(user);
    } catch (e: unknown) {
      if (e instanceof ForbiddenException) {
        throw new WsException(e.message);
      }
      throw e;
    }
  }

  async saveAndMap(
    user: JwtUserPayload,
    body: string,
    nurseCommunityId: string,
  ): Promise<CommunityChatMessageView> {
    await this.nurseCommunityService.assertCanAccessChat(user, nurseCommunityId);
    const trimmed = sanitizeChatPlainHtml(body);
    if (trimmed.length === 0 || trimmed.length > MAX_BODY_LEN) {
      throw new WsException('Message must be 1–2000 characters');
    }

    const row = await this.messagesRepository.save(
      this.messagesRepository.create({
        clientName: user.clientName,
        nurseCommunityId,
        senderUserId: user.sub,
        body: trimmed,
      }),
    );

    const sender = await this.usersRepository.findOne({
      where: { id: user.sub },
    });
    if (!sender) {
      throw new WsException('User not found');
    }

    const view = this.toView(row, sender.email, sender.role);
    void this.dispatchMentionNotifications(
      user,
      nurseCommunityId,
      sender.email,
      trimmed,
    ).catch((e) => this.logger.warn(String(e)));
    return view;
  }

  /**
   * Main (global) group chat: any participant from `ensureCommunityParticipant` may read/write;
   * messages are stored with `nurse_community_id` = NULL.
   */
  async saveAndMapGlobal(
    user: JwtUserPayload,
    body: string,
  ): Promise<CommunityChatMessageView> {
    await this.communityService.ensureCommunityParticipant(user);
    const trimmed = sanitizeChatPlainHtml(body);
    if (trimmed.length === 0 || trimmed.length > MAX_BODY_LEN) {
      throw new WsException('Message must be 1–2000 characters');
    }

    const row = await this.messagesRepository.save(
      this.messagesRepository.create({
        clientName: user.clientName,
        nurseCommunityId: null,
        senderUserId: user.sub,
        body: trimmed,
      }),
    );

    const sender = await this.usersRepository.findOne({
      where: { id: user.sub },
    });
    if (!sender) {
      throw new WsException('User not found');
    }

    const view = this.toView(row, sender.email, sender.role);
    void this.dispatchMentionNotifications(
      user,
      null,
      sender.email,
      trimmed,
    ).catch((e) => this.logger.warn(String(e)));
    return view;
  }

  private async dispatchMentionNotifications(
    author: JwtUserPayload,
    nurseCommunityId: string | null,
    authorEmail: string,
    body: string,
  ): Promise<void> {
    let members: string[];
    if (nurseCommunityId) {
      members = await this.nurseCommunityService.listMemberIds(
        author.clientName,
        nurseCommunityId,
      );
    } else {
      const rows = await this.communityService.listNursesForGlobalChatMentions(
        author.clientName,
      );
      members = rows.map((r) => r.userId);
    }
    if (members.length === 0) {
      return;
    }

    if (ALL_MENTION_RE.test(body)) {
      for (const id of members) {
        if (id === author.sub) {
          continue;
        }
        await this.notificationsService.create(
          id,
          author.clientName,
          MENTION_ALL_TYPE,
          'Everyone was mentioned in community chat',
          `${authorEmail} mentioned @all`,
          { nurseCommunityId, fromUserId: author.sub } as {
            nurseCommunityId: string | null;
            fromUserId: string;
          },
        );
      }
    }

    const emails = new Set<string>();
    for (const m of body.matchAll(EMAIL_MENTION_RE)) {
      if (m[1]) {
        emails.add(m[1].toLowerCase());
      }
    }
    if (emails.size === 0) {
      return;
    }
    const users = await this.usersRepository.find({
      where: { clientName: author.clientName, email: In([...emails]) },
      select: ['id', 'email'],
    });
    for (const u of users) {
      if (u.id === author.sub || !members.includes(u.id)) {
        continue;
      }
        await this.notificationsService.create(
        u.id,
        author.clientName,
        MENTION_TYPE,
        'You were mentioned in community chat',
        `${authorEmail} mentioned you`,
        { nurseCommunityId, fromUserId: author.sub } as {
          nurseCommunityId: string | null;
          fromUserId: string;
        },
      );
    }
  }

  async getRecentHistoryForNurseCommunity(
    user: JwtUserPayload,
    nurseCommunityId: string,
    limit: number,
  ): Promise<CommunityChatMessageView[]> {
    await this.nurseCommunityService.assertCanAccessChat(user, nurseCommunityId);
    return this.getRecentHistory(
      user.clientName,
      nurseCommunityId,
      limit,
    );
  }

  async getRecentHistoryForGlobal(
    user: JwtUserPayload,
    limit: number,
  ): Promise<CommunityChatMessageView[]> {
    await this.communityService.ensureCommunityParticipant(user);
    return this.getRecentHistory(user.clientName, null, limit);
  }

  async getRecentHistory(
    clientName: string,
    nurseCommunityId: string | null,
    limit: number,
  ): Promise<CommunityChatMessageView[]> {
    const take = Math.min(Math.max(limit, 1), 200);
    const where =
      nurseCommunityId === null
        ? { clientName, nurseCommunityId: IsNull() }
        : { clientName, nurseCommunityId };
    const rows = await this.messagesRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take,
      relations: ['sender'],
    });

    return rows
      .reverse()
      .flatMap((r) => {
        if (!r.sender) {
          this.logger.warn(
            `Skipping chat message ${r.id}: sender relation missing`,
          );
          return [];
        }
        return [this.toView(r, r.sender.email, r.sender.role)];
      });
  }

  private toView(
    row: CommunityChatMessage,
    email: string,
    role: UserRole,
  ): CommunityChatMessageView {
    return {
      id: row.id,
      clientName: row.clientName,
      nurseCommunityId: row.nurseCommunityId,
      senderUserId: row.senderUserId,
      senderEmail: email,
      senderRole: role,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
