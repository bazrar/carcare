import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { User } from './schemas/auth.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: mongoose.Model<User>,
  ) {}

  findByProviderId(provider: string) {
    throw new Error('Method not implemented.');
  }

  findUserById(userId: string) {
    return this.userModel.findOne({ _id: userId });
  }

  async getSeekers(
    page: string,
    limit: string,
    sortKey: string,
    sortType: string,
  ) {
    const matchParams: any = { role: 'seeker' };
    const pageinNumType: number = parseInt(page);
    const limitinNumType: number = parseInt(limit);
    const sort: any = {};

    switch (sortType) {
      case 'asc':
        sort[`${sortKey}`] = 1;
        break;

      case 'desc':
        sort[`${sortKey}`] = -1;
        break;

      default:
        break;
    }

    const seekers = await this.userModel
      .aggregate([
        { $match: matchParams },
        {
          $lookup: {
            from: 'profiles',
            localField: '_id',
            foreignField: 'userId',
            as: 'profiles',
          },
        },
        {
          $unwind: {
            path: '$profiles',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: 'feedbacks',
            localField: '_id',
            foreignField: 'to',
            as: 'feedbacks',
          },
        },
        {
          $project: {
            _id: 1,
            createdAt: '$profiles.createdAt',
            name: {
              $concat: [
                '$profiles.firstName',
                ' ',
                '$profiles.middleName',
                ' ',
                '$profiles.lastName',
              ],
            },
            email: '$profiles.email',
            rating: {
              $avg: '$feedbacks.rating',
            },
          },
        },
      ])
      .sort(sortType)
      .skip((pageinNumType - 1) * limitinNumType)
      .limit(limitinNumType);

    const seekersCount: number = await this.userModel.countDocuments({
      role: 'seeker',
    });

    return { seekers, seekersCount };
  }

  async getSeekerDetail(seekerId: string) {
    const matchParams: any = {
      role: 'seeker',
      _id: new mongoose.mongo.ObjectId(seekerId),
    };
    const seekerDetail = await this.userModel
      .aggregate([
        { $match: matchParams },
        {
          $lookup: {
            from: 'profiles',
            localField: '_id',
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
          $lookup: {
            from: 'feedbacks',
            localField: '_id',
            foreignField: 'to',
            as: 'feedbacks',
          },
        },
        {
          $project: {
            _id: 1,
            createdAt: '$profiles.createdAt',
            name: {
              $concat: [
                '$profiles.firstName',
                ' ',
                '$profiles.middleName',
                ' ',
                '$profiles.lastName',
              ],
            },
            email: '$profiles.email',
            rating: {
              $avg: '$feedbacks.rating',
            },
          },
        },
      ])
      .sort({ createdAt: -1 });

    return { seeker: seekerDetail[0] };
  }

  getAllUsers(params: any) {
    return this.userModel.find(params);
  }

  findUserByMobileNum(mobileNum: string) {
    return this.userModel.findOne({ mobileNumber: mobileNum });
  }

  async searchSeekers(queryString: string) {
    const matchParams: any = {};

    const seekers = await this.userModel.aggregate([
      { $match: matchParams },
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profiles',
        },
      },
      {
        $unwind: {
          path: '$profiles',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'to',
          as: 'feedbacks',
        },
      },
      {
        $addFields: {
          result: {
            $regexMatch: {
              input: '$profiles.firstName',
              regex: queryString,
              options: 'i',
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          createdAt: '$profiles.createdAt',
          name: {
            $concat: [
              '$profiles.firstName',
              ' ',
              '$profiles.middleName',
              ' ',
              '$profiles.lastName',
            ],
          },
          email: '$profiles.email',
          rating: {
            $avg: '$feedbacks.rating',
          },
          result: 1,
        },
      },
    ]);

    const seekersWithQueryMatch = seekers.filter(
      (seeker) => seeker.result === true,
    );

    return {
      seekers: seekersWithQueryMatch,
      seekersCount: seekersWithQueryMatch.length,
    };
  }

  async updateSeekerLocationTrackerDetails(
    seekerId: string,
    socketId: string,
    location: { latitude: number; longitude: number },
  ) {
    return await this.userModel.updateOne(
      { _id: new mongoose.mongo.ObjectId(seekerId) },
      {
        $set: {
          locationTrackerSocketId: socketId,
          location: {
            type: 'Point',
            coordinates: [location.longitude, location.latitude],
          },
        },
      },
    );
  }

  async resetSeekerLocationTrackerDetails(seekerId: string) {
    return await this.userModel.updateOne(
      { _id: new mongoose.mongo.ObjectId(seekerId) },
      {
        $set: {
          locationTrackerSocketId: null,
          location: null,
        },
      },
    );
  }

  async searchSeekersByLocation(
    latitude: number,
    longitude: number,
    radius: number,
  ): Promise<User[]> {
    const query = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radius,
        },
      },
    };
    return await this.userModel.find(query).exec();
  }
}
