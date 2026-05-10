import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Company, User } from '../database/entities';
import { JobPackagesModule } from '../job-packages/job-packages.module';
import { MailModule } from '../mail/mail.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User]),
    ConfigModule,
    MailModule,
    AuthModule,
    JobPackagesModule,
    ClientsModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
