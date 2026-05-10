import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { NurseDatabaseRecord } from '../database/entities';
import { NurseDatabaseController } from './nurse-database.controller';
import { NurseDatabaseService } from './nurse-database.service';

@Module({
  imports: [TypeOrmModule.forFeature([NurseDatabaseRecord]), AuthModule],
  controllers: [NurseDatabaseController],
  providers: [NurseDatabaseService],
})
export class NurseDatabaseModule {}
