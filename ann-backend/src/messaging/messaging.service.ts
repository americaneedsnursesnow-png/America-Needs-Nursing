import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { sanitizeChatPlainHtml } from '../common/html/sanitize-stored-html';
import { ApplicationsService } from '../applications/applications.service';
import {
  ApplicationStatus,
  Conversation,
  Message,
  UserRole,
} from '../database/entities';

/** Same as product “shortlisted”: reviewed or accepted (not pending/rejected). */
function applicationAllowsEmployerMessaging(
  status: ApplicationStatus,
): boolean {
  return (
    status === ApplicationStatus.REVIEWED ||
    status === ApplicationStatus.ACCEPTED
  );
}
import { NotificationsService } from '../notifications/notifications.service';
import { JobMessagingGateway } from './job-messaging.gateway';
import { jobThreadMessageFromEntity } from './job-thread-message.payload';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    private readonly applicationsService: ApplicationsService,
    private readonly notificationsService: NotificationsService,
    @Inject(forwardRef(() => JobMessagingGateway))
    private readonly jobMessagingGateway: JobMessagingGateway,
  ) {}

  async getOrCreateConversation(
    applicationId: string,
    clientName: string,
  ): Promise<Conversation> {
    let conv = await this.conversationsRepository.findOne({
      where: { clientName, application: { id: applicationId } },
      relations: ['application'],
    });
    if (!conv) {
      const created = await this.conversationsRepository.save(
        this.conversationsRepository.create({
          clientName,
          application: { id: applicationId },
        }),
      );
      conv = await this.conversationsRepository.findOneOrFail({
        where: { id: created.id },
        relations: ['application'],
      });
    }
    return conv;
  }

  async listMessages(
    user: JwtUserPayload,
    applicationId: string,
  ): Promise<Message[]> {
    const application = await this.applicationsService.getForParticipant(
      user,
      applicationId,
    );
    const conv = await this.conversationsRepository.findOne({
      where: {
        clientName: user.clientName,
        application: { id: applicationId },
      },
    });
    if (!conv) {
      return [];
    }
    if (user.role === UserRole.NURSE) {
      const employerId = application.job.company.employerUserId;
      const employerMessaged = await this.messagesRepository.exist({
        where: { conversationId: conv.id, senderUserId: employerId },
      });
      if (!employerMessaged) {
        return [];
      }
    }
    if (user.role === UserRole.EMPLOYER) {
      if (!applicationAllowsEmployerMessaging(application.status)) {
        return [];
      }
    }
    return this.messagesRepository.find({
      where: { conversationId: conv.id },
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(
    user: JwtUserPayload,
    applicationId: string,
    body: string,
  ): Promise<Message> {
    const application = await this.applicationsService.getForParticipant(
      user,
      applicationId,
    );
    const employerUserId = application.job.company.employerUserId;

    let conv: Conversation;
    if (user.role === UserRole.NURSE) {
      const existing = await this.conversationsRepository.findOne({
        where: {
          clientName: user.clientName,
          application: { id: application.id },
        },
      });
      if (
        !existing ||
        !(await this.messagesRepository.exist({
          where: {
            conversationId: existing.id,
            senderUserId: employerUserId,
          },
        }))
      ) {
        throw new ForbiddenException(
          'You can message this employer after they send the first message in this thread.',
        );
      }
      conv = existing;
    } else {
      if (!applicationAllowsEmployerMessaging(application.status)) {
        throw new ForbiddenException(
          'Shortlist this applicant (mark as reviewed) before you can send a message.',
        );
      }
      conv = await this.getOrCreateConversation(
        application.id,
        user.clientName,
      );
    }

    const safeBody = sanitizeChatPlainHtml(body);
    if (!safeBody) {
      throw new BadRequestException('Message cannot be empty');
    }
    const msg = await this.messagesRepository.save(
      this.messagesRepository.create({
        conversationId: conv.id,
        senderUserId: user.sub,
        body: safeBody,
        readAt: null,
      }),
    );

    const recipientId =
      application.nurseUserId === user.sub
        ? application.job.company.employerUserId
        : application.nurseUserId;

    await this.notificationsService.create(
      recipientId,
      user.clientName,
      'message',
      'New message',
      safeBody.slice(0, 200),
      { applicationId: application.id, messageId: msg.id },
    );

    try {
      this.jobMessagingGateway.broadcastNewMessage(
        user.clientName,
        application.id,
        jobThreadMessageFromEntity(msg),
      );
    } catch (e) {
      this.logger.warn(`Job messaging WS broadcast skipped: ${String(e)}`);
    }

    return msg;
  }

  async listThreadsForUser(
    user: JwtUserPayload,
  ): Promise<Array<{ applicationId: string; lastMessageAt: Date | null }>> {
    if (user.role !== UserRole.NURSE && user.role !== UserRole.EMPLOYER) {
      return [];
    }

    const convs = await this.conversationsRepository.find({
      where: { clientName: user.clientName },
      relations: ['application', 'application.job', 'application.job.company'],
    });

    const filtered = convs.filter((c) => {
      const a = c.application;
      if (!a?.job?.company) {
        return false;
      }
      if (user.role === UserRole.NURSE) {
        return a.nurseUserId === user.sub;
      }
      return a.job.company.employerUserId === user.sub;
    });

    const out: Array<{
      applicationId: string;
      lastMessageAt: Date | null;
    }> = [];

    for (const c of filtered) {
      const applicationId = c.application.id;
      const a = c.application;
      if (user.role === UserRole.NURSE) {
        const employerId = a.job.company.employerUserId;
        const employerMessaged = await this.messagesRepository.exist({
          where: { conversationId: c.id, senderUserId: employerId },
        });
        if (!employerMessaged) {
          continue;
        }
      }
      if (user.role === UserRole.EMPLOYER) {
        if (!applicationAllowsEmployerMessaging(a.status)) {
          continue;
        }
      }
      const last = await this.messagesRepository.findOne({
        where: { conversationId: c.id },
        order: { createdAt: 'DESC' },
      });
      out.push({
        applicationId,
        lastMessageAt: last?.createdAt ?? null,
      });
    }

    return out.sort((a, b) => {
      const ta = a.lastMessageAt?.getTime() ?? 0;
      const tb = b.lastMessageAt?.getTime() ?? 0;
      return tb - ta;
    });
  }
}
