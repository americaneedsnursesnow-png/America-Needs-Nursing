import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Company, Job, JobPackage, JobStatus } from '../database/entities';
import { CreateJobPackageDto } from './dto/create-job-package.dto';
import { UpdateJobPackageDto } from './dto/update-job-package.dto';

@Injectable()
export class JobPackagesService {
  constructor(
    @InjectRepository(JobPackage)
    private readonly jobPackageRepository: Repository<JobPackage>,
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
  ) {}

  async ensureBelongsToClient(
    packageId: string,
    clientName: string,
  ): Promise<JobPackage> {
    const pkg = await this.jobPackageRepository.findOne({
      where: { id: packageId, clientName },
    });
    if (!pkg) {
      throw new NotFoundException('Job package not found');
    }
    return pkg;
  }

  async listCatalog(clientName: string): Promise<JobPackage[]> {
    return this.jobPackageRepository.find({
      where: { clientName, active: true },
      order: { priceCents: 'ASC', name: 'ASC' },
    });
  }

  async listAllForStaff(clientName: string): Promise<JobPackage[]> {
    return this.jobPackageRepository.find({
      where: { clientName },
      order: { createdAt: 'DESC' },
    });
  }

  async createForClient(
    clientName: string,
    dto: CreateJobPackageDto,
  ): Promise<JobPackage> {
    const isUnlimited = dto.isUnlimited === true;
    if (
      !isUnlimited &&
      (dto.publishedJobLimit === undefined || dto.publishedJobLimit < 1)
    ) {
      throw new BadRequestException(
        'publishedJobLimit is required (minimum 1) unless isUnlimited is true',
      );
    }
    const publishedJobLimit = isUnlimited ? 1 : dto.publishedJobLimit!;
    return this.jobPackageRepository.save(
      this.jobPackageRepository.create({
        clientName,
        name: dto.name.trim(),
        description: dto.description?.trim() ?? null,
        isUnlimited,
        publishedJobLimit,
        featuredJobLimit: dto.featuredJobLimit ?? 0,
        featuredCompanyListing: dto.featuredCompanyListing === true,
        priceCents: dto.priceCents,
        currency: (dto.currency ?? 'usd').toLowerCase(),
        stripePriceId: dto.stripePriceId?.trim() || null,
        active: dto.active !== false,
      }),
    );
  }

  async updateForClient(
    clientName: string,
    id: string,
    dto: UpdateJobPackageDto,
  ): Promise<JobPackage> {
    const pkg = await this.ensureBelongsToClient(id, clientName);
    if (dto.name !== undefined) pkg.name = dto.name.trim();
    if (dto.description !== undefined) {
      pkg.description =
        dto.description === null ? null : dto.description.trim();
    }
    if (dto.isUnlimited !== undefined) pkg.isUnlimited = dto.isUnlimited;
    if (dto.publishedJobLimit !== undefined) {
      if (dto.publishedJobLimit < 1) {
        throw new BadRequestException('publishedJobLimit must be at least 1');
      }
      pkg.publishedJobLimit = dto.publishedJobLimit;
    }
    if (dto.isUnlimited === true) {
      pkg.publishedJobLimit = Math.max(1, pkg.publishedJobLimit);
    }
    if (dto.priceCents !== undefined) pkg.priceCents = dto.priceCents;
    if (dto.currency !== undefined) pkg.currency = dto.currency.toLowerCase();
    if (dto.stripePriceId !== undefined) {
      pkg.stripePriceId = dto.stripePriceId?.trim() || null;
    }
    if (dto.active !== undefined) pkg.active = dto.active;
    if (dto.featuredJobLimit !== undefined) {
      pkg.featuredJobLimit = dto.featuredJobLimit;
    }
    if (dto.featuredCompanyListing !== undefined) {
      pkg.featuredCompanyListing = dto.featuredCompanyListing;
    }
    return this.jobPackageRepository.save(pkg);
  }

  /**
   * When moving a job to PUBLISHED, enforces:
   * - **Subscription**: no limits here (legacy / partner flag).
   * - **Valid job package**: max concurrent PUBLISHED jobs = package `publishedJobLimit` (or unlimited if `isUnlimited`).
   * - **No package / expired package**: "free" path — monthly publish quota is enforced in
   *   `CompaniesService.tryConsumeFreeTierJobPublishInTransaction`
   *   (per UTC month; cap from `clients.free_tier_job_posts_per_month`); this method only reports
   *   `useFreeTierPublishSlot: true` when the free path applies.
   */
  async assertCompanyMayPublishJob(
    company: Company,
    em?: EntityManager,
  ): Promise<{ useFreeTierPublishSlot: boolean }> {
    const namedSubscriptionActive =
      !!company.subscriptionPlanName?.trim() &&
      (!company.subscriptionExpiresAt ||
        company.subscriptionExpiresAt > new Date());
    if (namedSubscriptionActive) {
      return { useFreeTierPublishSlot: false };
    }

    const now = new Date();
    const packageExpired =
      !!company.jobPackageExpiresAt && company.jobPackageExpiresAt <= now;

    let pkg: JobPackage | null = null;
    if (!packageExpired && company.jobPackageId) {
      pkg =
        company.jobPackage ??
        (await this.jobPackageRepository.findOne({
          where: { id: company.jobPackageId, clientName: company.clientName },
        }));
    }

    if (!pkg || packageExpired) {
      return { useFreeTierPublishSlot: true };
    }

    if (pkg.isUnlimited) {
      return { useFreeTierPublishSlot: false };
    }

    await this.assertUnderPublishedLimit(company, pkg.publishedJobLimit, em);
    return { useFreeTierPublishSlot: false };
  }

  private async assertUnderPublishedLimit(
    company: Company,
    limit: number,
    em?: EntityManager,
  ): Promise<void> {
    const jobsRepo = em
      ? em.getRepository(Job)
      : this.jobsRepository;
    const count = await jobsRepo.count({
      where: {
        companyId: company.id,
        clientName: company.clientName,
        status: JobStatus.PUBLISHED,
      },
    });
    if (count >= limit) {
      throw new ForbiddenException(
        `You can have at most ${limit} published job(s) on your current plan. Upgrade your package to publish more concurrently.`,
      );
    }
  }

  async findActiveForCheckout(
    clientName: string,
    packageId: string,
  ): Promise<JobPackage> {
    const pkg = await this.jobPackageRepository.findOne({
      where: { id: packageId, clientName, active: true },
    });
    if (!pkg) {
      throw new NotFoundException('Job package not found');
    }
    const ref = pkg.stripePriceId?.trim() ?? '';
    if (!ref && pkg.priceCents <= 0) {
      throw new BadRequestException(
        'Set priceCents to a paid amount or set stripePriceId to a Stripe Price id (price_…)',
      );
    }
    return pkg;
  }
}
