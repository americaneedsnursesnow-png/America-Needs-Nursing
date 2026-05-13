import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user, dto);
  }

  @Get('mine')
  @Roles(UserRole.COMPANY)
  listMine(@CurrentUser() user: JwtUserPayload) {
    return this.jobsService.listMine(user);
  }

  @Get('mine/:id')
  @Roles(UserRole.COMPANY)
  getMine(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.jobsService.getEmployerJob(user, id);
  }

  @Patch('mine/:id')
  @Roles(UserRole.COMPANY)
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(user, id, dto);
  }

  @Delete('mine/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.COMPANY)
  deleteMine(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.jobsService.deleteMine(user, id);
  }

  @Patch('admin/:id/approve-listing')
  @Roles(UserRole.SUPER_ADMIN)
  approveListing(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.jobsService.approveListingAdmin(user.clientName, id);
  }
}
