import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/user/schemas/auth.schema';

import { BusinessVerificationStatus } from '../enums/business-verifcation-status.enum';

@Schema()
class Point extends mongoose.Document {
  @Prop({ required: true, enum: ['Point'] })
  type: string;

  @Prop({ required: true })
  coordinates: Array<mongoose.Types.Decimal128>;
}

const PointSchema = SchemaFactory.createForClass(Point);

@Schema()
export class ManagerDetails extends mongoose.Document {
  @Prop()
  mobileNumber: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;
}
// TODO: can provider have multiple businesses?
@Schema({ timestamps: true })
export class Business extends mongoose.Document {
  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ required: false })
  website: string;

  @Prop()
  contactNumber: string;

  @Prop()
  zipCode: string;

  @Prop({ default: 'pending' })
  verificationStatus: BusinessVerificationStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ default: false })
  deleted: boolean;

  @Prop()
  logo: string;

  @Prop()
  registrationDocument: string;

  @Prop()
  insuranceDocument: string;

  @Prop()
  managers: [User];

  @Prop({ default: false })
  isSoloProprietor: boolean;

  @Prop({ required: false })
  instagramUrl: string;

  @Prop({ type: PointSchema })
  location: {
    type: string;
    coordinates: [number, number];
  };

  @Prop({ required: false })
  coverImage: string;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);

BusinessSchema.index({ location: '2dsphere' });
BusinessSchema.index({ userId: 1, name: 1 }, { unique: true });
