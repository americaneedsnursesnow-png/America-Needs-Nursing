import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BlogPostStatus } from '../../database/entities';

export class UpdateBlogPostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200000)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  excerpt?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  metaDescription?: string | null;

  @IsOptional()
  @IsBoolean()
  sponsored?: boolean;

  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date | null;
}
