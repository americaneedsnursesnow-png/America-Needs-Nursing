import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  clientName: string;

  @IsEmail()
  email: string;
}
