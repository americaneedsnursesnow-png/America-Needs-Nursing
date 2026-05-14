import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import {
  buildPaginatedMeta,
  normalizePagination,
  type PaginatedResult,
} from '../common/types/paginated';
import { stripUserPasswordForResponse } from '../common/strip-user-secrets.util';
import { detectImage } from '../common/image-detect';
import { getUtcYyyyMm } from '../common/free-tier-jobs';
import {
  Company,
  CompanyApprovalStatus,
  User,
  UserRole,
} from '../database/entities';
import { MailService } from '../mail/mail.service';
import { deleteFileIfExists } from '../nurse-profiles/nurse-resume.storage';
import { JobPackagesService } from '../job-packages/job-packages.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { SetCompanyApprovalDto } from './dto/set-company-approval.dto';
import { SetCompanyJobPackageDto } from './dto/set-company-job-package.dto';
import { SetPartnershipDto } from './dto/set-partnership.dto';
import { SetSubscriptionDto } from './dto/set-subscription.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { ClientsService } from '../clients/clients.service';
import {
  getUploadsRoot,
  resolveStoredCompanyAssetFile,
  writeCompanyImage,
} from './company-image.storage';

const COMPANY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

/** Multer memoryStorage file shape. */
export type CompanyImageUploadFile = {
  buffer: Buffer;
  size: number;
  mimetype: string;
};

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jobPackagesService: JobPackagesService,
    private readonly clientsService: ClientsService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async createForEmployer(
    user: JwtUserPayload,
    dto: CreateCompanyDto,
  ): Promise<Company> {
    if (user.role !== UserRole.COMPANY) {
      throw new ForbiddenException('Only employers can create a company');
    }

    const existing = await this.companiesRepository.findOne({
      where: { employerUserId: user.sub },
    });
    if (existing) {
      throw new ConflictException('You already have a company profile');
    }

    const slug = dto.slug.trim().toLowerCase();
    const dupSlug = await this.companiesRepository.exist({
      where: { clientName: user.clientName, slug },
    });
    if (dupSlug) {
      throw new ConflictException('Slug already in use');
    }

    return this.companiesRepository.save(
      this.companiesRepository.create({
        clientName: user.clientName,
        employerUserId: user.sub,
        name: dto.name.trim(),
        slug,
        logoUrl: dto.logoUrl?.trim() ?? null,
        heroImageUrl: dto.heroImageUrl?.trim() ?? null,
        description: dto.description?.trim() ?? null,
        contactEmail: dto.contactEmail?.trim().toLowerCase() ?? null,
        contactPhone: dto.contactPhone?.trim() ?? null,
        cultureText: dto.cultureText?.trim() ?? null,
        testimonialsJson: null,
        locationsJson: this.normalizeLocations(dto.locations),
        approvalStatus: CompanyApprovalStatus.PENDING_REVIEW,
      }),
    );
  }

  async getMine(
    user: JwtUserPayload,
  ): Promise<Company & { freeTierJobPostsPerMonth: number }> {
    if (user.role !== UserRole.COMPANY) {
      throw new ForbiddenException();
    }
    const company = await this.companiesRepository.findOne({
      where: { employerUserId: user.sub, clientName: user.clientName },
      relations: ['jobPackage'],
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    await this.expireJobPackageIfNeeded(company);
    const freeTierJobPostsPerMonth =
      await this.clientsService.getFreeTierJobPostsPerMonthByClientName(
        user.clientName,
      );
    return { ...company, freeTierJobPostsPerMonth };
  }

  /** Same payload as {@link getMine}, or `null` if the employer has no company yet. */
  async getMineOrNull(
    user: JwtUserPayload,
  ): Promise<(Company & { freeTierJobPostsPerMonth: number }) | null> {
    if (user.role !== UserRole.COMPANY) {
      return null;
    }
    const company = await this.companiesRepository.findOne({
      where: { employerUserId: user.sub, clientName: user.clientName },
      relations: ['jobPackage'],
    });
    if (!company) {
      return null;
    }
    await this.expireJobPackageIfNeeded(company);
    const freeTierJobPostsPerMonth =
      await this.clientsService.getFreeTierJobPostsPerMonthByClientName(
        user.clientName,
      );
    return { ...company, freeTierJobPostsPerMonth };
  }

  async updateMine(
    user: JwtUserPayload,
    dto: UpdateCompanyDto,
  ): Promise<Company> {
    const company = await this.getMine(user);
    if (dto.name !== undefined) company.name = dto.name.trim();
    if (dto.logoUrl !== undefined)
      company.logoUrl = dto.logoUrl?.trim() ?? null;
    if (dto.heroImageUrl !== undefined) {
      company.heroImageUrl = dto.heroImageUrl?.trim() ?? null;
    }
    if (dto.description !== undefined) {
      company.description = dto.description?.trim() ?? null;
    }
    if (dto.contactEmail !== undefined) {
      company.contactEmail = dto.contactEmail?.trim().toLowerCase() ?? null;
    }
    if (dto.contactPhone !== undefined) {
      company.contactPhone = dto.contactPhone?.trim() ?? null;
    }
    if (dto.cultureText !== undefined) {
      company.cultureText = dto.cultureText?.trim() ?? null;
    }
    if (dto.testimonialsJson !== undefined) {
      company.testimonialsJson =
        dto.testimonialsJson === null
          ? null
          : (dto.testimonialsJson as Record<string, unknown>);
    }
    if (dto.locations !== undefined) {
      company.locationsJson = this.normalizeLocations(dto.locations);
    }
    company.approvalStatus = CompanyApprovalStatus.PENDING_REVIEW;
    return this.companiesRepository.save(company);
  }

  async listPublicApproved(
    clientName: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Company>> {
    const { skip, limit: lim, page: p } = normalizePagination(page, limit);
    const where: FindOptionsWhere<Company> = {
      clientName,
      approvalStatus: CompanyApprovalStatus.APPROVED,
    };
    const totalItems = await this.companiesRepository.count({ where });
    const items = await this.companiesRepository.find({
      where,
      order: { name: 'ASC' },
      skip,
      take: lim,
    });
    return {
      items,
      meta: buildPaginatedMeta(totalItems, p, lim),
    };
  }

  /**
   * Approved companies whose **active** job package includes “featured company
   * listing” (purchased plan), newest companies first.
   */
  async listPublicPackageFeaturedCompanies(
    clientName: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Company>> {
    const { skip, limit: lim, page: p } = normalizePagination(page, limit);
    const now = new Date();
    const base = this.companiesRepository
      .createQueryBuilder('c')
      .innerJoin('c.jobPackage', 'pkg')
      .where('c.clientName = :clientName', { clientName })
      .andWhere('c.approvalStatus = :approved', {
        approved: CompanyApprovalStatus.APPROVED,
      })
      .andWhere('c.jobPackageId IS NOT NULL')
      .andWhere('pkg.featuredCompanyListing = :fc', { fc: true })
      .andWhere(
        '(c.jobPackageExpiresAt IS NULL OR c.jobPackageExpiresAt > :now)',
        { now },
      );
    const totalItems = await base.clone().getCount();
    const items = await base
      .orderBy('c.createdAt', 'DESC')
      .skip(skip)
      .take(lim)
      .getMany();
    return {
      items,
      meta: buildPaginatedMeta(totalItems, p, lim),
    };
  }

  async getPublicApprovedBySlug(
    clientName: string,
    slug: string,
  ): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: {
        clientName,
        slug: slug.trim().toLowerCase(),
        approvalStatus: CompanyApprovalStatus.APPROVED,
      },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async listPendingAdmin(clientName: string): Promise<Company[]> {
    return this.companiesRepository.find({
      where: {
        clientName,
        approvalStatus: CompanyApprovalStatus.PENDING_REVIEW,
      },
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * All companies for the tenant (super admin). Optional filter by approval line.
   */
  async listAllAdmin(
    clientName: string,
    approvalStatusFilter?: CompanyApprovalStatus,
  ): Promise<Company[]> {
    const where: FindOptionsWhere<Company> = { clientName };
    if (approvalStatusFilter !== undefined) {
      where.approvalStatus = approvalStatusFilter;
    }
    return this.companiesRepository.find({
      where,
      order: { updatedAt: 'DESC' },
    });
  }

  async findAll(
    clientName: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<Company>> {
    const { skip, limit: lim, page: p } = normalizePagination(page, limit);
    const [items, totalItems] = await this.companiesRepository.findAndCount({
      where: { clientName },
      relations: ['employer'],
      order: { updatedAt: 'DESC' },
      skip,
      take: lim,
    });
    for (const row of items) {
      stripUserPasswordForResponse(row.employer);
    }
    return {
      items,
      meta: buildPaginatedMeta(totalItems, p, lim),
    };
  }

  async setApprovalAdmin(
    clientName: string,
    companyId: string,
    dto: SetCompanyApprovalDto,
  ): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId, clientName },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    const previous = company.approvalStatus;
    company.approvalStatus = dto.approvalStatus;
    const saved = await this.companiesRepository.save(company);
    if (
      previous !== CompanyApprovalStatus.APPROVED &&
      saved.approvalStatus === CompanyApprovalStatus.APPROVED
    ) {
      try {
        await this.sendCompanyVerifiedEmailToEmployer(saved);
      } catch (err: unknown) {
        this.logger.warn(
          `Company verified email failed for company ${saved.id}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
    return saved;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private async sendCompanyVerifiedEmailToEmployer(
    company: Company,
  ): Promise<void> {
    const employer = await this.usersRepository.findOne({
      where: { id: company.employerUserId },
    });
    if (!employer?.email) {
      return;
    }
    const base =
      this.config.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:3001';
    const origin = base.replace(/\/$/, '');
    const signInUrl = `${origin}/sign-in`;
    const html = `
      <p>Hello,</p>
      <p>Your company <strong>${this.escapeHtml(
        company.name,
      )}</strong> has been verified and approved on <strong>${this.escapeHtml(
        company.clientName,
      )}</strong>.</p>
      <p>You can sign in to publish jobs and manage your company profile.</p>
      <p><a href="${signInUrl}">Sign in</a></p>
    `;
    await this.mailService.sendHtmlTo(
      employer.email,
      `Your company "${company.name}" is verified`,
      html,
    );
  }

  async setPartnershipAdmin(
    clientName: string,
    companyId: string,
    dto: SetPartnershipDto,
  ): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId, clientName },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    company.partnershipFeatured = dto.partnershipFeatured;
    return this.companiesRepository.save(company);
  }

  async setSubscriptionAdmin(
    clientName: string,
    companyId: string,
    dto: SetSubscriptionDto,
  ): Promise<Company> {
    if (
      dto.subscriptionPlanName === undefined &&
      dto.subscriptionExpiresAt === undefined
    ) {
      throw new BadRequestException(
        'Provide subscriptionPlanName and/or subscriptionExpiresAt',
      );
    }
    const company = await this.companiesRepository.findOne({
      where: { id: companyId, clientName },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    if (dto.subscriptionPlanName !== undefined) {
      const trimmed = dto.subscriptionPlanName?.trim();
      company.subscriptionPlanName =
        trimmed && trimmed.length > 0 ? trimmed : null;
    }
    if (dto.subscriptionExpiresAt !== undefined) {
      company.subscriptionExpiresAt = dto.subscriptionExpiresAt ?? null;
    }
    return this.companiesRepository.save(company);
  }

  async findEmployerCompanyOrThrow(
    employerUserId: string,
    clientName: string,
  ): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { employerUserId, clientName },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    await this.expireJobPackageIfNeeded(company);
    return company;
  }

  async findByIdOrThrow(id: string, clientName: string): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id, clientName },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async findByIdWithPackageOrThrow(
    id: string,
    clientName: string,
    em?: EntityManager,
  ): Promise<Company> {
    const company = em
      ? await em.getRepository(Company).findOne({
          where: { id, clientName },
          relations: ['jobPackage'],
        })
      : await this.companiesRepository.findOne({
          where: { id, clientName },
          relations: ['jobPackage'],
        });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    await this.expireJobPackageIfNeeded(company, em);
    return company;
  }

  /**
   * Clears a Stripe / paid job package when `job_package_expires_at` is in the past.
   * Idempotent; mutates and saves `company` when a reset is applied.
   */
  async expireJobPackageIfNeeded(
    company: Company,
    em?: EntityManager,
  ): Promise<void> {
    if (!company.jobPackageId) {
      return;
    }
    if (
      !company.jobPackageExpiresAt ||
      company.jobPackageExpiresAt.getTime() > Date.now()
    ) {
      return;
    }
    company.jobPackageId = null;
    company.jobPackageExpiresAt = null;
    company.partnershipFeatured = false;
    company.jobPackage = null;
    company.subscriptionPlanName = null;
    company.subscriptionExpiresAt = null;
    const repo = em ? em.getRepository(Company) : this.companiesRepository;
    await repo.save(company);
  }

  /**
   * Atomically consumes one free monthly publish (UTC `YYYYMM` + count), or
   * throws if the company already used 5 in the current month.
   * Must be called inside a transaction when a job is first set to PUBLISHED.
   */
  async tryConsumeFreeTierJobPublishInTransaction(
    companyId: string,
    clientName: string,
    em: EntityManager,
  ): Promise<void> {
    const yyyymm = getUtcYyyyMm();
    const freeTierLimit =
      await this.clientsService.getFreeTierJobPostsPerMonthByClientName(
        clientName,
      );
    if (freeTierLimit <= 0) {
      throw new ForbiddenException(
        'Free job posts are not available for this platform. Please purchase a job package to publish.',
      );
    }
    const rows: unknown = await em.query(
      `UPDATE "companies"
      SET
        "free_tier_yyyymm" = $3,
        "free_tier_published_count" = CASE
          WHEN
            "free_tier_yyyymm" IS NULL
            OR TRIM("free_tier_yyyymm"::text) = ''
            OR "free_tier_yyyymm"::text IS DISTINCT FROM $3::text
            THEN 1
          ELSE "free_tier_published_count" + 1
        END
      WHERE
        "id" = $1::uuid
        AND "client_name" = $2
        AND (
          "free_tier_yyyymm" IS NULL
          OR TRIM("free_tier_yyyymm"::text) = ''
          OR "free_tier_yyyymm"::text IS DISTINCT FROM $3
          OR ("free_tier_yyyymm" = $3 AND "free_tier_published_count" < $4)
        )
      RETURNING "id"`,
      [companyId, clientName, yyyymm, freeTierLimit],
    );
    const updated = Array.isArray(rows) ? (rows as { id: string }[]).length : 0;
    if (updated === 0) {
      throw new ForbiddenException(
        `You have reached the free limit of ${freeTierLimit} job post(s) this UTC month. The count resets on the first day of the next month, or you can purchase a job package to publish more.`,
      );
    }
  }

  async setJobPackageAdmin(
    clientName: string,
    companyId: string,
    dto: SetCompanyJobPackageDto,
  ): Promise<Company> {
    const company = await this.companiesRepository.findOne({
      where: { id: companyId, clientName },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    if (dto.jobPackageId !== undefined) {
      if (dto.jobPackageId) {
        const pkg = await this.jobPackagesService.ensureBelongsToClient(
          dto.jobPackageId,
          clientName,
        );
        company.jobPackageId = dto.jobPackageId;
        company.partnershipFeatured = pkg.featuredCompanyListing;
      } else {
        company.jobPackageId = null;
        company.partnershipFeatured = false;
      }
    }
    if (dto.jobPackageExpiresAt !== undefined) {
      company.jobPackageExpiresAt =
        dto.jobPackageExpiresAt === null
          ? null
          : new Date(dto.jobPackageExpiresAt);
    }
    return this.companiesRepository.save(company);
  }

  async uploadLogoImage(
    user: JwtUserPayload,
    file: CompanyImageUploadFile,
  ): Promise<{ url: string }> {
    return this.persistCompanyImage(user, file, 'logos', 'logoUrl');
  }

  async uploadHeroImage(
    user: JwtUserPayload,
    file: CompanyImageUploadFile,
  ): Promise<{ url: string }> {
    return this.persistCompanyImage(user, file, 'heroes', 'heroImageUrl');
  }

  private async persistCompanyImage(
    user: JwtUserPayload,
    file: CompanyImageUploadFile,
    kind: 'logos' | 'heroes',
    field: 'logoUrl' | 'heroImageUrl',
  ): Promise<{ url: string }> {
    if (user.role !== UserRole.COMPANY) {
      throw new ForbiddenException();
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }
    if (file.size > COMPANY_IMAGE_MAX_BYTES) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    const mimeOk =
      mime === 'image/jpeg' ||
      mime === 'image/jpg' ||
      mime === 'image/pjpeg' ||
      mime === 'image/png' ||
      mime === 'image/webp' ||
      mime === 'application/octet-stream';
    const detected = detectImage(file.buffer);
    if (!mimeOk || !detected) {
      throw new BadRequestException(
        'Only JPEG, PNG, or WebP images are allowed',
      );
    }

    const company = await this.getMine(user);
    const uploadsRoot = getUploadsRoot();
    const oldPath = resolveStoredCompanyAssetFile(
      uploadsRoot,
      company[field],
      user.clientName,
      kind,
    );

    const { publicPath } = await writeCompanyImage({
      uploadsRoot,
      clientName: user.clientName,
      kind,
      buffer: file.buffer,
      ext: detected.ext,
    });

    company[field] = publicPath;
    await this.companiesRepository.save(company);

    if (oldPath) {
      await deleteFileIfExists(oldPath);
    }

    return { url: publicPath };
  }

  private normalizeLocations(
    locations:
      | Array<{ name: string; address?: string | null }>
      | null
      | undefined,
  ): Company['locationsJson'] {
    if (!locations || locations.length === 0) {
      return null;
    }
    return locations.map((l) => ({
      name: l.name.trim(),
      address: l.address?.trim() ? l.address.trim() : null,
    }));
  }
}
