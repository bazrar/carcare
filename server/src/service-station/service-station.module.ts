import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from 'src/business/business.module';
import { DynamicLinkModule } from 'src/dynamic-link/dynamic-link.module';
import { GeoModule } from 'src/geo/geo.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { ProviderServicesModule } from 'src/provider-services/provider-services.module';
import {
  ProviderService,
  ProviderServiceSchema,
} from 'src/provider-services/schemas/provider-service.schema';
import { S3Module } from 'src/s3/s3.module';
import {
  ServiceStation,
  ServiceStationSchema,
} from './schemas/service-station.schema';
import { ServiceStationController } from './service-station.controller';
import { ServiceStationService } from './service-station.service';
import { SeekerPlaceModule } from '../seeker-place/seeker-place.module';
import { SmsModule } from 'src/sms/sms.module';
import { UserModule } from 'src/user/user.module';
import { WashRequestModule } from 'src/wash-request/wash-request.module';
import { LocationTrackingModule } from 'src/location-tracking/location-tracking.module';
import { LocationTrackingGateway } from '../location-tracking/location-tracking.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ProfileModule } from 'src/profile/profile.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ServiceStation.name, schema: ServiceStationSchema },
    ]),
    MongooseModule.forFeature([
      { name: ProviderService.name, schema: ProviderServiceSchema },
    ]),
    forwardRef(() => ProviderServicesModule),
    forwardRef(() => WashRequestModule),
    MailerModule,
    ConfigModule,
    GeoModule,
    S3Module,
    BusinessModule,
    DynamicLinkModule,
    SeekerPlaceModule,
    SmsModule,
    UserModule,
    forwardRef(() => JwtModule.register({})),
    LocationTrackingModule,
    ProfileModule,
  ],
  exports: [ServiceStationService],
  controllers: [ServiceStationController],
  providers: [ServiceStationService, LocationTrackingGateway],
})
export class ServiceStationModule {}
