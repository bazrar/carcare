import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { BadRequestException } from '@nestjs/common';

import { Feedback } from './schemas/feedback.schema';

import { S3Service } from 'src/s3/s3.service';

import { AddFeedbackDto } from 'src/wash-request/dto/booking.dto';
import { LimitDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly feedbackModel: mongoose.Model<Feedback>,
    private readonly s3Service: S3Service,
  ) {}

  async getFeedbacks(providerServiceId: string, limitDto: LimitDto) {
    const queryLimit: number = parseInt(limitDto.limit) || 4;
    const matchParams: any = {
      to: new mongoose.mongo.ObjectId(providerServiceId),
    };

    const feedbacks = await this.feedbackModel.aggregate([
      { $match: matchParams },
      { $limit: queryLimit },
      {
        $lookup: {
          from: 'profiles',
          localField: 'from',
          foreignField: 'userId',
          as: 'profiles',
        },
      },
      {
        $unwind: {
          path: '$profiles',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          rating: 1,
          feedback: 1,
          createdAt: 1,
          seekerFirstName: '$profiles.firstName',
          seekerMiddleName: '$profiles.middleName',
          seekerLastName: '$profiles.lastName',
          userAvatar: '$profiles.avatar',
        },
      },
    ]);

    const feedbackWithUserAvatar = await Promise.all(
      feedbacks.map(async (feedback) => {
        let avatarUrl = '';

        if (feedback.userAvatar) {
          avatarUrl = await this.s3Service.getSignedUrl(feedback.userAvatar);
        }

        feedback.userAvatar = avatarUrl;
        return feedback;
      }),
    );

    return feedbackWithUserAvatar;
  }

  async addFeedback(dbQuery: any, addFeedbackDto: AddFeedbackDto) {
    const oldFeedback = await this.feedbackModel.findOne(dbQuery);
    if (oldFeedback) {
      throw new BadRequestException(
        'Feedback is already submitted for this booking',
      );
    }

    const userFeedback = await this.feedbackModel.create({
      washRequest: dbQuery.washRequest,
      from: dbQuery.from,
      to: dbQuery.to,
      rating: addFeedbackDto.rating,
      reviewReason: addFeedbackDto.reviewReason,
      feedback: addFeedbackDto.feedback,
    });

    return 'Success';
  }

  async getFeedback(dbQuery: any) {
    return await this.feedbackModel.findOne(dbQuery);
  }
}
