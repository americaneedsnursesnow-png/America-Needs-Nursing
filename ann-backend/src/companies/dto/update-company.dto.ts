import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CompanyLocationItemDto } from './create-company.dto';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  heroImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  contactPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  cultureText?: string | null;

  @IsOptional()
  testimonialsJson?: unknown;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompanyLocationItemDto)
  locations?: CompanyLocationItemDto[] | null;
}
