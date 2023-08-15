import { Module } from '@nestjs/common';
import { WashRequestModule } from 'src/wash-request/wash-request.module';
import { LocationGateway } from './location.gateway';
import { LocationService } from './location.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [WashRequestModule, JwtModule.register({})],
  exports: [LocationService],
  providers: [LocationService, LocationGateway],
})
export class LocationModule {}
