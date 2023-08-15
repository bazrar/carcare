import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OtpSmsModule } from './otp-sms/otp-sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        TWILIO_PHONE_NUMBER: Joi.string().required(),
        TWILIO_ACCOUNT_SID: Joi.string().required().pattern(/^AC.*/),
        TWILIO_TOKEN_SID: Joi.string().required(),
        TWILIO_TOKEN_SECRET: Joi.string().required(),
      }),
    }),
    OtpSmsModule,
  ],
})
export class AppModule {}
