import { IsEnum } from 'class-validator';
import { CompanyApprovalStatus } from '../../database/entities';

export class SetCompanyApprovalDto {
  @IsEnum(CompanyApprovalStatus)
  approvalStatus: CompanyApprovalStatus;
}
