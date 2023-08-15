import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class OtpSmsService {
  private readonly twilioClient: Twilio;
  constructor(private readonly configService: ConfigService) {
    const twilioAccountSid =
      this.configService.get<string>('TWILIO_ACCOUNT_SID');

    const twilioTokenSid = this.configService.get<string>(
      'TWILIO_ACCOUNT_TOKEN',
    );
    const twilioTokenSecret = this.configService.get<string>(
      'TWILIO_TOKEN_SECRET',
    );

    const twilioPhoneNumber = this.configService.get<string>(
      'TWILIO_PHONE_NUMBER',
    );
    this.twilioClient = new Twilio(twilioTokenSid, twilioTokenSecret, {
      accountSid: twilioAccountSid,
    });
  }
  async sendOtp(message, receiverMobileNumber) {
    console.log(
      '🚀 ~ file: otp-sms.service.ts ~ line 25 ~ OtpSmsService ~ sendOtp ~ message',
      message,
    );
    console.log(
      '🚀 ~ file: otp-sms.service.ts ~ line 25 ~ OtpSmsService ~ sendOtp ~ receiverMobileNumber',
      receiverMobileNumber,
    );
    const nodeEnvironment = this.configService.get<string>('NODE_ENVIRONMENT');
    if (nodeEnvironment === 'development') {
      await Promise.resolve();
    } else {
      await this.twilioClient.messages.create({
        body: message,
        to: receiverMobileNumber,
        from: '+1234567801',
      });
    }
  }
}
