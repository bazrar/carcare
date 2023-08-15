import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from 'src/user/user.module';
import {
  ReviewReason,
  ReviewReasonSchema,
} from './schemas/review-reason.schema';
import { ReviewReasonsService } from './review-reasons.service';
import { ReviewReasonsController } from './review-reasons.controller';

@Module({
  providers: [ReviewReasonsService],
  controllers: [ReviewReasonsController],
  exports: [ReviewReasonsService],
  imports: [
    UserModule,
    MongooseModule.forFeature([
      {
        name: ReviewReason.name,
        schema: ReviewReasonSchema,
      },
    ]),
  ],
})
export class ReviewReasonsModule {}
