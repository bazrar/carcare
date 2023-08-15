import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BusinessModule } from 'src/business/business.module';
import { JobModule } from 'src/job/job.module';
import { ServiceStationModule } from 'src/service-station/service-station.module';
import { ServiceModule } from 'src/service/service.module';
import { ProviderServicesController } from './provider-services.controller';
import { ProviderServicesService } from './provider-services.service';
import {
  ProviderService,
  ProviderServiceDescription,
  ProviderServiceDescriptionSchema,
  ProviderServiceSchema,
} from './schemas/provider-service.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProviderService.name, schema: ProviderServiceSchema },
      // {
      //   name: ProviderServiceDescription.name,
      //   schema: ProviderServiceDescriptionSchema,
      // },
    ]),
    BusinessModule,
    JobModule,
    ServiceModule,
    forwardRef(() => ServiceStationModule),
  ],
  controllers: [ProviderServicesController],
  providers: [ProviderServicesService],
  exports: [ProviderServicesService],
})
export class ProviderServicesModule {}
