import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerController } from './mailer.controller';
import { MailerService } from './mailer.service';

@Module({
  imports: [ConfigModule],
  exports: [MailerService],
  controllers: [MailerController],
  providers: [MailerService],
})
export class MailerModule {}
