import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';

@Module({
  providers: [S3Service],
  imports: [ConfigModule],
  exports: [S3Service],
})
export class S3Module {}
