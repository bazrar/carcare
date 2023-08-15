import { Prop } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export class BusinessDocument extends mongoose.Document {
  @Prop({ required: true })
  registrationDocument: string;

  @Prop({ required: true })
  insuranceDocument: string;
}
