import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Company } from '../database/entities';
import { JobPackagesModule } from '../job-packages/job-packages.module';
import { BillingController } from './billing.controller';
import { PaymentsService } from './payments.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Company]),
    JobPackagesModule,
    AuthModule,
  ],
  controllers: [BillingController, StripeWebhookController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
