import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import * as mongoose from 'mongoose';
import { Payment } from 'src/payment/schemas/payment.schema';
import { User } from 'src/user/schemas/auth.schema';

@Schema()
export class PaymentMethod extends mongoose.Document {
  @Prop()
  id: string;

  @Prop()
  fullName: string;

  @Prop()
  postalCode: string;

  @Prop()
  expiryDate: string;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);
@Schema()
export class PaymentDetails extends mongoose.Document {
  @Prop()
  customerId: string;

  @Prop()
  bankAccount?: string;

  @Prop({ type: [PaymentMethodSchema] })
  paymentMethods?: PaymentMethod[];
}

export const PaymentDetailsSchema =
  SchemaFactory.createForClass(PaymentDetails);

@Schema({ timestamps: true })
export class Profile extends mongoose.Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: false })
  middleName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  avatar: string;

  @Prop({ default: false })
  hasCompletedProfile: boolean;

  @Prop({ default: false })
  hasBusiness: boolean;

  @Prop({ default: false })
  hasBusinessDocument: boolean;

  @Prop({ type: PaymentDetailsSchema })
  paymentDetails: {
    customerId: string;
    bankAccount?: string;
    paymentMethods?: [
      {
        id: string;
        fullName: string;
        postalCode: string;
        expiryDate: string;
      },
    ];
  };

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  })
  userId: User;

  @Prop({ default: false })
  @IsOptional()
  hasAcceptedPrivacyPolicy: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
