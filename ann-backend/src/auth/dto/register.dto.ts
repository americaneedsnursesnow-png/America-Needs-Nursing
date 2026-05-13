import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../database/entities';

const REGISTER_ROLES = [UserRole.NURSE, UserRole.COMPANY] as const;

export class RegisterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  clientName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsIn(REGISTER_ROLES)
  role: (typeof REGISTER_ROLES)[number];
}
