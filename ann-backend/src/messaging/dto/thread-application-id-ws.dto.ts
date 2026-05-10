import { IsUUID } from 'class-validator';

/** Client → server body for `thread:messages` on `/job-messaging`. */
export class ThreadApplicationIdWsDto {
  @IsUUID()
  applicationId: string;
}
