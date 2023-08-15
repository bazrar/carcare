import * as Joi from 'joi';
import { Module, Injectable, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { ServiceLocationModule } from './service-location/service-location.module';
import { BusinessDocumentModule } from './business-document/business-document.module';
import { JobModule } from './job/job.module';
import { BusinessModule } from './business/business.module';
import { RoleModule } from './role/role.module';
import { CategoryModule } from './category/category.module';
import { ServiceModule } from './service/service.module';
import { RedisClientModule } from './redis/redis.module';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { CarMetadataModule } from './car-metadata/car-metadata.module';
import { ServiceStationModule } from './service-station/service-station.module';
import { ProviderServicesModule } from './provider-services/provider-services.module';
import { UserVehicleModule } from './user-vehicle/user-vehicle.module';
import { NestjsFormDataModule } from 'nestjs-form-data';
import { SeekerPlaceModule } from './seeker-place/seeker-place.module';
import { MailerModule } from './mailer/mailer.module';
import { WashRequestModule } from './wash-request/wash-request.module';
import { LocationModule } from './location/location.module';
import { GeoModule } from './geo/geo.module';
import { ReviewReasonsModule } from './review-reasons/review-reasons.module';
import { NotificationModule } from './notification/notification.module';
import { PaymentModule } from './payment/payment.module';
import { LocationGateway } from './location/location.gateway';
import { JwtModule } from '@nestjs/jwt';
import { FeedbackModule } from './feedback/feedback.module';
import { SmsModule } from './sms/sms.module';
import { DynamicLinkModule } from './dynamic-link/dynamic-link.module';
import { AdminPanelModule } from './admin-panel/admin-panel.module';
import { join } from 'path';
import { CommandModule } from 'nestjs-command';
import { LocationTrackingModule } from './location-tracking/location-tracking.module';
import { LocationTrackingGateway } from './location-tracking/location-tracking.gateway';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
        JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
        TWILIO_PHONE_NUMBER: Joi.string().required(),
        TWILIO_ACCOUNT_SID: Joi.string().required().pattern(/^AC.*/),
        TWILIO_AUTH_TOKEN: Joi.string().required(),
      }),
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot('mongodb://carwash:27017/carwash'),
    // RedisCoreModule,
    RedisModule.forRoot({
      config: {
        url: 'redis://redis:6379',
        port: 6379,
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    ThrottlerModule.forRoot({
      ttl: 60, // Time to live for each request storage (in seconds)
      limit: 10, // Maximum number of requests allowed within the ttl period
    }),
    NestjsFormDataModule,
    AuthModule,
    UserModule,
    ProfileModule,
    BusinessModule,
    ServiceModule,
    BusinessDocumentModule,
    ServiceLocationModule,
    RoleModule,
    CategoryModule,
    JobModule,
    RedisClientModule,
    CarMetadataModule,
    ServiceStationModule,
    ProviderServicesModule,
    UserVehicleModule,
    SeekerPlaceModule,
    MailerModule,
    WashRequestModule,
    LocationModule,
    GeoModule,
    ReviewReasonsModule,
    NotificationModule,
    PaymentModule,
    JwtModule,
    FeedbackModule,
    SmsModule,
    DynamicLinkModule,
    AdminPanelModule,
    CommandModule,
    LocationTrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService, LocationGateway, LocationTrackingGateway],
})
export class AppModule {}
