import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { NurseImportController } from './nurse-import.controller';
import { NurseImportService } from './nurse-import.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), NewsletterModule],
  controllers: [NurseImportController],
  providers: [NurseImportService],
})
export class NurseImportModule {}
