import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/user/schemas/auth.schema';

@Schema({ timestamps: true })
export class UserVehicle extends mongoose.Document {
  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CarMetadata',
  })
  carMetadataId: string;

  @Prop({ required: true, trim: true })
  color: string;

  @Prop({ required: false })
  vehicleImage: string;

  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ required: false })
  deleted: boolean;
}

export const UserVehicleSchema = SchemaFactory.createForClass(UserVehicle);
