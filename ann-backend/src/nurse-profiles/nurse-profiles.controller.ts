import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { UpdateNurseProfileDto } from './dto/update-nurse-profile.dto';
import {
  NurseProfilesService,
  type ResumeUploadFile,
} from './nurse-profiles.service';
import type { PaginatedResult } from '../common/types/paginated';
import { NurseProfile } from '../database/entities';

const RESUME_MAX_BYTES = 5 * 1024 * 1024;

@Controller('nurse-profiles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NurseProfilesController {
  constructor(private readonly nurseProfilesService: NurseProfilesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(
    @CurrentUser() user: JwtUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResult<NurseProfile>> {
    return this.nurseProfilesService.findAll(
      user.clientName,
      parseInt(page ?? '1', 10),
      parseInt(limit ?? '10', 10),
    );
  }

  @Get('me/resume')
  @Roles(UserRole.NURSE)
  async downloadMyResume(
    @CurrentUser() user: JwtUserPayload,
  ): Promise<StreamableFile> {
    const { stream, filename } =
      await this.nurseProfilesService.getResumeReadStream(user);
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  @Post('me/resume')
  @Roles(UserRole.NURSE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: RESUME_MAX_BYTES },
    }),
  )
  uploadResume(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: RESUME_MAX_BYTES }),
          // Many clients send application/octet-stream; service enforces %PDF magic bytes.
          new FileTypeValidator({
            fileType: new RegExp(
              '^(application/pdf|application/x-pdf|application/octet-stream)$',
            ),
          }),
        ],
      }),
    )
    file: ResumeUploadFile,
  ) {
    return this.nurseProfilesService.uploadResumePdf(user, file);
  }

  @Delete('me/resume')
  @Roles(UserRole.NURSE)
  deleteMyResume(@CurrentUser() user: JwtUserPayload) {
    return this.nurseProfilesService.clearResume(user);
  }

  @Get('me')
  @Roles(UserRole.NURSE)
  getMine(@CurrentUser() user: JwtUserPayload) {
    return this.nurseProfilesService.getMine(user);
  }

  @Patch('me')
  @Roles(UserRole.NURSE)
  updateMine(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: UpdateNurseProfileDto,
  ) {
    return this.nurseProfilesService.updateMine(user, dto);
  }
}
