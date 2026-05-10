import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  clientName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
