import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileModule } from 'src/profile/profile.module';
import { S3Module } from 'src/s3/s3.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService],
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
    ]),
    ProfileModule,
    S3Module,
  ],
  exports: [FeedbackService],
})
export class FeedbackModule {}
