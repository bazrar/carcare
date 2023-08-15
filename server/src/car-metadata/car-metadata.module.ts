import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarMetadataController } from './car-metadata.controller';
import { CarMetadataService } from './car-metadata.service';
import { CarMetadata, CarMetadataSchema } from './schemas/car-metadata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CarMetadata.name, schema: CarMetadataSchema },
    ]),
  ],
  controllers: [CarMetadataController],
  providers: [CarMetadataService],
  exports: [CarMetadataService],
})
export class CarMetadataModule {}
