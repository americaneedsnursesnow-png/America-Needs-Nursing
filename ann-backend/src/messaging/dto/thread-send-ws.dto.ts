import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Client → server body for `thread:send` on `/job-messaging`. */
export class ThreadSendWsDto {
  @IsUUID()
  applicationId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  body: string;
}
