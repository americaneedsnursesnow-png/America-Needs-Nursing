import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import type { Cache } from 'cache-manager';
import { createHash, randomInt } from 'node:crypto';
import { Repository } from 'typeorm';
import {
  toPublicUser,
  type PublicUserDto,
} from '../common/mappers/public-user.mapper';
import { getConfigNumber } from '../common/utils/env.util';
import { Client, NurseProfile, User, UserRole } from '../database/entities';
import { MailService } from '../mail/mail.service';
import { NewsletterService } from '../newsletter/newsletter.service';
import type { JwtUserPayload } from './types/jwt-user-payload';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_EXPIRES = '1h';

type PasswordResetJwtPayload = {
  sub: string;
  clientName: string;
  typ: 'pwd_reset';
};

type CachedOtpRecord = {
  codeHash: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(NurseProfile)
    private readonly nurseProfilesRepository: Repository<NurseProfile>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly newsletterService: NewsletterService,
    private readonly config: ConfigService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ accessToken: string; user: PublicUserDto }> {
    const email = dto.email.trim().toLowerCase();
    const clientName = dto.clientName.trim();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.usersRepository.manager.transaction(
      async (manager) => {
        const clientRepo = manager.getRepository(Client);
        const userRepo = manager.getRepository(User);
        const profileRepo = manager.getRepository(NurseProfile);

        const matchingClients = await clientRepo.find({
          where: { name: clientName },
          take: 2,
        });
        if (matchingClients.length > 1) {
          throw new ConflictException(
            'Multiple clients share this name; assign a unique client name first',
          );
        }
        if (matchingClients.length === 0) {
          await clientRepo.save(clientRepo.create({ name: clientName }));
        }

        const exists = await userRepo.exist({
          where: { clientName, email },
        });
        if (exists) {
          throw new ConflictException(
            'A user with this email already exists for this client',
          );
        }

        const created = await userRepo.save(
          userRepo.create({
            clientName,
            email,
            role: dto.role,
            passwordHash,
          }),
        );

        if (dto.role === UserRole.NURSE) {
          await profileRepo.save(
            profileRepo.create({
              userId: created.id,
              clientName,
              specialization: null,
              licenseNumber: null,
              yearsExperience: null,
              resumeUrl: null,
              communityVerified: true,
            }),
          );
        }

        return created;
      },
    );

    const accessToken = await this.signToken(user);
    try {
      await this.newsletterService.ensureSubscriber(clientName, email);
    } catch (err: unknown) {
      this.logger.warn(
        `ensureSubscriber after register failed for ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    if (user.role === UserRole.NURSE) {
      try {
        const base =
          this.config.get<string>('FRONTEND_URL')?.trim() ||
          'http://localhost:3001';
        const origin = base.replace(/\/$/, '');
        const signInUrl = `${origin}/sign-in`;
        const html = `
      <p>Hello,</p>
      <p>Your nurse account on <strong>${this.escapeHtml(
        clientName,
      )}</strong> was created successfully (${this.escapeHtml(email)}).</p>
      <p>You can sign in to browse jobs, apply, and use the nurse community when available.</p>
      <p><a href="${signInUrl}">Sign in</a></p>
      <p>If you did not create this account, please contact support.</p>
    `;
        await this.mailService.sendHtmlTo(
          email,
          'Welcome — your nurse account is ready',
          html,
        );
      } catch (err: unknown) {
        this.logger.warn(
          `Welcome email after nurse register failed for ${email}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    const nurseProfile =
      user.role === UserRole.NURSE
        ? await this.nurseProfilesRepository.findOne({
            where: { userId: user.id, clientName: user.clientName },
          })
        : null;
    return { accessToken, user: toPublicUser(user, nurseProfile) };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: PublicUserDto }> {
    const email = dto.email.trim().toLowerCase();
    const clientName = dto.clientName.trim();

    const user = await this.usersRepository.findOne({
      where: { clientName, email },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.signToken(user);
    const nurseProfile =
      user.role === UserRole.NURSE
        ? await this.nurseProfilesRepository.findOne({
            where: { userId: user.id, clientName: user.clientName },
          })
        : null;
    return { accessToken, user: toPublicUser(user, nurseProfile) };
  }

  /**
   * Always returns the same message so callers cannot infer whether the email exists.
   * Sends mail when SMTP is configured and the user has a password set.
   */
  async requestPasswordReset(
    dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const clientName = dto.clientName.trim();
    const generic =
      'If an account exists for that email, we sent password reset instructions.';

    const user = await this.usersRepository.findOne({
      where: { clientName, email },
    });
    if (!user?.passwordHash) {
      return { message: generic };
    }

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        clientName: user.clientName,
        typ: 'pwd_reset' as const,
      } satisfies PasswordResetJwtPayload,
      { expiresIn: RESET_TOKEN_EXPIRES },
    );

    const base =
      this.config.get<string>('FRONTEND_URL')?.trim() ||
      'http://localhost:3001';
    const origin = base.replace(/\/$/, '');
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

    const html = `
      <p>Hello,</p>
      <p>We received a request to reset the password for your <strong>${this.escapeHtml(
        clientName,
      )}</strong> account (${this.escapeHtml(email)}).</p>
      <p><a href="${resetUrl}">Set a new password</a></p>
      <p>This link expires in one hour. If you did not request a reset, you can ignore this email.</p>
    `;

    try {
      await this.mailService.sendHtmlTo(
        user.email,
        'Reset your password',
        html,
      );
    } catch (err) {
      this.logger.error(
        `Password reset email failed for ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    return { message: generic };
  }

  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const clientName = dto.clientName.trim();
    const otpTtlMs = this.getOtpTtlMs();
    const generic =
      'If an account exists for that email, we sent a verification code.';

    const user = await this.usersRepository.findOne({
      where: { clientName, email },
    });
    if (!user) {
      return { message: generic };
    }

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const otpKey = this.getOtpCacheKey(clientName, email);
    const payload: CachedOtpRecord = {
      codeHash: this.hashOtpCode(clientName, email, code),
    };

    await this.cacheManager.set(otpKey, payload, otpTtlMs);

    const html = `
      <p>Hello,</p>
      <p>Your verification code for <strong>${this.escapeHtml(clientName)}</strong> is:</p>
      <p style="font-size: 24px; letter-spacing: 4px;"><strong>${code}</strong></p>
      <p>This code expires in ${Math.ceil(otpTtlMs / 60000)} minutes.</p>
    `;

    try {
      await this.mailService.sendHtmlTo(email, 'Your verification code', html);
    } catch (err) {
      this.logger.error(
        `OTP email failed for ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
    }

    return { message: generic };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ message: string; verified: true }> {
    const email = dto.email.trim().toLowerCase();
    const clientName = dto.clientName.trim();
    const otpKey = this.getOtpCacheKey(clientName, email);
    const record = await this.cacheManager.get<CachedOtpRecord>(otpKey);

    if (!record) {
      throw new BadRequestException('Invalid or expired one-time password.');
    }

    const incomingHash = this.hashOtpCode(clientName, email, dto.code.trim());
    if (incomingHash !== record.codeHash) {
      throw new BadRequestException('Invalid or expired one-time password.');
    }

    await this.cacheManager.del(otpKey);
    return {
      message: 'OTP verified successfully.',
      verified: true,
    };
  }

  async resetPasswordWithToken(
    dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const clientName = dto.clientName.trim();
    let payload: PasswordResetJwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<PasswordResetJwtPayload>(
        dto.token.trim(),
      );
    } catch {
      throw new BadRequestException('Invalid or expired reset link.');
    }
    if (payload.typ !== 'pwd_reset' || payload.clientName !== clientName) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, clientName },
    });
    if (!user?.passwordHash) {
      throw new BadRequestException('Invalid or expired reset link.');
    }

    user.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    await this.usersRepository.save(user);
    return { message: 'Your password has been updated. You can sign in now.' };
  }

  private getOtpTtlMs(): number {
    return getConfigNumber(this.config, 'AUTH_OTP_TTL_SECONDS', 300, 1) * 1000;
  }

  private getOtpCacheKey(clientName: string, email: string): string {
    return `auth:otp:${clientName}:${email}`;
  }

  private hashOtpCode(clientName: string, email: string, code: string): string {
    return createHash('sha256')
      .update(`${clientName}:${email}:${code}`)
      .digest('hex');
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private async signToken(user: User): Promise<string> {
    const payload: JwtUserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      clientName: user.clientName,
    };
    return this.jwtService.signAsync({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      clientName: payload.clientName,
    });
  }
}
