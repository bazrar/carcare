import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { AuthModule } from 'src/auth/auth.module';
import { S3Module } from 'src/s3/s3.module';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserVehicleModule } from 'src/user-vehicle/user-vehicle.module';
import { SeekerPlaceModule } from 'src/seeker-place/seeker-place.module';
import { ServiceStationModule } from 'src/service-station/service-station.module';

@ApiBearerAuth()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Profile.name,
        schema: ProfileSchema,
      },
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => ServiceStationModule),
    S3Module,
    UserVehicleModule,
    SeekerPlaceModule,
  ],
  providers: [ProfileService],
  exports: [ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
