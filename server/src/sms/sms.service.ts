import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  twilioClient: Twilio;
  constructor(private configService: ConfigService) {
    const twilioTokenSid = this.configService.get<string>('TWILIO_TOKEN_SID');
    const twilioTokenSecret = this.configService.get<string>(
      'TWILIO_TOKEN_SECRET',
    );
    const twilioAccountSid =
      this.configService.get<string>('TWILIO_ACCOUNT_SID');
    this.twilioClient = new Twilio(twilioTokenSid, twilioTokenSecret, {
      accountSid: twilioAccountSid,
    });
  }

  async sendSms(to: string, body: string) {
    const twilioTokenSid = this.configService.get<string>('TWILIO_TOKEN_SID');
    const twilioTokenSecret = this.configService.get<string>(
      'TWILIO_TOKEN_SECRET',
    );
    const twilioAccountSid =
      this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    try {
      console.log(
        JSON.stringify({
          from,
          to,
          body,
          twilioTokenSid,
          twilioTokenSecret,
          twilioAccountSid,
        }),
      );
      let toPhone = to.includes('+') ? to : `+${to}`;
      const testNumbers = [
        '9841430732', // RAKESH
        '9845295221', // SANDESH
        '9813604624', // RAKESH
        '9810099012', // RAJU
        '9815393041', // MANISHA
        '9824119274', // PRASHANT
        '9803393041', // SANDESH
        '9846856255', // PRASHANT
        '9819016975', // SAGAR,
        '9765425457', // BIKESH
      ];
      if (testNumbers.includes(toPhone.slice(toPhone.length - 10))) {
        toPhone = `+977${toPhone.slice(toPhone.length - 10)}`;
      }

      await this.twilioClient.messages.create({
        from,
        to: toPhone,
        body,
      });
    } catch (err) {
      console.log(
        '🚀 ~ file: sms.service.ts ~ line 33 ~ SmsService ~ sendSms ~ err',
        err,
      );
      throw new BadRequestException('Error sending otp');
    }
  }
}
