import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../database/entities';
import type { JwtUserPayload } from './types/jwt-user-payload';

interface JwtBody {
  sub: string;
  email?: string;
  role?: JwtUserPayload['role'];
  clientName: string;
  /** Short-lived tokens from forgot-password must not authenticate API requests. */
  typ?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    const secret = config.get<string>('JWT_SECRET')?.trim();
    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtBody): Promise<JwtUserPayload> {
    if (payload.typ === 'pwd_reset') {
      throw new UnauthorizedException();
    }
    if (!payload.email || payload.role === undefined) {
      throw new UnauthorizedException();
    }
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub, clientName: payload.clientName },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      clientName: user.clientName,
    };
  }
}
