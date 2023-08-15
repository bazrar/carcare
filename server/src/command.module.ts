import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { CarMetadataModule } from './car-metadata/car-metadata.module';
import { CategoryModule } from './category/category.module';
import { ServiceSeedCommandRunner } from './commands/seed-services';
import { SeedCar as CarSeedCommandRunner } from './commands/seed-cars';
import { JobModule } from './job/job.module';
import { ServiceModule } from './service/service.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { BusinessModule } from './business/business.module';
import { ServiceStationModule } from './service-station/service-station.module';
import { ProviderServicesModule } from './provider-services/provider-services.module';
import { ProviderDataCommandRunner } from './commands/seed-data';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot('mongodb://carwash:27017/carwash'),
    RedisModule.forRoot({
      config: {
        url: 'redis://redis:6379',
        port: 6379,
      },
    }),
    CategoryModule,
    ServiceModule,
    JobModule,
    CarMetadataModule,
    AuthModule,
    ProfileModule,
    BusinessModule,
    ServiceStationModule,
    ServiceModule,
    BusinessModule,
    ProviderServicesModule,
    JobModule,
  ],
  providers: [
    ServiceSeedCommandRunner,
    CarSeedCommandRunner,
    ProviderDataCommandRunner,
  ],
  controllers: [],
})
export class CommandModule {}
