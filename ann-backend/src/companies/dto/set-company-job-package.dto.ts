import { IsDateString, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class SetCompanyJobPackageDto {
  @IsOptional()
  @ValidateIf(
    (o: SetCompanyJobPackageDto) =>
      o.jobPackageId !== undefined && o.jobPackageId !== null,
  )
  @IsUUID('4')
  jobPackageId?: string | null;

  @IsOptional()
  @ValidateIf(
    (o: SetCompanyJobPackageDto) =>
      o.jobPackageExpiresAt !== undefined && o.jobPackageExpiresAt !== null,
  )
  @IsDateString()
  jobPackageExpiresAt?: string | null;
}
