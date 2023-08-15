import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';

import { UserModule } from 'src/user/user.module';
import { PushNotificationService } from './methods/sendPushNotification';
import { NotificationCenterService } from './methods/addOnNotificationCenter';
import { WashRequestModule } from '../wash-request/wash-request.module';
import { UserVehicleModule } from '../user-vehicle/user-vehicle.module';
import { CarMetadataModule } from '../car-metadata/car-metadata.module';
import { ServiceStationModule } from '../service-station/service-station.module';
import { ProfileModule } from '../profile/profile.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  providers: [
    NotificationService,
    NotificationCenterService,
    PushNotificationService,
  ],
  controllers: [NotificationController],
  imports: [
    ConfigModule,
    UserModule,
    ProfileModule,
    forwardRef(() => WashRequestModule),
    forwardRef(() => ServiceStationModule),
    UserVehicleModule,
    CarMetadataModule,
    S3Module,
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
