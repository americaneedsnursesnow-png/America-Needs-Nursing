import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { Company, CompanyApprovalStatus, UserRole } from '../database/entities';
import {
  CompaniesService,
  type CompanyImageUploadFile,
} from './companies.service';
import type { PaginatedResult } from '../common/types/paginated';
import { CreateCompanyDto } from './dto/create-company.dto';
import { SetCompanyApprovalDto } from './dto/set-company-approval.dto';
import { SetCompanyJobPackageDto } from './dto/set-company-job-package.dto';
import { SetSubscriptionDto } from './dto/set-subscription.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

const COMPANY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

@Controller('companies')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(
    @CurrentUser() user: JwtUserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedResult<Company>> {
    return this.companiesService.findAll(
      user.clientName,
      parseInt(page ?? '1', 10),
      parseInt(limit ?? '10', 10),
    );
  }

  private listAdminByOptionalStatus(
    user: JwtUserPayload,
    approvalStatus?: string,
  ) {
    if (approvalStatus === undefined || approvalStatus === '') {
      return this.companiesService.listAllAdmin(user.clientName);
    }
    if (
      !Object.values(CompanyApprovalStatus).includes(
        approvalStatus as CompanyApprovalStatus,
      )
    ) {
      throw new BadRequestException(
        `approvalStatus must be one of: ${Object.values(CompanyApprovalStatus).join(', ')}`,
      );
    }
    return this.companiesService.listAllAdmin(
      user.clientName,
      approvalStatus as CompanyApprovalStatus,
    );
  }

  @Post()
  @Roles(UserRole.EMPLOYER)
  create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateCompanyDto) {
    return this.companiesService.createForEmployer(user, dto);
  }

  @Get('me')
  @Roles(UserRole.EMPLOYER)
  getMine(@CurrentUser() user: JwtUserPayload) {
    return this.companiesService.getMine(user);
  }

  @Patch('me')
  @Roles(UserRole.EMPLOYER)
  updateMine(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.updateMine(user, dto);
  }

  @Post('me/logo')
  @Roles(UserRole.EMPLOYER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: COMPANY_IMAGE_MAX_BYTES },
    }),
  )
  uploadLogo(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: COMPANY_IMAGE_MAX_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(
              '^(image/jpeg|image/jpg|image/pjpeg|image/png|image/webp|application/octet-stream)$',
            ),
          }),
        ],
      }),
    )
    file: CompanyImageUploadFile,
  ) {
    return this.companiesService.uploadLogoImage(user, file);
  }

  @Post('me/hero')
  @Roles(UserRole.EMPLOYER)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: COMPANY_IMAGE_MAX_BYTES },
    }),
  )
  uploadHero(
    @CurrentUser() user: JwtUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: COMPANY_IMAGE_MAX_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(
              '^(image/jpeg|image/jpg|image/pjpeg|image/png|image/webp|application/octet-stream)$',
            ),
          }),
        ],
      }),
    )
    file: CompanyImageUploadFile,
  ) {
    return this.companiesService.uploadHeroImage(user, file);
  }

  @Get('admin/pending')
  @Roles(UserRole.SUPER_ADMIN)
  listPending(@CurrentUser() user: JwtUserPayload) {
    return this.companiesService.listPendingAdmin(user.clientName);
  }

  /** Rejected companies only (admin UI “Rejected” tab). */
  @Get('admin/rejected')
  @Roles(UserRole.SUPER_ADMIN)
  listRejectedAdmin(@CurrentUser() user: JwtUserPayload) {
    return this.companiesService.listAllAdmin(
      user.clientName,
      CompanyApprovalStatus.REJECTED,
    );
  }

  /** Accepted / verified companies (`approvalStatus: approved`). */
  @Get('admin/accepted')
  @Roles(UserRole.SUPER_ADMIN)
  listAcceptedAdmin(@CurrentUser() user: JwtUserPayload) {
    return this.companiesService.listAllAdmin(
      user.clientName,
      CompanyApprovalStatus.APPROVED,
    );
  }

  /**
   * List companies for admin UI with optional filter (matches frontend
   * `GET /companies/admin/list?approvalStatus=…`).
   */
  @Get('admin/list')
  @Roles(UserRole.SUPER_ADMIN)
  listForAdminQuery(
    @CurrentUser() user: JwtUserPayload,
    @Query('approvalStatus') approvalStatus?: string,
  ) {
    return this.listAdminByOptionalStatus(user, approvalStatus);
  }

  /**
   * List all companies for admin UI (status changes via PATCH admin/:id/approval).
   * Optional query: ?approvalStatus=pending_review|approved|rejected
   */
  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN)
  listAllForAdmin(
    @CurrentUser() user: JwtUserPayload,
    @Query('approvalStatus') approvalStatus?: string,
  ) {
    return this.listAdminByOptionalStatus(user, approvalStatus);
  }

  @Patch('admin/:id/job-package')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  setJobPackage(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetCompanyJobPackageDto,
  ) {
    return this.companiesService.setJobPackageAdmin(user.clientName, id, dto);
  }

  @Patch('admin/:id/approval')
  @Roles(UserRole.SUPER_ADMIN)
  setApproval(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetCompanyApprovalDto,
  ) {
    return this.companiesService.setApprovalAdmin(user.clientName, id, dto);
  }

  @Patch('admin/:id/subscription')
  @Roles(UserRole.SUPER_ADMIN)
  setSubscription(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetSubscriptionDto,
  ) {
    return this.companiesService.setSubscriptionAdmin(user.clientName, id, dto);
  }
}
