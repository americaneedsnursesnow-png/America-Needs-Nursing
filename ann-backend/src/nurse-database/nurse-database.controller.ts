import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../database/entities';
import { BulkImportNurseRecordsDto } from './dto/bulk-import-nurse-records.dto';
import { NurseDatabaseService } from './nurse-database.service';

@Controller('admin/nurse-database')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class NurseDatabaseController {
  constructor(private readonly nurseDatabaseService: NurseDatabaseService) {}

  @Post('import')
  importBulk(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: BulkImportNurseRecordsDto,
  ) {
    return this.nurseDatabaseService.bulkImport(user, dto);
  }

  @Get('records')
  list(
    @CurrentUser() user: JwtUserPayload,
    @Query('take') take?: string,
    @Query('skip') skip?: string,
  ) {
    const t = take ? parseInt(take, 10) : 100;
    const s = skip ? parseInt(skip, 10) : 0;
    return this.nurseDatabaseService.list(user, t, s);
  }
}
