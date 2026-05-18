import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { detectImage } from '../common/image-detect';
import {
  toPublicUser,
  type PublicUserDto,
} from '../common/mappers/public-user.mapper';
import { NurseProfile, User, UserRole } from '../database/entities';
import { deleteStoredFile } from '../nurse-profiles/nurse-resume.storage';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import {
  getUploadsRoot,
  writeProfilePhoto,
} from './profile-photo.storage';

const BCRYPT_ROUNDS = 10;
const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;
const MAX_PROFILE_BANNER_BYTES = 3 * 1024 * 1024;

/** Multer memoryStorage file shape. */
export type ProfilePhotoUploadFile = {
  buffer: Buffer;
  size: number;
  mimetype: string;
};

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NurseProfile)
    private readonly nurseProfilesRepository: Repository<NurseProfile>,
  ) {}

  private async mapToPublic(user: User): Promise<PublicUserDto> {
    if (user.role !== UserRole.NURSE) {
      return toPublicUser(user, null);
    }
    const profile = await this.nurseProfilesRepository.findOne({
      where: { userId: user.id, clientName: user.clientName },
    });
    return toPublicUser(user, profile);
  }

  private async findSelf(payload: JwtUserPayload): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, clientName: payload.clientName },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getMe(payload: JwtUserPayload): Promise<PublicUserDto> {
    const user = await this.findSelf(payload);
    return this.mapToPublic(user);
  }

  async updateMe(
    payload: JwtUserPayload,
    dto: UpdateAccountDto,
  ): Promise<PublicUserDto> {
    const user = await this.findSelf(payload);
    if (dto.fullName !== undefined) {
      const v = dto.fullName;
      user.fullName =
        v === null || v === undefined
          ? null
          : v.trim() === ''
            ? null
            : v.trim();
    }
    if (dto.description !== undefined) {
      const v = dto.description;
      user.description =
        v === null || v === undefined
          ? null
          : v.trim() === ''
            ? null
            : v.trim();
    }
    if (dto.cultureText !== undefined) {
      const v = dto.cultureText;
      user.cultureText =
        v === null || v === undefined
          ? null
          : v.trim() === ''
            ? null
            : v.trim();
    }
    await this.usersRepository.save(user);
    return this.mapToPublic(user);
  }

  async changePassword(
    payload: JwtUserPayload,
    dto: ChangePasswordDto,
  ): Promise<{ ok: true }> {
    const user = await this.findSelf(payload);
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Password change is not available for this account',
      );
    }
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersRepository.save(user);
    return { ok: true };
  }

  async uploadProfilePhoto(
    payload: JwtUserPayload,
    file: ProfilePhotoUploadFile,
  ): Promise<PublicUserDto> {
    const user = await this.findSelf(payload);
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }
    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      throw new BadRequestException('Photo must be 2 MB or smaller');
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    const detected = detectImage(file.buffer);
    const mimeOk =
      mime === 'image/jpeg' ||
      mime === 'image/jpg' ||
      mime === 'image/pjpeg' ||
      mime === 'image/png' ||
      mime === 'image/webp' ||
      mime === 'application/octet-stream';
    if (!mimeOk || !detected) {
      throw new BadRequestException(
        'Only JPEG, PNG, or WebP images are allowed',
      );
    }

    const uploadsRoot = getUploadsRoot();
    const oldUrl = user.profilePhotoUrl;

    const { publicPath } = await writeProfilePhoto({
      uploadsRoot,
      userId: user.id,
      buffer: file.buffer,
      ext: detected.ext,
      contentType: mime.startsWith('image/') ? mime : `image/${detected.ext.slice(1)}`,
    });

    user.profilePhotoUrl = publicPath;
    await this.usersRepository.save(user);

    if (oldUrl) {
      await deleteStoredFile(oldUrl);
    }

    return this.mapToPublic(user);
  }

  async clearProfilePhoto(payload: JwtUserPayload): Promise<PublicUserDto> {
    const user = await this.findSelf(payload);
    if (user.profilePhotoUrl) {
      await deleteStoredFile(user.profilePhotoUrl);
    }
    user.profilePhotoUrl = null;
    await this.usersRepository.save(user);
    return this.mapToPublic(user);
  }

  async uploadProfileBanner(
    payload: JwtUserPayload,
    file: ProfilePhotoUploadFile,
  ): Promise<PublicUserDto> {
    const user = await this.findSelf(payload);
    if (user.role !== UserRole.NURSE) {
      throw new BadRequestException('Banner images are only for nurse profiles');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Image file is required');
    }
    if (file.size > MAX_PROFILE_BANNER_BYTES) {
      throw new BadRequestException('Banner must be 3 MB or smaller');
    }
    const mime = (file.mimetype ?? '').toLowerCase();
    const detected = detectImage(file.buffer);
    const mimeOk =
      mime === 'image/jpeg' ||
      mime === 'image/jpg' ||
      mime === 'image/pjpeg' ||
      mime === 'image/png' ||
      mime === 'image/webp' ||
      mime === 'application/octet-stream';
    if (!mimeOk || !detected) {
      throw new BadRequestException(
        'Only JPEG, PNG, or WebP images are allowed',
      );
    }

    const uploadsRoot = getUploadsRoot();
    const oldUrl = user.profileBannerUrl;

    const { publicPath } = await writeProfilePhoto({
      uploadsRoot,
      userId: user.id,
      buffer: file.buffer,
      ext: detected.ext,
      contentType: mime.startsWith('image/') ? mime : `image/${detected.ext.slice(1)}`,
      basenamePrefix: 'banner',
    });

    user.profileBannerUrl = publicPath;
    await this.usersRepository.save(user);

    if (oldUrl) {
      await deleteStoredFile(oldUrl);
    }

    return this.mapToPublic(user);
  }

  async clearProfileBanner(payload: JwtUserPayload): Promise<PublicUserDto> {
    const user = await this.findSelf(payload);
    if (user.profileBannerUrl) {
      await deleteStoredFile(user.profileBannerUrl);
    }
    user.profileBannerUrl = null;
    await this.usersRepository.save(user);
    return this.mapToPublic(user);
  }
}
