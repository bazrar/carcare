import { Module, forwardRef } from '@nestjs/common';
import { LocationTrackingGateway } from './location-tracking.gateway';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { ServiceStationModule } from 'src/service-station/service-station.module';
import { LocationTrackingService } from './location-tracking.service';

@Module({
  imports: [
    UserModule,
    forwardRef(() => ServiceStationModule),
    JwtModule.register({}),
  ],
  exports: [LocationTrackingService],
  providers: [LocationTrackingService, LocationTrackingGateway],
})
export class LocationTrackingModule {}
