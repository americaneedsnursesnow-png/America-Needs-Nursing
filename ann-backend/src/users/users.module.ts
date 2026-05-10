import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Client, User } from '../database/entities';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Client, User]),
    AuthModule,
    NewsletterModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
