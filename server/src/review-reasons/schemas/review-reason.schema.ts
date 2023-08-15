import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ timestamps: true })
export class ReviewReason extends mongoose.Document {
  @Prop({ required: true })
  type: string;

  @Prop()
  reason: string;

  @Prop()
  order: number;
}

export const ReviewReasonSchema = SchemaFactory.createForClass(ReviewReason);
