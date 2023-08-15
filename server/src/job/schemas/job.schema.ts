import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Business } from 'src/business/schemas/business.schema';

@Schema()
export class Job extends mongoose.Document {
  @Prop({ required: true })
  name: string;

  @Prop({ slug: 'name' })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    required: false,
    default: false,
  })
  isDefault: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: false,
    default: null,
  })
  businessId: Business;
}

export const JobSchema = SchemaFactory.createForClass(Job);
