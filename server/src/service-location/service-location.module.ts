import { Module } from '@nestjs/common';
import { ServiceLocationService } from './service-location.service';
import { ServiceLocationController } from './service-location.controller';

@Module({
  providers: [ServiceLocationService],
  controllers: [ServiceLocationController],
})
export class ServiceLocationModule {}
