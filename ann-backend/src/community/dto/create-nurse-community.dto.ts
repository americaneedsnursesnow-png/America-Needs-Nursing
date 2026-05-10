import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNurseCommunityDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  description: string;

  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  rules: string;
}
