import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisClientService } from './redis.service';

@Module({
  exports: [RedisClientService],
  providers: [RedisClientService],
  imports: [ConfigModule],
})
export class RedisClientModule {}
