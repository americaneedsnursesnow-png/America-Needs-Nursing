import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  coverLetter?: string;
}
