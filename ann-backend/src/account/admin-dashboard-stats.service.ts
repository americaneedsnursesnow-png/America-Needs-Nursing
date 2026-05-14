import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Company,
  CompanyApprovalStatus,
  Job,
  JobStatus,
  User,
  UserRole,
} from '../database/entities';
import { JobPackagesService } from '../job-packages/job-packages.service';
import { PaymentsService } from '../payments/payments.service';

export type AdminJobPackagePlanSummaryDto = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  active: boolean;
  featuredCompanyListing: boolean;
  featuredJobLimit: number;
  isUnlimited: boolean;
  publishedJobLimit: number;
};

export type AdminCheckoutHistoryItemDto = {
  sessionId: string;
  createdAt: string;
  amountTotalCents: number | null;
  currency: string | null;
  paymentStatus: string;
  companyId: string | null;
  packageId: string | null;
};

export type AdminDashboardRevenueDto = {
  stripeConfigured: boolean;
  employerPlans: AdminJobPackagePlanSummaryDto[];
  employersWithActiveSubscription: number;
  employersWithActiveJobPackage: number;
  /**
   * Sum of catalog `price_cents` for companies with a non-expired job package.
   * Snapshot of assigned plans, not historical Stripe totals.
   */
  activeJobPackageCatalogValueCents: number;
  /** Featured jobs currently on the public board (same visibility rules as listed jobs). */
  featuredListedJobsTotal: number;
  /** Approved companies with partnership / directory featured placement. */
  featuredEmployerProfilesTotal: number;
  recentCheckouts: AdminCheckoutHistoryItemDto[];
};

export type AdminDashboardStatsDto = {
  nurseTotal: number;
  companyTotal: number;
  /** Same rules as public job browse: published, approved for listing, approved company, not expired. */
  listedJobsTotal: number;
  revenue: AdminDashboardRevenueDto;
};

@Injectable()
export class AdminDashboardStatsService {
  private readonly logger = new Logger(AdminDashboardStatsService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    private readonly jobPackagesService: JobPackagesService,
    private readonly paymentsService: PaymentsService,
  ) {}

  async getStatsForClient(clientName: string): Promise<AdminDashboardStatsDto> {
    const now = new Date();
    const [
      nurseTotal,
      companyTotal,
      listedJobsTotal,
      featuredListedJobsTotal,
      employersWithActiveSubscription,
      employersWithActiveJobPackage,
      activeJobPackageCatalogValueCents,
      featuredEmployerProfilesTotal,
      plans,
      recentCheckouts,
    ] = await Promise.all([
      this.usersRepository.count({
        where: { clientName, role: UserRole.NURSE },
      }),
      this.usersRepository.count({
        where: { clientName, role: UserRole.COMPANY },
      }),
      this.listedJobsQuery(clientName, now).getCount(),
      this.listedJobsQuery(clientName, now)
        .andWhere('job.featured = :feat', { feat: true })
        .getCount(),
      this.companiesRepository
        .createQueryBuilder('c')
        .where('c.clientName = :clientName', { clientName })
        .andWhere('c.subscriptionPlanName IS NOT NULL')
        .andWhere("c.subscriptionPlanName != ''")
        .andWhere(
          '(c.subscriptionExpiresAt IS NULL OR c.subscriptionExpiresAt > :now)',
          { now },
        )
        .getCount(),
      this.companiesRepository
        .createQueryBuilder('c')
        .where('c.clientName = :clientName', { clientName })
        .andWhere('c.jobPackageId IS NOT NULL')
        .andWhere(
          '(c.jobPackageExpiresAt IS NULL OR c.jobPackageExpiresAt > :now)',
          { now },
        )
        .getCount(),
      this.sumActiveJobPackageCatalogValueCents(clientName, now),
      this.companiesRepository
        .createQueryBuilder('c')
        .where('c.clientName = :clientName', { clientName })
        .andWhere('c.approvalStatus = :approved', {
          approved: CompanyApprovalStatus.APPROVED,
        })
        .andWhere('c.partnershipFeatured = :pf', { pf: true })
        .getCount(),
      this.jobPackagesService.listAllForStaff(clientName),
      this.safeRecentCheckouts(clientName),
    ]);

    const employerPlans: AdminJobPackagePlanSummaryDto[] = plans.map((p) => ({
      id: p.id,
      name: p.name,
      priceCents: p.priceCents,
      currency: p.currency,
      active: p.active,
      featuredCompanyListing: p.featuredCompanyListing,
      featuredJobLimit: p.featuredJobLimit,
      isUnlimited: p.isUnlimited,
      publishedJobLimit: p.publishedJobLimit,
    }));

    return {
      nurseTotal,
      companyTotal,
      listedJobsTotal,
      revenue: {
        stripeConfigured: this.paymentsService.isStripeConfigured(),
        employerPlans,
        employersWithActiveSubscription,
        employersWithActiveJobPackage,
        activeJobPackageCatalogValueCents,
        featuredListedJobsTotal,
        featuredEmployerProfilesTotal,
        recentCheckouts,
      },
    };
  }

  private listedJobsQuery(clientName: string, now: Date) {
    return this.jobsRepository
      .createQueryBuilder('job')
      .innerJoin('job.company', 'company')
      .where('job.clientName = :clientName', { clientName })
      .andWhere('job.status = :published', { published: JobStatus.PUBLISHED })
      .andWhere('job.approvedForListing = :afl', { afl: true })
      .andWhere('company.approvalStatus = :approved', {
        approved: CompanyApprovalStatus.APPROVED,
      })
      .andWhere('(job.expiresAt IS NULL OR job.expiresAt > :now)', { now });
  }

  private async sumActiveJobPackageCatalogValueCents(
    clientName: string,
    now: Date,
  ): Promise<number> {
    const row = await this.companiesRepository
      .createQueryBuilder('c')
      .innerJoin('c.jobPackage', 'pkg')
      .select('COALESCE(SUM(pkg.priceCents), 0)', 'total')
      .where('c.clientName = :clientName', { clientName })
      .andWhere('c.jobPackageId IS NOT NULL')
      .andWhere(
        '(c.jobPackageExpiresAt IS NULL OR c.jobPackageExpiresAt > :now)',
        { now },
      )
      .getRawOne<{ total: string | null }>();
    const n = row?.total != null ? Number(row.total) : 0;
    return Number.isFinite(n) ? n : 0;
  }

  private async safeRecentCheckouts(
    clientName: string,
  ): Promise<AdminCheckoutHistoryItemDto[]> {
    try {
      return await this.paymentsService.listRecentCheckoutSessionsForClient(
        clientName,
        15,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      this.logger.warn(
        `Failed to load Stripe checkout history for ${clientName}: ${msg}`,
      );
      return [];
    }
  }
}
