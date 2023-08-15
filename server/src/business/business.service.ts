import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Business } from './schemas/business.schema';
import * as mongoose from 'mongoose';
import { basename, extname } from 'path';
import { S3Service } from 'src/s3/s3.service';
import { ProfileService } from 'src/profile/profile.service';
import { User } from 'src/user/schemas/auth.schema';
import { BusinessVerificationStatus } from './enums/business-verifcation-status.enum';
import { Role } from 'src/user/enums/roles.enum';
import { ServiceStationService } from 'src/service-station/service-station.service';
@Injectable()
export class BusinessService {
  constructor(
    @InjectModel(Business.name) private readonly businessModel: Model<Business>,
    private readonly s3Service: S3Service,
    private readonly profileService: ProfileService,
    @Inject(forwardRef(() => ServiceStationService))
    private readonly serviceStationService: ServiceStationService,
  ) {}
  async createBusiness(
    createBusinessDto: CreateBusinessDto & {
      userId: mongoose.ObjectId;
      logo: Express.Multer.File;
      coverImage: Express.Multer.File;
    },
  ) {
    const business = await this.findBusinessByParams({
      userId: createBusinessDto.userId,
      deleted: false,
    });
    if (business) {
      throw new BadRequestException(
        'Business with a given name already exists',
      );
    }
    const {
      name,
      description,
      website,
      contactNumber,
      zipCode,
      userId,
      logo,
      isSoloProprietor,
      instagramUrl,
      location,
      coverImage,
    } = createBusinessDto;
    const { longitude, latitude } = JSON.parse(location as any);

    // upload logo to s3
    const [fileName, coverImageName] = await Promise.all([
      this.uploadLogo(logo),
      this.uploadCoverImage(coverImage),
    ]);
    const newBusiness = await this.businessModel.create({
      name,
      description,
      website,
      contactNumber,
      zipCode,
      userId,
      logo: fileName,
      isSoloProprietor,
      instagramUrl,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      coverImage: coverImageName,
    });
    await this.updateBusinessBookkeeping(userId, newBusiness);
    const [logoUrl, coverImageUrl] = await Promise.all([
      this.s3Service.getSignedUrl(fileName),
      this.s3Service.getSignedUrl(coverImageName),
    ]);
    return {
      ...newBusiness.toJSON(),
      logoUrl,
      coverImageUrl,
    };
  }

  private async uploadLogo(logo: any) {
    const baseName = basename(logo.originalname);
    const extName = extname(logo.originalname);

    const fileName = `business/${baseName.replace(
      extName,
      '',
    )}_${Date.now()}${extname(logo.originalname)}`;
    await this.s3Service.uploadFile(logo.buffer, fileName);
    return fileName;
  }

  private async uploadCoverImage(coverImage: any) {
    const baseName = basename(coverImage.originalname);
    const extName = extname(coverImage.originalname);

    const fileName = `business/cover-image/${baseName.replace(
      extName,
      '',
    )}_${Date.now()}${extname(coverImage.originalname)}`;
    await this.s3Service.uploadFile(coverImage.buffer, fileName);
    return fileName;
  }

  async updateBusiness(user: User, updateBusinessDto: UpdateBusinessDto) {
    const params =
      user.role === 'provider'
        ? {
            userId: user._id,
            deleted: false,
          }
        : {
            managers: user._id,
            deleted: false,
          };
    const business: Business = await this.findBusinessByParams(params);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    business.name = updateBusinessDto.name || business.name;
    business.description =
      updateBusinessDto.description || business.description;
    business.website = updateBusinessDto.website;
    business.instagramUrl =
      updateBusinessDto.instagramUrl || business.instagramUrl;
    business.contactNumber =
      updateBusinessDto.contactNumber || business.contactNumber;
    business.isSoloProprietor =
      updateBusinessDto?.isSoloProprietor ?? business.isSoloProprietor;
    if (updateBusinessDto?.location) {
      const { latitude, longitude } = JSON.parse(
        updateBusinessDto.location as any,
      );
      business.location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };
    }

    if (updateBusinessDto.zipCode) {
      const zipCode = updateBusinessDto.zipCode;
      const isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(zipCode);
      if (!isValidZip) {
        return 'Invalid zip code';
      }
      business.zipCode = updateBusinessDto.zipCode;
    }

