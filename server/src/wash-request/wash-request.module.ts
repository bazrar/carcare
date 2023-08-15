import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProviderServicesModule } from 'src/provider-services/provider-services.module';
import { S3Module } from 'src/s3/s3.module';
import { SeekerPlaceModule } from 'src/seeker-place/seeker-place.module';
import { ServiceStationModule } from 'src/service-station/service-station.module';
import { ServiceModule } from 'src/service/service.module';
import { UserVehicleModule } from 'src/user-vehicle/user-vehicle.module';
import { UserModule } from 'src/user/user.module';
import { WashRequest, WashRequestSchema } from './schemas/wash-request.schema';
import { WashRequestController } from './wash-request.controller';
import { WashRequestService } from './wash-request.service';
import { NotificationModule } from 'src/notification/notification.module';
import { FeedbackModule } from 'src/feedback/feedback.module';
import { CarMetadataModule } from 'src/car-metadata/car-metadata.module';
import { ProfileModule } from 'src/profile/profile.module';
import { WashRequestGateWay } from './wash-request.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [WashRequestController],
  providers: [WashRequestService, WashRequestGateWay],
  exports: [WashRequestService],
  imports: [
    MongooseModule.forFeature([
      {
        name: WashRequest.name,
        schema: WashRequestSchema,
      },
    ]),
    ServiceModule,
    UserModule,
    forwardRef(() => ServiceStationModule),
    UserVehicleModule,
    S3Module,
    SeekerPlaceModule,
    ProviderServicesModule,
    NotificationModule,
    FeedbackModule,
    CarMetadataModule,
    ProfileModule,
    JwtModule,
    ConfigModule,
  ],
})
export class WashRequestModule {}
