import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommunityPostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  body: string;
}
