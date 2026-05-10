import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { ApplicationsService } from './applications.service';
import { ApplyJobDto } from './dto/apply-job.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Controller('applications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post('jobs/:jobId')
  @Roles(UserRole.NURSE)
  apply(
    @CurrentUser() user: JwtUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() dto: ApplyJobDto,
  ) {
    return this.applicationsService.apply(user, jobId, dto);
  }

  @Get('mine')
  @Roles(UserRole.NURSE)
  listMine(@CurrentUser() user: JwtUserPayload) {
    return this.applicationsService.listMine(user);
  }

  @Get('jobs/:jobId')
  @Roles(UserRole.EMPLOYER)
  listForJob(
    @CurrentUser() user: JwtUserPayload,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.applicationsService.listForJobEmployer(user, jobId);
  }

  @Get(':id/nurse-resume')
  @Roles(UserRole.EMPLOYER)
  async downloadNurseResume(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const { stream, filename } =
      await this.applicationsService.getNurseResumePdfForEmployer(user, id);
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `inline; filename="${filename}"`,
    });
  }

  @Patch(':id/status')
  @Roles(UserRole.EMPLOYER)
  updateStatus(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatusEmployer(user, id, dto);
  }
}
