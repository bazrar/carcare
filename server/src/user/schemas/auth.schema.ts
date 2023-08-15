import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../enums/roles.enum';
import { IsOptional } from 'class-validator';
import { PointSchema } from 'src/service-station/schemas/service-station.schema';

// export type AuthDocument = Auth & Document;
export interface DeviceToken {
  token: string;
  type: string;
}
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  mobileNumber: string;

  @Prop({ required: true })
  role: Role;

  @Prop()
  accessToken: string;

  @Prop()
  refreshToken: string;

  @Prop({ required: false })
  notificationTokens: [DeviceToken];

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop({ required: false })
  @IsOptional()
  locationTrackerSocketId: string;

  @Prop({ type: PointSchema })
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export const AuthSchema = SchemaFactory.createForClass(User);
AuthSchema.index({ mobileNumber: 1, role: 1 }, { unique: true });
AuthSchema.index({ location: '2dsphere' });