    if (updateBusinessDto.logo) {
      const fileName = await this.uploadLogo(updateBusinessDto.logo);
      business.logo = fileName;
    }

    if (updateBusinessDto.coverImage) {
      const fileName = await this.uploadCoverImage(
        updateBusinessDto.coverImage,
      );
      business.coverImage = fileName;
    }

    const updatedBusiness = await business.save();
    await this.updateBusinessBookkeeping(user._id, updatedBusiness);
    return updatedBusiness;
  }

  async deleteBusiness(user: User) {
    const params =
      user.role === 'provider'
        ? {
            userId: user._id,
            deleted: false,
          }
        : {
            managers: user._id,
            deleted: false,
          };
    const business = await this.findBusinessByParams(params);
    if (!business) {
      throw new NotFoundException('Business not found');
    }
    business.deleted = true;
    await business.save();
    return;
  }

  async verifyProvider(businessId: string, verified: string) {
    const params = {
      _id: new mongoose.mongo.ObjectId(businessId),
    };
    const business: Business = await this.findBusinessByParams(params);
    business.verificationStatus =
      verified === 'true'
        ? BusinessVerificationStatus.VERIFIED
        : BusinessVerificationStatus.REJECTED;
    await business.save();
    return;
  }

  async findBusinessByParams(params = {}) {
    const business = await this.businessModel.findOne(params);
    return business;
  }

  async getBusiness(user: User) {
    let params: any = {};
    if (user.role === Role.TEAM_MEMBER) {
      const queryParams = { 'team.userId': user.id };
      const serviceStation =
        await this.serviceStationService.findServiceStationByParams(
          queryParams,
        );

      params = { userId: serviceStation.userId };
    } else if (user.role === Role.PROVIDER) {
      params = { userId: user._id };
    } else {
      params = { managers: user._id };
    }

    const business = await this.findBusinessByParams(params);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    let registrationUrl = '',
      insuranceUrl = '',
      logoUrl = '',
      coverImageUrl = '';
    if (business.registrationDocument) {
      registrationUrl = await this.s3Service.getSignedUrl(
        business.registrationDocument,
      );
    }
    if (business.insuranceDocument) {
      insuranceUrl = await this.s3Service.getSignedUrl(
        business.insuranceDocument,
      );
    }
    if (business.logo) {
      logoUrl = await this.s3Service.getSignedUrl(business.logo);
    }
    if (business.coverImage) {
      coverImageUrl = await this.s3Service.getSignedUrl(business.coverImage);
    }
    return {
      ...business.toJSON(),
      registrationUrl,
      insuranceUrl,
      logoUrl,
      coverImageUrl,
    };
  }

  async uploadRegistrationDocument(
    user: User,
    businessDocument: Express.Multer.File,
  ) {
    const params =
      user.role === 'provider'
        ? {
            userId: user._id,
            // deleted: false,
          }
        : {
            managers: user._id,
            // deleted: false,
          };

    const business = await this.findBusinessByParams(params);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const fileName = await this.uploadDoc(businessDocument, 'registration');

    business.registrationDocument = fileName;
    await business.save();
    const registrationDocument = await this.s3Service.getSignedUrl(
      business.registrationDocument,
    );
    await this.updateBusinessBookkeeping(user._id, business);
    return {
      documentUrl: registrationDocument,
    };
  }

  async uploadInsuranceDocument(user: User, file: Express.Multer.File) {
    const params =
      user.role === 'provider'
        ? {
            userId: user._id,
            // deleted: false,
          }
        : {
            managers: user._id,
            // deleted: false,
          };

    const business = await this.findBusinessByParams(params);

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    const fileName = await this.uploadDoc(file, 'insurance');

    business.insuranceDocument = fileName;
    await business.save();
    const insuranceDocument = await this.s3Service.getSignedUrl(
      business.insuranceDocument,
    );
    await this.updateBusinessBookkeeping(user._id, business);
    return {
      documentUrl: insuranceDocument,
    };
  }

  async updateBusinessBookkeeping(
    userId: mongoose.ObjectId,
    business: Business,
  ) {
    if (
      business.name &&
      business.description &&
      business.contactNumber &&
      business.zipCode &&
      business.logo
    ) {
      await this.profileService.businessBookkeeping(userId, true);
    } else {
      await this.profileService.businessBookkeeping(userId, false);
    }
    if (business.insuranceDocument && business.registrationDocument) {
      await this.profileService.businessDocumentBookkeeping(userId, true);
    } else {
      await this.profileService.businessDocumentBookkeeping(userId, false);
    }
  }

  private async uploadDoc(
    businessDocument: Express.Multer.File,
    docType: string,
  ) {
    const baseName = basename(businessDocument.originalname);
    const extName = extname(businessDocument.originalname);

    const fileName = `${docType}/${baseName.replace(
      extName,
      '',
    )}_${Date.now()}${extname(businessDocument.originalname)}`;
    await this.s3Service.uploadFile(businessDocument.buffer, fileName);
    return fileName;
  }

  async getProviders(
    page: string,
    limit: string,
    sortKey: string,
    sortType: string,
  ) {
    // collection of business
    const matchParams: any = {};
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

    const providers = await this.businessModel
      .aggregate([
        { $match: matchParams },
        {
          $lookup: {
            from: 'providerservices',
            localField: 'userId',
            foreignField: 'userId',
            as: 'providerServices',
          },
        },
        {
          $unwind: {
            path: '$providerServices',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'washrequests',
            let: { servicestation_id: '$providerServices.serviceStationId' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$serviceStation', '$$servicestation_id'] }],
                  },
                },
              },
            ],
            as: 'washrequests',
          },
        },
        {
          $unwind: {
            path: '$washrequests',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'feedbacks',
            let: { providerservice_id: '$providerServices._id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$to', '$$providerservice_id'] }],
                  },
                },
              },
            ],
            as: 'feedbacks',
          },
        },
        {
          $group: {
            _id: '$_id',
            createdAt: {
              $first: '$createdAt',
            },
            name: {
              $first: '$name',
            },
            earning: {
              $sum: {
                $cond: [
                  {
                    $in: ['$washrequests.status', ['completed']],
                  },
                  '$washrequests.amount',
                  0,
                ],
              },
            },
            servicesCompleted: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$washrequests.providerServiceStatus',
                      ['payment-received'],
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            servicesCancelled: {
              $sum: {
                $cond: [
                  {
                    $in: ['$washrequests.status', ['provider_rejected']],
                  },
                  1,
                  0,
                ],
              },
            },
            rating: {
              $first: {
                $avg: '$feedbacks.rating',
              },
            },
            verificationStatus: {
              $first: '$verificationStatus',
            },
          },
        },
      ])
      .sort(sort)
      .skip((pageinNumType - 1) * limitinNumType)
      .limit(limitinNumType);

    const providersCount: number = await this.businessModel.countDocuments();

    return { providers, providersCount };
  }

  async getProviderDetail(providerId: string) {
    // businessDetail
    const matchParams: any = {
      _id: new mongoose.mongo.ObjectId(providerId),
    };
    const providerDetails = await this.businessModel.aggregate([
      { $match: matchParams },
      {
        $lookup: {
          from: 'profiles',
          localField: 'userId',
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
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'users',
        },
      },
      {
        $unwind: {
          path: '$users',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'providerservices',
          localField: 'userId',
          foreignField: 'userId',
          as: 'providerServices',
        },
      },
      {
        $unwind: {
          path: '$providerServices',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'feedbacks',
          let: { providerservice_id: '$providerServices._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$to', '$$providerservice_id'] }],
                },
              },
            },
          ],
          as: 'feedbacks',
        },
      },
      {
        $group: {
          _id: '$_id',
          firstName: {
            $first: '$profiles.firstName',
          },
          middleName: {
            $first: '$profiles.middleName',
          },
          lastName: {
            $first: '$profiles.lastName',
          },
          email: {
            $first: '$profiles.email',
          },
          avatar: {
            $first: '$profiles.avatar',
          },
          mobileNumber: {
            $first: '$users.mobileNumber',
          },
          business: {
            $first: {
              name: '$name',
              zipCode: '$zipCode',
              logo: '$logo',
              website: '$website',
              verificationStatus: '$verificationStatus',
              rating: {
                $avg: '$feedbacks.rating',
              },
              contactNumber: '$contactNumber',
              joinedDate: '$createdAt',
              description: '$description',
              registrationDoc: '$registrationDocument',
              insuranceDoc: '$insuranceDocument',
            },
          },
        },
      },
    ]);

    const providerDetail = providerDetails[0];
    let avatar = '';
    let businessLogo = '';
    let registrationDoc = '';
    let insuranceDoc = '';

    if (providerDetail.avatar) {
      avatar = await this.s3Service.getSignedUrl(providerDetail.avatar);
    }
    if (providerDetail.business.logo) {
      businessLogo = await this.s3Service.getSignedUrl(
        providerDetail.business.logo,
      );
    }
    if (providerDetail.business.registrationDoc) {
      registrationDoc = await this.s3Service.getSignedUrl(
        providerDetail.business.registrationDoc,
      );
    }
    if (providerDetail.business.insuranceDoc) {
      insuranceDoc = await this.s3Service.getSignedUrl(
        providerDetail.business.insuranceDoc,
      );
    }

    providerDetail.avatar = avatar;
    providerDetail.business.logo = businessLogo;
    providerDetail.business.registrationDoc = registrationDoc;
    providerDetail.business.insuranceDoc = insuranceDoc;

    return { provider: providerDetail };
  }

  async getServiceStations(businessId: string) {
    const params: any = { _id: new mongoose.mongo.ObjectId(businessId) };

    const serviceStations = await this.businessModel.aggregate([
      { $match: params },
      {
        $lookup: {
          from: 'servicestations',
          localField: 'userId',
          foreignField: 'userId',
          as: 'servicestations',
        },
      },
      {
        $unwind: {
          path: '$servicestations',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'profiles',
          let: { user_id: '$servicestations.managerDetails.userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$userId', '$$user_id'] }],
                },
              },
            },
          ],
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
          from: 'users',
          let: { user_id: '$servicestations.managerDetails.userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$_id', '$$user_id'] }],
                },
              },
            },
          ],
          as: 'users',
        },
      },
      {
        $unwind: {
          path: '$users',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        // update service type data
        $lookup: {
          from: 'services',
          let: { servicesArr: '$servicestations.services' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$_id', '$$servicesArr'],
                },
              },
            },
          ],
          as: 'services',
        },
      },
      {
        $project: {
          _id: '$servicestations._id',
          name: '$servicestations.name',
          address: '$servicestations.address',
          published: '$servicestations.published',
          serviceManager: {
            firstName: '$profiles.firstName',
            middleName: '$profiles.middleName',
            lastName: '$profiles.lastName',
            contactInfo: {
              email: '$profiles.email',
              contactNumber: '$users.mobileNumber',
            },
          },
          serviceCapacity: '$servicestations.bookingCapacity',
          services: '$services',
          serviceType: '$services.name',
        },
      },
    ]);

    return { serviceStations };
  }

  async getTotalEarnings(businessId: string) {
    const params = { _id: new mongoose.mongo.ObjectId(businessId) };

    const firstDayCurrentMonth = this.getFirstDayOfMonth();
    const currentDayPreviousMonth = this.getCurrentDayPreviousMonth();
    const firstDayPreviousMonth = this.getFirstDayOfPrevMonth();

    const totalEarnings = await this.businessModel.aggregate([
      { $match: params },
      {
        $lookup: {
          from: 'providerservices',
          localField: 'userId',
          foreignField: 'userId',
          as: 'providerServices',
        },
      },
      {
        $unwind: {
          path: '$providerServices',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'washrequests',
          let: { servicestation_id: '$providerServices.serviceStationId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$serviceStation', '$$servicestation_id'] }],
                },
              },
            },
          ],
          as: 'washrequests',
        },
      },
      {
        $unwind: {
          path: '$washrequests',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'payments',
          let: { washrequest_id: '$washrequests._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$washRequest', '$$washrequest_id'] }],
                },
              },
            },
          ],
          as: 'payments',
        },
      },
      {
        $group: {
          _id: '$_id',
          earning: {
            $sum: {
              $cond: [
                {
                  $in: ['$washrequests.status', ['completed']],
                },
                '$washrequests.amount',
                0,
              ],
            },
          },
          revenueNewCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $in: ['$washrequests.status', ['completed']],
                    },
                    {
                      $gte: ['$washrequests.createdAt', firstDayCurrentMonth],
                    },
                  ],
                },
                '$washrequests.amount',
                0,
              ],
            },
          },
          revenuePreviousCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $in: ['$washrequests.status', ['completed']],
                    },
                    {
                      $lte: [
                        '$washrequests.createdAt',
                        currentDayPreviousMonth,
                      ],
                    },
                    {
                      $gt: ['$washrequests.createdAt', firstDayPreviousMonth],
                    },
                  ],
                },
                '$washrequests.amount',
                0,
              ],
            },
          },
        },
      },
    ]);

    return {
      totalEarnings,
      earnings: totalEarnings[0].earning,
      revenue: {
        newCount: totalEarnings[0].revenueNewCount,
        previousCount: totalEarnings[0].revenuePreviousCount,
        change: this.diffPercent(
          totalEarnings[0].revenueNewCount,
          totalEarnings[0].revenuePreviousCount,
        ),
      },
    };
  }

  async searchProviders(queryString: string) {
    const matchParams: any = {};

    const providers = await this.businessModel.aggregate([
      { $match: matchParams },
      {
        $lookup: {
          from: 'providerservices',
          localField: 'userId',
          foreignField: 'userId',
          as: 'providerServices',
        },
      },
      {
        $unwind: {
          path: '$providerServices',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'washrequests',
          let: { servicestation_id: '$providerServices.serviceStationId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$serviceStation', '$$servicestation_id'] }],
                },
              },
            },
          ],
          as: 'washrequests',
        },
      },
      {
        $unwind: {
          path: '$washrequests',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'feedbacks',
          let: { providerservice_id: '$providerServices._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$to', '$$providerservice_id'] }],
                },
              },
            },
          ],
          as: 'feedbacks',
        },
      },
      {
        $addFields: {
          result: {
            $regexMatch: {
              input: '$name',
              regex: queryString,
              options: 'i',
            },
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          createdAt: {
            $first: '$createdAt',
          },
          name: {
            $first: '$name',
          },
          earning: {
            $sum: {
              $cond: [
                {
                  $in: ['$washrequests.status', ['completed']],
                },
                '$washrequests.amount',
                0,
              ],
            },
          },
          servicesCompleted: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$washrequests.providerServiceStatus',
                    ['payment-received'],
                  ],
                },
                1,
                0,
              ],
            },
          },
          servicesCancelled: {
            $sum: {
              $cond: [
                {
                  $in: ['$washrequests.status', ['provider_rejected']],
                },
                1,
                0,
              ],
            },
          },
          rating: {
            $first: {
              $avg: '$feedbacks.rating',
            },
          },
          verificationStatus: {
            $first: '$verificationStatus',
          },
          result: {
            $first: '$result',
          },
        },
      },
    ]);

    const providersWithQueryMatch = providers.filter(
      (provider) => provider.result === true,
    );

    return {
      providers: providersWithQueryMatch,
      providersCount: providersWithQueryMatch.length,
    };
  }

  getFirstDayOfMonth() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1);
  }

  getFirstDayOfPrevMonth() {
    const date = new Date();
    date.setDate(0); //sets date to the last day of the previous month
    date.setDate(1); //sets date to the first day of that month
    date.setHours(0, 0, 0, 0); //sets date time to midnight
    return date;
  }

  getCurrentDayPreviousMonth() {
    const date = new Date();
    const currentDay = date.getDate();
    date.setDate(0); //sets date to the last day of the previous month
    date.setDate(currentDay); //sets date to the current day of that month
    date.setHours(0, 0, 0, 0); //sets date time to midnight
    return date;
  }

  diffPercent(a, b) {
    if (!a || !b || (a === 0 && b === 0)) {
      return 0 + '%';
    }
    return (a < b ? '-' + ((b - a) * 100) / a : ((a - b) * 100) / b) + '%';
  }
}
