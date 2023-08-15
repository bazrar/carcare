import { Controller, Get, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @MessagePattern('send_login_otp')
  sentOtp(@Payload() payload: string, @Ctx() context: RmqContext) {
    const pattern = context.getPattern();
    const message = context.getMessage();
    const channel = context.getChannelRef();
    this.logger.log(`Pattern:  ${JSON.stringify(pattern, null, 2)}`);
    this.appService.sendOtp(message, '9849324652');
    // channel.ack(message);
  }
}
