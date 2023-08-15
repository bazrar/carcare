import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Business } from 'src/business/schemas/business.schema';
import { User } from 'src/user/schemas/auth.schema';

export enum ServiceStationTypeEnum {
  MOBILE = 'mobile',
  FIXED = 'fixed',
}

export enum ServiceStationManagerType {
  SELF = 'self',
  OTHER = 'other',
}

export enum ServiceType {
  BASIC = 'basic',
  MEDIUM = 'medium',
  ULTRA = 'ultra',
}

export enum ServiceStationRoleType {
  MANAGER = 'manager',
  TEAM_MEMBER = 'team member',
}

@Schema()
export class Point extends mongoose.Document {
  @Prop({ required: true, enum: ['Point'] })
  type: string;

  @Prop({ required: true })
  coordinates: Array<mongoose.Types.Decimal128>;
}

export const PointSchema = SchemaFactory.createForClass(Point);

@Schema()
export class ManagerDetails extends mongoose.Document {
  @Prop()
  mobileNumber: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;
}

export const DetailsSchema = SchemaFactory.createForClass(ManagerDetails);

@Schema()
export class ServiceHours extends mongoose.Document {
  @Prop()
  openingTime: string;

  @Prop()
  closingTime: string;
}

@Schema({ timestamps: true })
export class ServiceStation extends mongoose.Document {
  @Prop({ required: true })
  name: string;

  @Prop({
    required: false,
    enum: ServiceStationTypeEnum,
    default: ServiceStationTypeEnum.MOBILE,
  })
  serviceStationType: string;

  @Prop({
    default: ServiceStationManagerType.SELF,
    enum: ServiceStationManagerType,
  })
  serviceStationManagerType: string;

  @Prop({ required: false })
  address: string;

  @Prop()
  services: mongoose.Schema.Types.ObjectId[];

  @Prop()
  bookingCapacity: number;

  @Prop({ default: false })
  pickAndDrop: boolean;

  @Prop({ required: true })
  availableWithin: number;

  @Prop({ type: PointSchema })
  location: {
    type: string;
    coordinates: [number, number];
  };

  @Prop({ default: false })
  published: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Business' })
  businessId: Business;

  @Prop({ default: false })
  deleted: boolean;

  @Prop({ type: DetailsSchema })
  managerDetails: {
    mobileNumber: string;
    userId?: string;
  };

  @Prop({ type: Array })
  team: {
    mobileNumber: string;
    role: string;
    name: string;
    userId?: string;
    dynamicLinkShared?: boolean;
    enableLocationTracking?: boolean;
  }[];

  @Prop({ default: false })
  isLocationTrackingEnabled: boolean;

  @Prop({ default: null, required: false })
  serviceHours: ServiceHours;
}

export const ServiceStationSchema =
  SchemaFactory.createForClass(ServiceStation);

ServiceStationSchema.index({ location: '2dsphere' });
