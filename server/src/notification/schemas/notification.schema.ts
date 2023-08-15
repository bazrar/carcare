import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

import { WashRequest } from 'src/wash-request/schemas/wash-request.schema';
import { User } from 'src/user/schemas/auth.schema';

@Schema({ timestamps: true })
export class Notification extends mongoose.Document {
  @Prop()
  title: string;

  @Prop()
  message: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  from: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  to: User;

  @Prop()
  isSeen: boolean;

  @Prop()
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'WashRequest' })
  washRequest: WashRequest;

  @Prop()
  redirectURL: string;

  @Prop({ required: true })
  trackingId: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
