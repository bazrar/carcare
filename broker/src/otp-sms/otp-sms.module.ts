import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpSmsController } from './otp-sms.controller';
import { OtpSmsService } from './otp-sms.service';

@Module({
  imports: [ConfigModule],
  controllers: [OtpSmsController],
  providers: [OtpSmsService],
})
export class OtpSmsModule {}
