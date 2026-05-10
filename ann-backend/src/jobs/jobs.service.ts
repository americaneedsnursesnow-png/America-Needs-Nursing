import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, IsNull, MoreThan, Or, Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import {
  buildPaginatedMeta,
  normalizePagination,
  type PaginatedResult,
} from '../common/types/paginated';
import { CompaniesService } from '../companies/companies.service';
import { JobPackagesService } from '../job-packages/job-packages.service';
import {
  CompanyApprovalStatus,
  Job,
  JobStatus,
  UserRole,
} from '../database/entities';
import { sanitizeJobRichHtml } from '../common/html/sanitize-stored-html';
import { uniqueSlugFromTitle } from '../common/slug.util';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    private readonly companiesService: CompaniesService,
    private readonly jobPackagesService: JobPackagesService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async create(user: JwtUserPayload, dto: CreateJobDto): Promise<Job> {
    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException();
    }
    const company = await this.companiesService.findEmployerCompanyOrThrow(
      user.sub,
      user.clientName,
    );

    const slug = await this.resolveNewJobSlug(
      user.clientName,
      dto.title,
      dto.slug?.trim() ?? '',
    );

    return this.jobsRepository.save(
      this.jobsRepository.create({
        clientName: user.clientName,
        companyId: company.id,
        title: dto.title.trim(),
        slug,
        description: sanitizeJobRichHtml(dto.description.trim()),
        requirements: dto.requirements?.trim()
          ? sanitizeJobRichHtml(dto.requirements.trim())
          : null,
        location: dto.location?.trim() ?? null,
        stateCode: dto.stateCode?.trim().toUpperCase() ?? null,
        employmentType: dto.employmentType ?? null,
        jobLevel: dto.jobLevel ?? null,
        jobCategory: dto.jobCategory?.trim() ?? null,
        expectedSalaryRange: dto.expectedSalaryRange ?? null,
        status: JobStatus.DRAFT,
        featured: false,
        adminReviewRequired: false,
        approvedForListing: true,
        expiresAt: null,
      }),
    );
  }

  async listMine(user: JwtUserPayload): Promise<Job[]> {
    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException();
    }
    const company = await this.companiesService.findEmployerCompanyOrThrow(
      user.sub,
      user.clientName,
    );
    return this.jobsRepository.find({
      where: { companyId: company.id, clientName: user.clientName },
      order: { createdAt: 'DESC' },
    });
  }

  async getEmployerJob(user: JwtUserPayload, jobId: string): Promise<Job> {
    const company = await this.companiesService.findEmployerCompanyOrThrow(
      user.sub,
      user.clientName,
    );
    const job = await this.jobsRepository.findOne({
      where: { id: jobId, companyId: company.id, clientName: user.clientName },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  /**
   * Permanently removes the job. Related `job_applications` and `saved_jobs` rows
   * are removed by DB `ON DELETE CASCADE` where applicable.
   */
  async deleteMine(user: JwtUserPayload, jobId: string): Promise<void> {
    if (user.role !== UserRole.EMPLOYER) {
      throw new ForbiddenException();
    }
    const job = await this.getEmployerJob(user, jobId);
    await this.jobsRepository.remove(job);
  }

  async update(
    user: JwtUserPayload,
    jobId: string,
    dto: UpdateJobDto,
  ): Promise<Job> {
    const job = await this.getEmployerJob(user, jobId);
    const company = await this.companiesService.findEmployerCompanyOrThrow(
      user.sub,
      user.clientName,
    );

    if (dto.title !== undefined) job.title = dto.title.trim();
    if (dto.description !== undefined) {
      job.description = sanitizeJobRichHtml(dto.description.trim());
    }
    if (dto.requirements !== undefined) {
      job.requirements = dto.requirements?.trim()
        ? sanitizeJobRichHtml(dto.requirements.trim())
        : null;
    }
    if (dto.location !== undefined) job.location = dto.location?.trim() ?? null;
    if (dto.stateCode !== undefined) {
      job.stateCode = dto.stateCode?.trim().toUpperCase() ?? null;
    }
    if (dto.employmentType !== undefined) {
      job.employmentType = dto.employmentType;
    }
    if (dto.jobLevel !== undefined) {
      job.jobLevel = dto.jobLevel;
    }
    if (dto.jobCategory !== undefined) {
      job.jobCategory = dto.jobCategory?.trim() ?? null;
    }
    if (dto.expectedSalaryRange !== undefined) {
      const v = dto.expectedSalaryRange;
      job.expectedSalaryRange =
        v === null || (typeof v === 'string' && v.trim() === '') ? null : v;
    }
    // Listing visibility & expiry are platform-controlled for employers.

    if (dto.status !== undefined) {
      const nextStatus = dto.status;
      const firstTimePublish =
        nextStatus === JobStatus.PUBLISHED && job.status !== JobStatus.PUBLISHED;

      if (firstTimePublish) {
        return this.dataSource.transaction(async (em) => {
          await this.applyStatusChange(
            job,
            company.id,
            nextStatus,
            em,
          );
          return em.getRepository(Job).save(job);
        });
      }

      await this.applyStatusChange(job, company.id, nextStatus, undefined);
    }

    return this.jobsRepository.save(job);
  }

  private async applyStatusChange(
    job: Job,
    employerCompanyId: string,
    next: JobStatus,
    em?: EntityManager,
  ): Promise<void> {
    if (next === job.status) {
      return;
    }

    if (next === JobStatus.PUBLISHED) {
      if (job.companyId !== employerCompanyId) {
        throw new ForbiddenException();
      }

      const c = await this.companiesService.findByIdWithPackageOrThrow(
        job.companyId,
        job.clientName,
        em,
      );
      if (c.approvalStatus !== CompanyApprovalStatus.APPROVED) {
        throw new ForbiddenException(
          'Company must be approved before publishing jobs',
        );
      }
      if (job.adminReviewRequired && !job.approvedForListing) {
        throw new ForbiddenException(
          'Job is pending admin approval for listing',
        );
      }

      const wasPublished = job.status === JobStatus.PUBLISHED;
      if (!wasPublished) {
        const { useFreeTierPublishSlot } =
          await this.jobPackagesService.assertCompanyMayPublishJob(c, em);
        if (useFreeTierPublishSlot) {
          if (!em) {
            throw new InternalServerErrorException(
              'Free-tier publish must run in a database transaction',
            );
          }
          await this.companiesService.tryConsumeFreeTierJobPublishInTransaction(
            c.id,
            c.clientName,
            em,
          );
        }
      }
    }

    const becomingPublished =
      next === JobStatus.PUBLISHED && job.status !== JobStatus.PUBLISHED;
    if (becomingPublished) {
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      job.expiresAt = new Date(Date.now() + thirtyDaysMs);
    }

    job.status = next;
  }

  async approveListingAdmin(clientName: string, jobId: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: { id: jobId, clientName },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    job.approvedForListing = true;
    return this.jobsRepository.save(job);
  }

  async listPublicPublished(
    clientName: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Job>> {
    const { skip, limit: lim, page: p } = normalizePagination(page, limit);
    const now = new Date();
    const [items, totalItems] = await this.jobsRepository.findAndCount({
      where: {
        clientName,
        status: JobStatus.PUBLISHED,
        approvedForListing: true,
        company: { approvalStatus: CompanyApprovalStatus.APPROVED },
        expiresAt: Or(IsNull(), MoreThan(now)),
      },
      relations: ['company'],
      order: { createdAt: 'DESC' },
      skip,
      take: lim,
    });
    return {
      items,
      meta: buildPaginatedMeta(totalItems, p, lim),
    };
  }

  async listPublishedJobsForCompany(
    clientName: string,
    companyId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Job>> {
    const { skip, limit: lim, page: p } = normalizePagination(page, limit);
    const now = new Date();
    const [items, totalItems] = await this.jobsRepository.findAndCount({
      where: {
        clientName,
        companyId,
        status: JobStatus.PUBLISHED,
        approvedForListing: true,
        expiresAt: Or(IsNull(), MoreThan(now)),
      },
      order: { createdAt: 'DESC' },
      skip,
      take: lim,
    });
    return {
      items,
      meta: buildPaginatedMeta(totalItems, p, lim),
    };
  }

  async getPublicPublishedBySlug(
    clientName: string,
    slug: string,
  ): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: {
        clientName,
        slug: slug.trim().toLowerCase(),
        status: JobStatus.PUBLISHED,
        approvedForListing: true,
      },
      relations: ['company'],
    });
    if (!job?.company) {
      throw new NotFoundException('Job not found');
    }
    if (job.company.approvalStatus !== CompanyApprovalStatus.APPROVED) {
      throw new NotFoundException('Job not found');
    }
    if (job.expiresAt && job.expiresAt <= new Date()) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  /**
   * Uses explicit `requested` when non-empty; otherwise generates `title`-based
   * slugs with a random suffix until unique (per client).
   */
  private async resolveNewJobSlug(
    clientName: string,
    title: string,
    requested: string,
  ): Promise<string> {
    if (requested.length > 0) {
      const slug = requested.toLowerCase().slice(0, 160);
      const dup = await this.jobsRepository.exist({
        where: { clientName, slug },
      });
      if (dup) {
        throw new ConflictException('Job slug already in use');
      }
      return slug;
    }
    const t = title.trim();
    for (let i = 0; i < 24; i++) {
      const slug = uniqueSlugFromTitle(t).slice(0, 160);
      const dup = await this.jobsRepository.exist({
        where: { clientName, slug },
      });
      if (!dup) {
        return slug;
      }
    }
    throw new ConflictException('Could not allocate a unique job URL');
  }

  /**
   * Lightweight rows for browse maps (slug + geo fields only).
   */
  async listPublicMapMarkers(
    clientName: string,
    take: number,
  ): Promise<
    Array<{
      slug: string;
      title: string;
      stateCode: string | null;
      location: string | null;
    }>
  > {
    const now = new Date();
    const lim = Math.min(Math.max(take, 1), 500);
    const rows = await this.jobsRepository
      .createQueryBuilder('job')
      .innerJoin('job.company', 'company')
      .where('job.clientName = :clientName', { clientName })
      .andWhere('job.status = :published', { published: JobStatus.PUBLISHED })
      .andWhere('job.approvedForListing = true')
      .andWhere('company.approvalStatus = :approved', {
        approved: CompanyApprovalStatus.APPROVED,
      })
      .andWhere('(job.expiresAt IS NULL OR job.expiresAt > :now)', { now })
      .select([
        'job.slug',
        'job.title',
        'job.stateCode',
        'job.location',
      ])
      .orderBy('job.createdAt', 'DESC')
      .take(lim)
      .getMany();
    return rows.map((j) => ({
      slug: j.slug,
      title: j.title,
      stateCode: j.stateCode,
      location: j.location,
    }));
  }

  async findPublishedWithCompany(
    jobId: string,
    clientName: string,
  ): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: {
        id: jobId,
        clientName,
        status: JobStatus.PUBLISHED,
        approvedForListing: true,
      },
      relations: ['company'],
    });
    if (!job?.company) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }
}
