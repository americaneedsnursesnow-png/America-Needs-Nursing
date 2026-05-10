import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { getUploadsRoot } from '../nurse-profiles/nurse-resume.storage';
import { publicUrlForNurseCommunityImage } from './nurse-community-image.storage';
import { CommunityChatService } from './community-chat.service';
import { CreateNurseCommunityDto } from './dto/create-nurse-community.dto';
import { UpdateNurseCommunityDto } from './dto/update-nurse-community.dto';
import { NurseCommunityService } from './nurse-community.service';
import { SkipRateLimit } from '../rate-limit/decorators/skip-rate-limit.decorator';

const COMMUNITY_IMAGE_MAX = 2 * 1024 * 1024;

@SkipRateLimit()
@Controller('community/nurse-communities')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NurseCommunityController {
  constructor(
    private readonly nurseCommunityService: NurseCommunityService,
    private readonly chatService: CommunityChatService,
  ) {}

  @Get()
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  list(@CurrentUser() user: JwtUserPayload) {
    return this.nurseCommunityService.listForNurse(user);
  }

  @Get(':id')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  getOne(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nurseCommunityService.getOne(user, id);
  }

  @Get(':id/members')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  listMembers(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nurseCommunityService.listMembers(user, id);
  }

  @Get(':id/chat/history')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  async chatHistory(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit', new DefaultValuePipe('100')) limitRaw: string,
  ) {
    const limit = Math.min(
      Math.max(parseInt(String(limitRaw), 10) || 100, 1),
      200,
    );
    return this.chatService.getRecentHistoryForNurseCommunity(
      user,
      id,
      limit,
    );
  }

  @Post()
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  create(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateNurseCommunityDto,
  ) {
    return this.nurseCommunityService.create(user, dto);
  }

  @Patch(':id')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNurseCommunityDto,
  ) {
    return this.nurseCommunityService.update(user, id, dto);
  }

  @Post(':id/join')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  join(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nurseCommunityService.join(user, id);
  }

  @Post(':id/leave')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  leave(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nurseCommunityService.leave(user, id);
  }

  @Delete(':id/members/:userId')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  removeMember(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.nurseCommunityService.removeMember(user, id, userId);
  }

  @Delete(':id')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  delete(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.nurseCommunityService.deleteByOwner(user, id);
  }

  @Post(':id/image')
  @Roles(UserRole.NURSE, UserRole.SUPER_ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: COMMUNITY_IMAGE_MAX },
    }),
  )
  async uploadImage(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: COMMUNITY_IMAGE_MAX }),
          new FileTypeValidator({
            fileType: new RegExp(
              '^(image/jpeg|image/jpg|image/pjpeg|image/png|image/webp|application/octet-stream)$',
            ),
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const community = await this.nurseCommunityService.getOne(user, id);
    if (!community.isOwner && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only the community owner can upload an image');
    }
    const sub = join(getUploadsRoot(), 'nurse-communities');
    if (!existsSync(sub)) {
      mkdirSync(sub, { recursive: true });
    }
    const ext =
      file.mimetype === 'image/png'
        ? 'png'
        : file.mimetype === 'image/webp'
          ? 'webp'
          : 'jpg';
    const name = `${id.replace(/-/g, '')}-${Date.now()}.${ext}`;
    const dest = join(sub, name);
    if (!file.buffer) {
      throw new Error('Missing file buffer');
    }
    await writeFile(dest, file.buffer);
    const url = publicUrlForNurseCommunityImage(name);
    await this.nurseCommunityService.update(user, id, { imageUrl: url });
    return { imageUrl: url };
  }
}
