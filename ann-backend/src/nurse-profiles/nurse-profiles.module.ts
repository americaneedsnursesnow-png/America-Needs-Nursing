import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { NurseProfile, User } from '../database/entities';
import { NurseProfilesController } from './nurse-profiles.controller';
import { NurseProfilesService } from './nurse-profiles.service';

@Module({
  imports: [TypeOrmModule.forFeature([NurseProfile, User]), AuthModule],
  controllers: [NurseProfilesController],
  providers: [NurseProfilesService],
  exports: [NurseProfilesService],
})
export class NurseProfilesModule {}
