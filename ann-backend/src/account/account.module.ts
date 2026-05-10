import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { JobPackagesModule } from '../job-packages/job-packages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { NurseProfile, User } from '../database/entities';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { EmployerBootstrapService } from './employer-bootstrap.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, NurseProfile]),
    AuthModule,
    CompaniesModule,
    JobPackagesModule,
    NotificationsModule,
  ],
  controllers: [AccountController],
  providers: [AccountService, EmployerBootstrapService],
})
export class AccountModule {}
