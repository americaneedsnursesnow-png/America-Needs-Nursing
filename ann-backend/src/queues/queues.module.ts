import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRedisConnectionOptionsForBull } from '../common/utils/env.util';

/**
 * Global BullMQ connection. Feature modules call `BullModule.registerQueue({ name })`.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: getRedisConnectionOptionsForBull(config),
        prefix: 'ann:bull',
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueuesModule {}
