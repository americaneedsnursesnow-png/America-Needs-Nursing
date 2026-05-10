import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { US_STATE_CODES } from '../../common/constants/us-state-codes';
import { JobEmploymentType, JobLevel } from '../../database/entities';

export const JOB_EXPECTED_SALARY_RANGE_VALUES = [
  '40-60',
  '60-90',
  '90-120',
  '120+',
] as const;

export class CreateJobDto {
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
  @MaxLength(160)
  slug?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  requirements?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  location?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return typeof value === 'string' ? value.trim().toUpperCase() : value;
  })
  @IsIn([...US_STATE_CODES])
  stateCode?: (typeof US_STATE_CODES)[number];

  @IsOptional()
  @IsEnum(JobEmploymentType)
  employmentType?: JobEmploymentType;

  @IsOptional()
  @IsEnum(JobLevel)
  jobLevel?: JobLevel;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobCategory?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === ''
      ? undefined
      : (value as unknown),
  )
  @IsIn([...JOB_EXPECTED_SALARY_RANGE_VALUES])
  expectedSalaryRange?: (typeof JOB_EXPECTED_SALARY_RANGE_VALUES)[number];

  /** Ignored for employer-created jobs (platform-controlled listing). */
  @IsOptional()
  @IsBoolean()
  adminReviewRequired?: boolean;

  /** Ignored for employer-created jobs (platform-controlled listing). */
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  /** Ignored — expiry is set automatically when a job is published (~30 days). */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
