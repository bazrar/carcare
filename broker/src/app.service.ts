import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class AppService {
  ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'hello';
  AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'world';
  // private readonly twilioClient;
  // constructor() {
  //   this.twilioClient = new Twilio(this.ACCOUNT_SID, this.AUTH_TOKEN);
  // }
  async sendOtp(message, receiverMobileNumber) {
    //   this.twilioClient.messages.create({
    //     body: message,
    //     to: receiverMobileNumber,
    //     from: '+1234567801',
    //   });
  }
}
