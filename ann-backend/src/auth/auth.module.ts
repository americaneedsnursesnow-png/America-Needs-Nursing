import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client, NurseProfile, User } from '../database/entities';
import { MailModule } from '../mail/mail.module';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Client, NurseProfile]),
    MailModule,
    forwardRef(() => NewsletterModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')?.trim();
        if (!secret) {
          throw new Error('JWT_SECRET is required');
        }
        const expires = config.get<string>('JWT_EXPIRES_IN')?.trim() ?? '7d';
        return {
          secret,
          signOptions: {
            expiresIn: expires as NonNullable<
              import('@nestjs/jwt').JwtSignOptions['expiresIn']
            >,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule, JwtStrategy],
})
export class AuthModule {}
