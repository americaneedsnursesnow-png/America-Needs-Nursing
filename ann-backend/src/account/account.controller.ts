import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EmployerBootstrapService } from './employer-bootstrap.service';
import { AccountService, type ProfilePhotoUploadFile } from './account.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;
const PROFILE_BANNER_MAX_BYTES = 3 * 1024 * 1024;

@Controller('account')
@UseGuards(AuthGuard('jwt'))
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly employerBootstrapService: EmployerBootstrapService,
  ) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtUserPayload) {
    return this.accountService.getMe(user);
  }

  /** One round-trip for employer dashboard: account, company, job packages catalog, unread notifications. */
  @Get('employer/bootstrap')
  getEmployerBootstrap(@CurrentUser() user: JwtUserPayload) {
    return this.employerBootstrapService.get(user);
  }

  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: PROFILE_PHOTO_MAX_BYTES },
    }),
  )
  uploadMyPhoto(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: PROFILE_PHOTO_MAX_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(
              '^(image/jpeg|image/jpg|image/pjpeg|image/png|image/webp|application/octet-stream)$',
            ),
          }),
        ],
      }),
    )
    file: ProfilePhotoUploadFile,
  ) {
    return this.accountService.uploadProfilePhoto(user, file);
  }

  @Delete('me/photo')
  deleteMyPhoto(@CurrentUser() user: JwtUserPayload) {
    return this.accountService.clearProfilePhoto(user);
  }

  @Post('me/banner')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: PROFILE_BANNER_MAX_BYTES },
    }),
  )
  uploadMyBanner(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: PROFILE_BANNER_MAX_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(
              '^(image/jpeg|image/jpg|image/pjpeg|image/png|image/webp|application/octet-stream)$',
            ),
          }),
        ],
      }),
    )
    file: ProfilePhotoUploadFile,
  ) {
    return this.accountService.uploadProfileBanner(user, file);
  }

  @Delete('me/banner')
  deleteMyBanner(@CurrentUser() user: JwtUserPayload) {
    return this.accountService.clearProfileBanner(user);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtUserPayload, @Body() dto: UpdateAccountDto) {
    return this.accountService.updateMe(user, dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.accountService.changePassword(user, dto);
  }
}
