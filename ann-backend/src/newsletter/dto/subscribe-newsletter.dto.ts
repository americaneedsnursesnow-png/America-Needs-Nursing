import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SubscribeNewsletterDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  clientName: string;

  @IsEmail()
  email: string;
}
