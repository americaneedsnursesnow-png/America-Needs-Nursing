import { Module } from '@nestjs/common';
import { BlogModule } from '../blog/blog.module';
import { CompaniesModule } from '../companies/companies.module';
import { JobsModule } from '../jobs/jobs.module';
import { PublicController } from './public.controller';

@Module({
  imports: [CompaniesModule, JobsModule, BlogModule],
  controllers: [PublicController],
})
export class PublicModule {}
