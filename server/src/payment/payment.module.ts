import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ProfileModule } from 'src/profile/profile.module';
import { ServiceStationModule } from 'src/service-station/service-station.module';
import { WashRequestModule } from 'src/wash-request/wash-request.module';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
  imports: [
    ProfileModule,
    ServiceStationModule,
    UserModule,
    WashRequestModule,
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
    ]),
  ],
})
export class PaymentModule {}
