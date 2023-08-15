import * as mongoose from 'mongoose';
import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
  MethodNotAllowedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { S3Service } from 'src/s3/s3.service';
import { User } from 'src/user/schemas/auth.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { Profile } from './schemas/profile.schema';
import { basename, extname } from 'path';
import { UserVehicleService } from 'src/user-vehicle/user-vehicle.service';
import { SeekerPlaceService } from 'src/seeker-place/seeker-place.service';
import { Role } from 'src/user/enums/roles.enum';
import { ServiceStationService } from 'src/service-station/service-station.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: mongoose.Model<Profile>,
    private readonly s3Service: S3Service,
    private readonly userVehicleService: UserVehicleService,
    private readonly seekerPlaceService: SeekerPlaceService,
    @Inject(forwardRef(() => ServiceStationService))
    private readonly serviceStationService: ServiceStationService,
  ) {}

  async createProfile(
    userId: mongoose.ObjectId,
    createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    try {
      let profile: Profile;
      const { firstName, middleName, lastName, email } = createProfileDto;
      profile = await this.getProfileByUserId(userId);
      if (!profile) {
        profile = await this.profileModel.create({
          ...createProfileDto,
          userId,
        });
      } else {
        profile.firstName = firstName;
        if (middleName) profile.middleName = middleName;
        profile.lastName = lastName;
        profile.email = email;
      }
      if (firstName && lastName && email) {
        profile.hasCompletedProfile = true;
      }
      await profile.save();
      await this.serviceStationService.updateServiceStationTeamUserDetail(
        userId.toString(),
        profile,
      );

      return profile;
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err);
    }
  }
  async updateProfile(userId: mongoose.ObjectId, updateProfileDto: any) {
    // find profile and update
    // const updatedProfile = await this.profileModel.updateOne(
    //   { userId: userId },
    //   {
    //     firstName: updateProfileDto.firstName,
    //     lastName: updateProfileDto.lastName,
    //     email: updateProfileDto.email,
    //   },
    // );
    const { firstName, middleName, lastName, email } = updateProfileDto;
    const profile = await this.profileModel.findOne({ userId });
    profile.firstName = firstName;
    profile.lastName = lastName;
    profile.email = email;
    if (middleName) profile.middleName = middleName;

    if (profile.firstName && profile.lastName && profile.email) {
      profile.hasCompletedProfile = true;
    }
    await profile.save();
    await this.serviceStationService.updateServiceStationTeamUserDetail(
      userId.toString(),
      profile,
    );

    return profile;
  }

  async deleteProfile(_: string) {
    throw new MethodNotAllowedException();
  }

  async getUserProfile(user: User) {
    const profile = await this.getProfileByUserId(user._id);

    if (!profile) {
      return {};
    }

    const hasVehicles: boolean = await this.userVehicleService.hasVehicles(
      user._id,
    );
    const hasPlaces: boolean = await this.seekerPlaceService.hasPlaces(
      user._id,
    );

    if (user.role === Role.MANAGER || user.role === Role.TEAM_MEMBER) {
      profile.hasBusiness = true;
      profile.hasBusinessDocument = true;
    }

    const userProfile: any = {
      ...profile.toJSON(),
      hasVehicles,
      hasPlaces,
      user,
    };

    if (profile.avatar) {
      const avatarUrl = await this.s3Service.getSignedUrl(profile.avatar);
      return {
        ...userProfile,
        avatarUrl,
      };
    }
    return userProfile;
  }

  async getProfileByUserId(userId: mongoose.ObjectId) {
    const profile = await this.profileModel.findOne({ userId });
    return profile;
  }

  async updateProfileAvatar(userId: any, avatar: Express.Multer.File) {
    const baseName = basename(avatar.originalname);
    const extName = extname(avatar.originalname);

    const fileName = `profile/${baseName.replace(
      extName,
      '',
    )}_${Date.now()}${extname(avatar.originalname)}`;
    const profile = await this.getProfileByUserId(userId);
    profile.avatar = fileName;
    await this.s3Service.uploadFile(avatar.buffer, fileName);
    await profile.save();
    const url = await this.s3Service.getSignedUrl(profile.avatar);
    return {
      url,
    };
  }

  async businessBookkeeping(userId: mongoose.ObjectId, hasBusiness: boolean) {
    const profile = await this.profileModel.findOne({ userId });
    profile.hasBusiness = hasBusiness;
    await profile.save();
  }

  async businessDocumentBookkeeping(
    userId: mongoose.ObjectId,
    hasBusinessDocument: boolean,
  ) {
    const profile = await this.profileModel.findOne({ userId });
    profile.hasBusinessDocument = hasBusinessDocument;
    await profile.save();
  }

  async acceptPrivacyPolicy(userId: mongoose.ObjectId) {
    const profile = await this.profileModel.findOne({ userId });
    profile.hasAcceptedPrivacyPolicy = true;
    if (profile.firstName && profile.lastName && profile.email) {
      profile.hasCompletedProfile = true;
    }
    await profile.save();
    await this.serviceStationService.updateServiceStationTeamUserDetail(
      userId.toString(),
      profile,
    );

    return profile;
  }

  getUserFullName(profile: Profile) {
    const firstName = profile?.firstName?.trim() || '';
    const middleName = profile?.middleName?.trim() || '';
    const lastName = profile?.lastName?.trim() || '';
    return `${firstName} ${middleName} ${lastName}`.trim();
  }
}
