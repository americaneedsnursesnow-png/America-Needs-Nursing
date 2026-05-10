import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { In, Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import {
  CommunityComment,
  CommunityMemberReport,
  CommunityPost,
  NurseProfile,
  User,
  UserRole,
} from '../database/entities';
import { sanitizeJobRichHtml } from '../common/html/sanitize-stored-html';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto';
import { CreateCommunityPostDto } from './dto/create-community-post.dto';
import { ReportCommunityMemberDto } from './dto/report-community-member.dto';

const REPORT_NOTIFY_TYPE = 'community_member_escalation';

/** `getRawMany()` dates are often strings from the driver — never call `.toISOString()` blindly. */
function rawRowDateToIso(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      return v.toISOString();
    }
    if (typeof v === 'string' && v.length > 0) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
  }
  return new Date(0).toISOString();
}

export type CommunityMemberReportSummary = {
  reportedUserId: string;
  reportedEmail: string;
  reporterCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
};

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunityPost)
    private readonly postsRepository: Repository<CommunityPost>,
    @InjectRepository(CommunityComment)
    private readonly commentsRepository: Repository<CommunityComment>,
    @InjectRepository(NurseProfile)
    private readonly profilesRepository: Repository<NurseProfile>,
    @InjectRepository(CommunityMemberReport)
    private readonly reportsRepository: Repository<CommunityMemberReport>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Nurses (registered accounts) and super admins may post/comment.
   * Banned nurses are blocked.
   */
  /**
   * Nurses (non–community-banned) in this tenant, for the main (global) chat
   * @-mention picker and @all delivery.
   */
  async listNursesForGlobalChatMentions(
    clientName: string,
  ): Promise<
    { userId: string; email: string; fullName: string | null }[]
  > {
    const rows = await this.profilesRepository
      .createQueryBuilder('p')
      .innerJoin('p.user', 'u')
      .select('p.userId', 'userId')
      .addSelect('u.email', 'email')
      .addSelect('u.fullName', 'fullName')
      .where('p.clientName = :clientName', { clientName })
      .andWhere('p.community_banned_at IS NULL')
      .andWhere('u.role = :role', { role: UserRole.NURSE })
      .getRawMany();
    return rows.map((r) => ({
      userId: r.userId as string,
      email: r.email as string,
      fullName: (r.fullName as string | null) ?? null,
    }));
  }

  async assertCommunityAuthor(user: JwtUserPayload): Promise<void> {
    await this.ensureCommunityParticipant(user);
  }

  /**
   * Shared gate for HTTP community chat and posts/comments: super admin passes;
   * nurse must have a profile and not be community-banned.
   */
  async ensureCommunityParticipant(user: JwtUserPayload): Promise<void> {
    if (user.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException(
        'Only nurses and administrators can use the community',
      );
    }
    const profile = await this.profilesRepository.findOne({
      where: { userId: user.sub, clientName: user.clientName },
    });
    if (!profile) {
      throw new ForbiddenException('Nurse profile required');
    }
    if (profile.communityBannedAt) {
      throw new ForbiddenException(
        'You no longer have access to the community for this account.',
      );
    }
  }

  async createPost(
    user: JwtUserPayload,
    dto: CreateCommunityPostDto,
  ): Promise<CommunityPost> {
    await this.assertCommunityAuthor(user);
    return this.postsRepository.save(
      this.postsRepository.create({
        clientName: user.clientName,
        authorUserId: user.sub,
        title: dto.title.trim(),
        body: sanitizeJobRichHtml(dto.body.trim()),
      }),
    );
  }

  listPosts(clientName: string): Promise<CommunityPost[]> {
    return this.postsRepository.find({
      where: { clientName },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async getPost(clientName: string, id: string): Promise<CommunityPost> {
    const post = await this.postsRepository.findOne({
      where: { id, clientName },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async listComments(
    clientName: string,
    postId: string,
  ): Promise<CommunityComment[]> {
    await this.getPost(clientName, postId);
    return this.commentsRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
  }

  async addComment(
    user: JwtUserPayload,
    postId: string,
    dto: CreateCommunityCommentDto,
  ): Promise<CommunityComment> {
    await this.assertCommunityAuthor(user);
    await this.getPost(user.clientName, postId);
    return this.commentsRepository.save(
      this.commentsRepository.create({
        postId,
        authorUserId: user.sub,
        body: sanitizeJobRichHtml(dto.body.trim()),
      }),
    );
  }

  private async countDistinctReporters(
    clientName: string,
    reportedUserId: string,
  ): Promise<number> {
    const row = await this.reportsRepository
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.reporterUserId)', 'cnt')
      .where('r.clientName = :c', { c: clientName })
      .andWhere('r.reportedUserId = :uid', { uid: reportedUserId })
      .getRawOne<{ cnt: string }>();
    return Number(row?.cnt ?? 0);
  }

  private async notifyAdminsSecondReporter(params: {
    clientName: string;
    reportedUserId: string;
    reportedEmail: string;
  }): Promise<void> {
    const admins = await this.usersRepository.find({
      where: {
        clientName: params.clientName,
        role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
      },
      select: ['id'],
    });
    const title = 'Community: member reports escalated';
    const body = `Multiple nurses reported ${params.reportedEmail}. You can review and remove them from the community in admin moderation.`;
    for (const a of admins) {
      await this.notificationsService.create(
        a.id,
        params.clientName,
        REPORT_NOTIFY_TYPE,
        title,
        body,
        { reportedUserId: params.reportedUserId },
      );
    }
  }

  async reportMember(
    reporter: JwtUserPayload,
    dto: ReportCommunityMemberDto,
  ): Promise<{
    ok: true;
    distinctReporterCount: number;
    escalatedToAdmins: boolean;
  }> {
    await this.ensureCommunityParticipant(reporter);
    const reportedId = dto.reportedUserId.trim();
    if (reportedId === reporter.sub) {
      throw new ForbiddenException('You cannot report yourself');
    }

    const reported = await this.usersRepository.findOne({
      where: { id: reportedId, clientName: reporter.clientName },
    });
    if (!reported || reported.role !== UserRole.NURSE) {
      throw new NotFoundException('Member not found in this community');
    }

    const reportedProfile = await this.profilesRepository.findOne({
      where: { userId: reportedId, clientName: reporter.clientName },
    });
    if (!reportedProfile) {
      throw new NotFoundException('Member not found in this community');
    }

    const before = await this.countDistinctReporters(
      reporter.clientName,
      reportedId,
    );

    const reason =
      dto.reason === undefined || dto.reason === null
        ? null
        : dto.reason.trim() || null;

    try {
      await this.reportsRepository.save(
        this.reportsRepository.create({
          clientName: reporter.clientName,
          reporterUserId: reporter.sub,
          reportedUserId: reportedId,
          reason,
        }),
      );
    } catch (e: unknown) {
      if (
        e instanceof QueryFailedError &&
        (e as { driverError?: { code?: string } }).driverError?.code === '23505'
      ) {
        throw new ConflictException('You have already reported this member');
      }
      throw e;
    }

    const after = await this.countDistinctReporters(
      reporter.clientName,
      reportedId,
    );

    let escalatedToAdmins = false;
    if (before < 2 && after >= 2) {
      escalatedToAdmins = true;
      await this.notifyAdminsSecondReporter({
        clientName: reporter.clientName,
        reportedUserId: reportedId,
        reportedEmail: reported.email,
      });
    }

    return {
      ok: true,
      distinctReporterCount: after,
      escalatedToAdmins,
    };
  }

  async listMemberReportsForAdmin(
    clientName: string,
  ): Promise<CommunityMemberReportSummary[]> {
    /** Raw SQL avoids QueryBuilder + ORDER BY alias issues across PG / TypeORM versions. */
    type ReportAggRow = {
      reportedUserId: string;
      reporterCount: string | number;
      firstReportedAt: Date | string;
      lastReportedAt: Date | string;
    };

    let rows: ReportAggRow[];
    try {
      rows = await this.reportsRepository.query(
        `
        SELECT
          r.reported_user_id AS "reportedUserId",
          COUNT(DISTINCT r.reporter_user_id) AS "reporterCount",
          MIN(r.created_at) AS "firstReportedAt",
          MAX(r.created_at) AS "lastReportedAt"
        FROM community_member_reports r
        WHERE r.client_name = $1
        GROUP BY r.reported_user_id
        ORDER BY COUNT(DISTINCT r.reporter_user_id) DESC, MAX(r.created_at) DESC
        `,
        [clientName],
      );
    } catch (e: unknown) {
      if (e instanceof QueryFailedError) {
        const code = (e as { driverError?: { code?: string } }).driverError
          ?.code;
        if (code === '42P01') {
          throw new ServiceUnavailableException(
            'Community reporting tables are missing. Run: npm run migration:run (ann-backend).',
          );
        }
      }
      throw e;
    }

    if (!rows?.length) {
      return [];
    }

    const reportedIds = rows
      .map((row) => String(row.reportedUserId ?? '').trim())
      .filter((id) => id.length > 0);

    if (reportedIds.length === 0) {
      return [];
    }

    const users = await this.usersRepository.find({
      where: { id: In(reportedIds) },
      select: ['id', 'email'],
    });
    const emailById = new Map(users.map((u) => [u.id, u.email]));

    return rows.map((row) => {
      const r = row as unknown as Record<string, unknown>;
      const reportedUserId = String(row.reportedUserId ?? '').trim();
      const countRaw = row.reporterCount ?? 0;
      return {
        reportedUserId,
        reportedEmail: emailById.get(reportedUserId) ?? reportedUserId,
        reporterCount: Number(countRaw),
        firstReportedAt: rawRowDateToIso(r, [
          'firstReportedAt',
          'firstreportedat',
        ]),
        lastReportedAt: rawRowDateToIso(r, [
          'lastReportedAt',
          'lastreportedat',
        ]),
      };
    });
  }

  async banNurseFromCommunity(
    clientName: string,
    targetUserId: string,
  ): Promise<{ ok: true }> {
    const user = await this.usersRepository.findOne({
      where: { id: targetUserId, clientName },
    });
    if (!user || user.role !== UserRole.NURSE) {
      throw new NotFoundException('Nurse not found for this client');
    }
    const profile = await this.profilesRepository.findOne({
      where: { userId: targetUserId, clientName },
    });
    if (!profile) {
      throw new NotFoundException('Nurse profile not found');
    }
    profile.communityBannedAt = new Date();
    await this.profilesRepository.save(profile);
    return { ok: true };
  }
}
