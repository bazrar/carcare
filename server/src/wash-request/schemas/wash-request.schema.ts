import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Business } from 'src/business/schemas/business.schema';
import { SeekerPlace } from 'src/seeker-place/schema/seeker-place.schema';
import { ServiceStation } from 'src/service-station/schemas/service-station.schema';
import { Service } from 'src/service/schemas/service.schema';
import { UserVehicle } from 'src/user-vehicle/schemas/user-vehicle.schema';
import { User } from 'src/user/schemas/auth.schema';
import {
  WashRequestStatus,
  ProviderServiceStatus,
} from '../enums/wash-request-status.enum';

@Schema()
export class Availability extends mongoose.Document {
  @Prop({ required: true })
  availableNow: boolean;

  @Prop()
  availableAfter: Date;
}

export const AvailabilityStatusSchema =
  SchemaFactory.createForClass(Availability);

@Schema({ timestamps: true })
class ProviderServiceStatusHistory extends mongoose.Document {
  @Prop({ type: String, required: true })
  status: ProviderServiceStatus;

  @Prop({ type: Date, default: Date.now, required: true })
  timestamp: Date;
}
@Schema()
class StatusHistory extends mongoose.Document {
  @Prop({ type: String, required: true })
  status: WashRequestStatus;

  @Prop({ type: Date, default: Date.now, required: true })
  timestamp: Date;
}
@Schema({ timestamps: true })
export class WashRequest extends mongoose.Document {
  @Prop({ required: true, index: true })
  status: WashRequestStatus;

  @Prop({ required: false })
  statusHistory: [StatusHistory];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true,
  })
  service: Service;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceStation',
    required: true,
  })
  serviceStation: ServiceStation;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
  })
  vehicle: UserVehicle;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SeekerPlace',
  })
  place: SeekerPlace;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  provider: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Business' })
  business: Business;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: User;

  @Prop()
  amount: number;

  @Prop({
    type: AvailabilityStatusSchema,
  })
  availabilityStatus: {
    availableNow: boolean;
    availableAfter: Date;
  };

  @Prop()
  completedAt: Date;

  @Prop()
  paymentMethod: string;

  @Prop()
  providerServiceStatus: ProviderServiceStatus;

  @Prop({ required: false })
  providerServiceStatusHistory: [ProviderServiceStatusHistory];

  @Prop()
  verificationToken: string;

  @Prop({ required: true })
  orderNumber: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  assignedTo: User;

  @Prop({ default: 0.0, required: false })
  tips: number;

  @Prop({ required: false })
  startedAt: Date;

  @Prop({ required: false, default: 0 })
  approximateTimeToComplete: number;
}

export const WashRequestSchema = SchemaFactory.createForClass(WashRequest);

WashRequestSchema.pre<WashRequest>('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    } as any);
  }
  if (this.isModified('providerServiceStatus')) {
    this.providerServiceStatusHistory.push({
      status: this.providerServiceStatus,
      timestamp: new Date(),
    } as any);
  }
  next();
});
