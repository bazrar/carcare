import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { WashRequest } from 'src/wash-request/schemas/wash-request.schema';
import { ReviewReason } from 'src/review-reasons/schemas/review-reason.schema';
import { User } from 'src/user/schemas/auth.schema';
import { ServiceStation } from 'src/service-station/schemas/service-station.schema';

@Schema({ timestamps: true })
export class Feedback extends mongoose.Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WashRequest',
    required: true,
  })
  washRequest: WashRequest;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User | ServiceStation',
    required: true,
  })
  from: User | ServiceStation;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User | ServiceStation',
    required: true,
  })
  to: ServiceStation | User;

  @Prop()
  rating: number;

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'ReviewReason',
  })
  reviewReason: ReviewReason[];

  @Prop()
  feedback: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
