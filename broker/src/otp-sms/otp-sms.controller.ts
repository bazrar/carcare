import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { OtpSmsService } from './otp-sms.service';

@Controller('otp-sms')
export class OtpSmsController {
  private readonly logger = new Logger(OtpSmsController.name);
  constructor(private readonly otpSmsService: OtpSmsService) {}

  @MessagePattern('send_login_otp')
  sentOtp(@Payload() payload: string, @Ctx() context: RmqContext) {
    const pattern = context.getPattern();
    const message = context.getMessage();
    const channel = context.getChannelRef();
    this.logger.log(`Pattern:  ${JSON.stringify(pattern, null, 2)}`);
    this.logger.log(`Message: ${JSON.stringify(message, null, 2)}`);
    this.logger.log(`channel: ${JSON.stringify(channel, null, 2)}`);
    this.otpSmsService.sendOtp(message, '9849324652');
    channel.ack(message);
  }
}
