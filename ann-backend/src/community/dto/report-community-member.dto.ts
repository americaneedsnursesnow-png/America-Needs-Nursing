import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ReportCommunityMemberDto {
  @IsUUID()
  reportedUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}
