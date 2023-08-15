import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class CarMetadata extends mongoose.Document {
  @Prop({ required: true, index: true, trim: true })
  make: string;

  @Prop({ required: true, index: true, trim: true })
  model: string;

  @Prop({ required: true, index: true, trim: true })
  year: string;

  @Prop({ required: true, index: true, trim: true })
  bodyStyles: string;
}

export const CarMetadataSchema = SchemaFactory.createForClass(CarMetadata);
