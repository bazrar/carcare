import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/schemas/auth.schema';
import { SeekerPlaceType } from '../enums/seeker-place-type.enum';

@Schema({ timestamps: true })
export class SeekerPlace {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  address: string;

  @Prop({ default: SeekerPlaceType.Other, enum: SeekerPlaceType })
  type: SeekerPlaceType;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ type: Date, default: Date.now })
  changedAt: Date;

  @Prop({ required: false })
  deleted: boolean;
}

export const SeekerPlaceSchema = SchemaFactory.createForClass(SeekerPlace);
SeekerPlaceSchema.index(
  { latitude: 1, longitude: 1, userId: 1 },
  { unique: true },
);
