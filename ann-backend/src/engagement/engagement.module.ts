import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { CompanyFollow, Job, SavedJob } from '../database/entities';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedJob, CompanyFollow, Job]),
    AuthModule,
    CompaniesModule,
  ],
  controllers: [EngagementController],
  providers: [EngagementService],
})
export class EngagementModule {}
