import {
  Body,
  Controller,
  Get,
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
import { CreateJobPackageDto } from './dto/create-job-package.dto';
import { UpdateJobPackageDto } from './dto/update-job-package.dto';
import { JobPackagesService } from './job-packages.service';

@Controller('job-packages')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class JobPackagesController {
  constructor(private readonly jobPackagesService: JobPackagesService) {}

  /** Active packages for employers (pricing / upgrade UI). */
  @Get('catalog')
  @Roles(UserRole.EMPLOYER)
  listCatalog(@CurrentUser() user: JwtUserPayload) {
    return this.jobPackagesService.listCatalog(user.clientName);
  }

  /** Full list for staff (create/edit in admin). */
  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  listAdmin(@CurrentUser() user: JwtUserPayload) {
    return this.jobPackagesService.listAllForStaff(user.clientName);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: CreateJobPackageDto,
  ) {
    return this.jobPackagesService.createForClient(user.clientName, dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobPackageDto,
  ) {
    return this.jobPackagesService.updateForClient(user.clientName, id, dto);
  }
}
