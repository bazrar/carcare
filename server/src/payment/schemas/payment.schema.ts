import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { SeekerPlace } from 'src/seeker-place/schema/seeker-place.schema';
import { User } from 'src/user/schemas/auth.schema';
import { WashRequest } from 'src/wash-request/schemas/wash-request.schema';

@Schema({ timestamps: true })
export class Payment extends mongoose.Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WashRequest',
    required: true,
  })
  washRequest: WashRequest;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({
    type: Date,
    required: false,
  })
  completedAt: Date;

  @Prop({ required: false })
  payOutCompleted: boolean;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: User;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
