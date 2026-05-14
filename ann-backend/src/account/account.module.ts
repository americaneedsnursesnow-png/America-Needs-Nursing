import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { JobPackagesModule } from '../job-packages/job-packages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { Company, Job, NurseProfile, User } from '../database/entities';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AdminDashboardStatsService } from './admin-dashboard-stats.service';
import { EmployerBootstrapService } from './employer-bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, NurseProfile, Job, Company]),
    AuthModule,
    CompaniesModule,
    JobPackagesModule,
    NotificationsModule,
    PaymentsModule,
  ],
  controllers: [AccountController],
  providers: [AccountService, EmployerBootstrapService, AdminDashboardStatsService],
})
export class AccountModule {}
