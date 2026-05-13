import { ForbiddenException, Injectable } from '@nestjs/common';
import type { JwtUserPayload } from '../auth/types/jwt-user-payload';
import { UserRole } from '../database/entities';
import { CompaniesService } from '../companies/companies.service';
import { JobPackagesService } from '../job-packages/job-packages.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { PublicUserDto } from '../common/mappers/public-user.mapper';
import { Company, JobPackage } from '../database/entities';
import { AccountService } from './account.service';

export type EmployerBootstrapResponse = {
  account: PublicUserDto;
  company: (Company & { freeTierJobPostsPerMonth: number }) | null;
  jobPackagesCatalog: JobPackage[];
  notificationsUnreadCount: number;
};

@Injectable()
export class EmployerBootstrapService {
  constructor(
    private readonly accountService: AccountService,
    private readonly companiesService: CompaniesService,
    private readonly jobPackagesService: JobPackagesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async get(payload: JwtUserPayload): Promise<EmployerBootstrapResponse> {
    if (payload.role !== UserRole.COMPANY) {
      throw new ForbiddenException('Employer role required');
    }

    const [account, company, jobPackagesCatalog, notificationsUnreadCount] =
      await Promise.all([
        this.accountService.getMe(payload),
        this.companiesService.getMineOrNull(payload),
        this.jobPackagesService.listCatalog(payload.clientName),
        this.notificationsService.countUnreadForUser(
          payload.sub,
          payload.clientName,
        ),
      ]);

    return {
      account,
      company,
      jobPackagesCatalog,
      notificationsUnreadCount,
    };
  }
}
