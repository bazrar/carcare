import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DynamicLinkService } from './dynamic-link.service';

@Module({
  imports: [ConfigModule],
  providers: [DynamicLinkService],
  exports: [DynamicLinkService],
})
export class DynamicLinkModule {}
