import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeekerPlace, SeekerPlaceSchema } from './schema/seeker-place.schema';
import { SeekerPlaceController } from './seeker-place.controller';
import { SeekerPlaceService } from './seeker-place.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SeekerPlace.name,
        schema: SeekerPlaceSchema,
      },
    ]),
  ],
  exports: [SeekerPlaceService],
  controllers: [SeekerPlaceController],
  providers: [SeekerPlaceService],
})
export class SeekerPlaceModule {}
