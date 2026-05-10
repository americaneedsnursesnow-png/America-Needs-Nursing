import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateNurseProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  specialization?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  licenseNumber?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  yearsExperience?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  stateRegion?: string | null;

  /** ISO date string `YYYY-MM-DD` (stored as `date` in DB). */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsDateString()
  dateOfBirth?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  licenseState?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  certifications?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  cultureText?: string | null;
}
