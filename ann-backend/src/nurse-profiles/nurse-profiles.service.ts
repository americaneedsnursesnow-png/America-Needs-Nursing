import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream, existsSync } from 'fs';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { NurseProfile, User, UserRole } from '../database/entities';
import { stripUserPasswordForResponse } from '../common/strip-user-secrets.util';
import {
  buildPaginatedMeta,
  normalizePagination,
  type PaginatedResult,
} from '../common/types/paginated';
import { UpdateNurseProfileDto } from './dto/update-nurse-profile.dto';
import {
  deleteFileIfExists,
  getUploadsRoot,
  nurseResumeFolderSlug,
  resolveStoredResumeFile,
  writeNurseResumePdf,
} from './nurse-resume.storage';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

/** Multer memoryStorage file shape. */
export type ResumeUploadFile = {
  buffer: Buffer;
  size: number;
  mimetype: string;
};

@Injectable()
export class NurseProfilesService {
  constructor(
    @InjectRepository(NurseProfile)
    private readonly profilesRepository: Repository<NurseProfile>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getMine(user: JwtUserPayload): Promise<NurseProfile> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    const profile = await this.profilesRepository.findOne({
      where: { userId: user.sub, clientName: user.clientName },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async findAll(
    clientName: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<NurseProfile>> {
    const { skip, limit: lim, page: p } = normalizePagination(page, limit);
    const [items, totalItems] = await this.profilesRepository.findAndCount({
      where: { clientName },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
      skip,
      take: lim,
    });
    for (const row of items) {
      stripUserPasswordForResponse(row.user);
    }
    return {
      items,
      meta: buildPaginatedMeta(totalItems, p, lim),
    };
  }

  async updateMine(
    user: JwtUserPayload,
    dto: UpdateNurseProfileDto,
  ): Promise<NurseProfile> {
    const profile = await this.getMine(user);
    if (dto.specialization !== undefined) {
      profile.specialization = dto.specialization?.trim() ?? null;
    }
    if (dto.licenseNumber !== undefined) {
      profile.licenseNumber = dto.licenseNumber?.trim() ?? null;
    }
    if (dto.yearsExperience !== undefined) {
      profile.yearsExperience = dto.yearsExperience;
    }
    if (dto.description !== undefined) {
      profile.description = dto.description?.trim() ?? null;
    }
    if (dto.cultureText !== undefined) {
      profile.cultureText = dto.cultureText?.trim() ?? null;
    }
    if (dto.city !== undefined) {
      profile.city = dto.city?.trim() ?? null;
    }
    if (dto.stateRegion !== undefined) {
      profile.stateRegion = dto.stateRegion?.trim() ?? null;
    }
    if (dto.dateOfBirth !== undefined) {
      const raw = dto.dateOfBirth?.trim();
      profile.dateOfBirth =
        raw && raw.length > 0 ? new Date(`${raw}T12:00:00.000Z`) : null;
    }
    if (dto.licenseState !== undefined) {
      profile.licenseState = dto.licenseState?.trim() ?? null;
    }
    if (dto.certifications !== undefined) {
      profile.certifications = dto.certifications?.trim() ?? null;
    }
    return this.profilesRepository.save(profile);
  }

  async clearResume(user: JwtUserPayload): Promise<NurseProfile> {
    const profile = await this.getMine(user);
    const uploadsRoot = getUploadsRoot();
    const oldPath = resolveStoredResumeFile(uploadsRoot, profile.resumeUrl);
    if (oldPath) {
      await deleteFileIfExists(oldPath);
    }
    profile.resumeUrl = null;
    return this.profilesRepository.save(profile);
  }

  async getResumeReadStream(user: JwtUserPayload): Promise<{
    stream: ReturnType<typeof createReadStream>;
    filename: string;
  }> {
    const profile = await this.getMine(user);
    return this.resumeFileStreamFromProfile(profile);
  }

  /**
   * Employer (or other authorized callers) after verifying job ownership.
   */
  async getResumeReadStreamForNurseUser(
    nurseUserId: string,
    clientName: string,
  ): Promise<{
    stream: ReturnType<typeof createReadStream>;
    filename: string;
  }> {
    const profile = await this.profilesRepository.findOne({
      where: { userId: nurseUserId, clientName },
    });
    if (!profile) {
      throw new NotFoundException('Nurse profile not found');
    }
    return this.resumeFileStreamFromProfile(profile);
  }

  private resumeFileStreamFromProfile(profile: NurseProfile): {
    stream: ReturnType<typeof createReadStream>;
    filename: string;
  } {
    const ref = profile.resumeUrl?.trim();
    if (!ref) {
      throw new NotFoundException('No resume on file');
    }
    if (/^https?:\/\//i.test(ref)) {
      throw new NotFoundException('Resume is stored as an external link');
    }
    const uploadsRoot = getUploadsRoot();
    const abs = resolveStoredResumeFile(uploadsRoot, ref);
    if (!abs || !existsSync(abs)) {
      throw new NotFoundException('Resume file missing');
    }
    return {
      stream: createReadStream(abs),
      filename: 'resume.pdf',
    };
  }

  async uploadResumePdf(
    user: JwtUserPayload,
    file: ResumeUploadFile,
  ): Promise<NurseProfile> {
    if (user.role !== UserRole.NURSE) {
      throw new ForbiddenException();
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('PDF file is required');
    }
    if (file.size > MAX_RESUME_BYTES) {
      throw new BadRequestException('Resume must be 5 MB or smaller');
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    const pdfSig = file.buffer.subarray(0, 5).toString('utf8');
    const looksPdf = pdfSig.startsWith('%PDF');
    const mimeOk =
      mime === 'application/pdf' ||
      mime === 'application/x-pdf' ||
      (mime === 'application/octet-stream' && looksPdf);
    if (!mimeOk || !looksPdf) {
      throw new BadRequestException('Only PDF files are allowed');
    }

    const dbUser = await this.usersRepository.findOne({
      where: { id: user.sub, clientName: user.clientName },
    });
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.getMine(user);
    const uploadsRoot = getUploadsRoot();
    const oldPath = resolveStoredResumeFile(uploadsRoot, profile.resumeUrl);

    const folderSlug = nurseResumeFolderSlug(dbUser.fullName, user.sub);
    const { publicPath } = await writeNurseResumePdf({
      uploadsRoot,
      folderSlug,
      buffer: file.buffer,
    });

    profile.resumeUrl = publicPath;
    await this.profilesRepository.save(profile);

    if (oldPath) {
      await deleteFileIfExists(oldPath);
    }

    return profile;
  }
}
