import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { Company } from '../database/entities';
import { JobPackagesModule } from '../job-packages/job-packages.module';
import { BillingController } from './billing.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Company]),
    JobPackagesModule,
    AuthModule,
    CompaniesModule,
  ],
  controllers: [BillingController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
