import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class Category extends mongoose.Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ slug: 'name' })
  slug: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
