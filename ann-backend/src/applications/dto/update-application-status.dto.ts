import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../../database/entities';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}
