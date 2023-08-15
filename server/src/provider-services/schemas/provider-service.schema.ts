import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { User } from 'src/user/schemas/auth.schema';
import { Service } from 'src/service/schemas/service.schema';
import { Job } from 'src/job/schemas/job.schema';
import { ServiceStation } from 'src/service-station/schemas/service-station.schema';
import { Category } from 'src/category/schemas/category.schema';
export interface IProviderServiceDescription {
  description: string;
  name: string;
  jobId: mongoose.ObjectId;
}
@Schema()
export class ProviderServiceDescription extends mongoose.Document {
  @Prop()
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Job' })
  jobId: Job;

  @Prop()
  name: string;
}

export const ProviderServiceDescriptionSchema = SchemaFactory.createForClass(
  ProviderServiceDescription,
);

@Schema({ timestamps: true })
export class ProviderService extends mongoose.Document {
  @Prop({ required: true })
  minPrice: number;

  @Prop({ required: true })
  maxPrice: number;

  @Prop({ required: true })
  expectedTimeToComplete: number;

  @Prop({ required: false })
  description: string;

  @Prop([{ type: ProviderServiceDescriptionSchema }])
  jobs: IProviderServiceDescription[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceStation' })
  serviceStationId: ServiceStation;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category' })
  categoryId: Category;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Service' })
  serviceId: Service;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ required: false })
  isActive: boolean;
}

export const ProviderServiceSchema =
  SchemaFactory.createForClass(ProviderService);
