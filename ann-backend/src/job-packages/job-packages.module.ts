import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Job, JobPackage } from '../database/entities';
import { JobPackagesController } from './job-packages.controller';
import { JobPackagesService } from './job-packages.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobPackage, Job]), AuthModule],
  controllers: [JobPackagesController],
  providers: [JobPackagesService],
  exports: [JobPackagesService],
})
export class JobPackagesModule {}
