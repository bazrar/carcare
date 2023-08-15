import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Mongoose } from 'mongoose';
import { MemoryStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { CarMetadataModule } from 'src/car-metadata/car-metadata.module';
import { S3Module } from 'src/s3/s3.module';
import { UserVehicle, UserVehicleSchema } from './schemas/user-vehicle.schema';
import { UserVehicleController } from './user-vehicle.controller';
import { UserVehicleService } from './user-vehicle.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserVehicle.name,
        schema: UserVehicleSchema,
      },
    ]),
    S3Module,
    CarMetadataModule,
  ],
  controllers: [UserVehicleController],
  providers: [UserVehicleService],
  exports: [UserVehicleService],
})
export class UserVehicleModule {}
