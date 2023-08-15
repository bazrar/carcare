import { Module } from '@nestjs/common';

import { BusinessModule } from 'src/business/business.module';
import { WashRequestModule } from 'src/wash-request/wash-request.module';
import { AdminPanelService } from './admin-panel.service';
import { AdminPanelController } from './admin-panel.controller';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { PaymentModule } from 'src/payment/payment.module';

@Module({
  imports: [
    AuthModule,
    BusinessModule,
    PaymentModule,
    UserModule,
    WashRequestModule,
  ],
  controllers: [AdminPanelController],
  providers: [AdminPanelService],
})
export class AdminPanelModule {}
