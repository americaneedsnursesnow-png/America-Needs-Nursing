import {
  BadRequestException,
  Controller,
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
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { NurseImportService } from './nurse-import.service';

const MAX_CSV_BYTES = 5 * 1024 * 1024;

@Controller('admin/nurse-import')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class NurseImportController {
  constructor(private readonly nurseImportService: NurseImportService) {}

  @Post('csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_CSV_BYTES },
    }),
  )
  importFromCsv(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('CSV file is required');
    }
    return this.nurseImportService.importNursesFromCsv(
      { buffer: file.buffer, size: file.size, mimetype: file.mimetype },
      user.clientName,
    );
  }
}
