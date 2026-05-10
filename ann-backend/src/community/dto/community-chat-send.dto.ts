import { IsString, MaxLength, MinLength } from 'class-validator';



/** Inbound payload for Socket.IO event `chat:send` (room is from `chat:join` on the socket). */

export class CommunityChatSendDto {

  @IsString()

  @MinLength(1)

  @MaxLength(2000)

  body!: string;

}

