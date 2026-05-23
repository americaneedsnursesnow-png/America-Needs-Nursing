import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BlogPostStatus } from '../../database/entities';

export class CreateBlogPostDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  /** Omit or leave empty to auto-generate a unique URL slug from the title. */
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : (value as unknown),
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  slug?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200000)
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  excerpt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  metaDescription?: string;

  @IsOptional()
  @IsBoolean()
  sponsored?: boolean;

  @IsEnum(BlogPostStatus)
  status: BlogPostStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;

  /** ISO-8601 publish time (UTC). Omit for immediate publish. Used when status is SCHEDULED. */
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
