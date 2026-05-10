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
import {
  JobEmploymentType,
  JobLevel,
  JobStatus,
} from '../../database/entities';
import { US_STATE_CODES } from '../../common/constants/us-state-codes';
import { JOB_EXPECTED_SALARY_RANGE_VALUES } from './create-job.dto';

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  requirements?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  location?: string | null;

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
  employmentType?: JobEmploymentType | null;

  @IsOptional()
  @IsEnum(JobLevel)
  jobLevel?: JobLevel | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobCategory?: string | null;

  @IsOptional()
  @IsIn([...JOB_EXPECTED_SALARY_RANGE_VALUES])
  expectedSalaryRange?: string | null;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  adminReviewRequired?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date | null;
}
