import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ReviewReason } from './schemas/review-reason.schema';
import { UserService } from 'src/user/user.service';

@Injectable()
export class ReviewReasonsService {
  constructor(
    @InjectModel(ReviewReason.name)
    private readonly reviewReasonModel: mongoose.Model<ReviewReason>,
    private readonly userService: UserService,
  ) {}

  async listReviewReasons(userId: mongoose.ObjectId) {
    const user = await this.userService.findUserById(userId.toString());
    return await this.reviewReasonModel.find({
      type: user.role === 'manager' || 'team member' ? 'provider' : user.role,
    });
  }
}
