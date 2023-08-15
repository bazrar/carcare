import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Category } from 'src/category/schemas/category.schema';

@Schema()
export class Service extends mongoose.Document {
  @Prop({ required: true })
  name: string;

  @Prop({ slug: 'name' })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  categoryId: Category;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
