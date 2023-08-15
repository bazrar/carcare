import * as R from 'ramda';
import * as jwt from 'jsonwebtoken';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CreateServiceStationDto,
  ServiceHoursDto,
} from './dto/create-service-station.dto';
import {
  ServiceHours,
  ServiceStation,
  ServiceStationManagerType,
  ServiceStationRoleType,
  ServiceStationTypeEnum,
} from './schemas/service-station.schema';
import * as mongoose from 'mongoose';
import { FilterServiceStationListDto } from './dto/list-service-station-filter.dto';
import { UpdateServiceStationDto } from './dto/update-service-station.dto';
import { ConfigService } from '@nestjs/config';
import { MailerService } from 'src/mailer/mailer.service';
import { SearchServiceStationDto } from './dto/search-service-station.dto';
import { GeoService } from 'src/geo/geo.service';
import { ProviderService } from 'src/provider-services/schemas/provider-service.schema';
import { S3Service } from 'src/s3/s3.service';
import { User } from 'src/user/schemas/auth.schema';
import { BusinessService } from 'src/business/business.service';
import { DynamicLinkService } from 'src/dynamic-link/dynamic-link.service';
import { SeekerPlaceService } from '../seeker-place/seeker-place.service';
import { SmsService } from 'src/sms/sms.service';
import { UserService } from 'src/user/user.service';
import { WashRequestService } from 'src/wash-request/wash-request.service';
import { UpdateServiceStationLocationDto } from './dto/update-service-station-location.dto';
import { Role } from 'src/user/enums/roles.enum';
import { LocationTrackingGateway } from 'src/location-tracking/location-tracking.gateway';
import { Profile } from 'src/profile/schemas/profile.schema';
import { ProfileService } from 'src/profile/profile.service';
@Injectable()
export class ServiceStationService {
  constructor(
    @InjectModel(ServiceStation.name)
    private readonly serviceStationModel: mongoose.Model<ServiceStation>,
    @InjectModel(ProviderService.name)
    private readonly providerServiceModel: mongoose.Model<ProviderService>,
    private readonly businessService: BusinessService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly geoService: GeoService,
    private readonly s3Service: S3Service,
    private readonly dynamicLinkService: DynamicLinkService,
    private readonly seekerPlaceService: SeekerPlaceService,
    private readonly smsService: SmsService,
    private readonly userService: UserService,
    private readonly washRequestService: WashRequestService,
    private readonly locationTrackingGateway: LocationTrackingGateway,
    private readonly profileService: ProfileService,
  ) {}

  async findServiceStationById(serviceStationId: string) {
    const serviceStation = await this.findServiceStationByParams({
      _id: new mongoose.mongo.ObjectId(serviceStationId),
    });
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }
    return serviceStation;
  }

  async listServiceStation(
    user: User,
    listServiceStationFilterDto?: FilterServiceStationListDto,
  ) {
    const { q, pickAndDrop, serviceStationType } = listServiceStationFilterDto;

    let params: {
      name?: object;
      pickAndDrop?: boolean;
      serviceStationType?: ServiceStationTypeEnum;
      userId?: mongoose.ObjectId;
      'managerDetails.userId'?: string;
      'team.userId'?: string;
    } = {};
    if (q) {
      params.name = { $regex: new RegExp(q, 'i') };
    }
    if (R.not(R.isNil(pickAndDrop))) {
      params = { ...params, pickAndDrop };
    }
    if (serviceStationType) {
      params = { ...params, serviceStationType };
    }

    user.role === 'provider'
      ? (params = { ...params, userId: user._id })
      : user.role === 'manager'
      ? (params = { ...params, 'managerDetails.userId': user.id })
      : (params = { ...params, 'team.userId': user.id });

    const queryParams = {
      ...params,
      deleted: false,
    };
    const servicestations = await this.serviceStationModel.aggregate([
      { $match: queryParams },
      {
        $lookup: {
          from: 'providerservices',
          localField: 'services',
          foreignField: 'serviceId',
          as: 'providerServices',
          let: { service_station_id: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$serviceStationId', '$$service_station_id'],
                    },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'services',
                localField: 'serviceId',
                foreignField: '_id',
                as: 'service',
              },
            },
            { $unwind: { path: '$service' } },
            {
              $project: {
                _id: '$service._id',
                jobs: 1,
                minPrice: 1,
                maxPrice: 1,
                providedServiceId: '$_id',
                isActive: 1,
                expectedTimeToComplete: 1,
                name: '$service.name',
                description: '$service.description',
              },
            },
          ],
        },
      },
      ...this.washRequestService.getActiveServicesCountQuery(),
      {
        $project: {
          _id: 1,
          name: 1,
          serviceStationType: 1,
          serviceStationManagerType: 1,
          address: 1,
          bookingCapacity: 1,
          activeServiceCount: 1,
          serviceHours: 1,
          pickAndDrop: 1,
          availableWithin: 1,
          location: {
            latitude: {
              $arrayElemAt: ['$location.coordinates', 1],
            },
            longitude: {
              $arrayElemAt: ['$location.coordinates', 0],
            },
          },
          published: 1,
          userId: 1,
          businessId: 1,
          managerDetails: 1,
          team: 1,
          isLocationTrackingEnabled: 1,
          services: '$providerServices',
        },
      },
    ]);

    return servicestations.map((servicestation) => {
      const ss = servicestation;
      if (
        servicestation.serviceStationManagerType ===
        ServiceStationManagerType.OTHER
      ) {
        return {
          ...ss,
          email: ss.managerDetails.email,
        };
      }
      return ss;
    });
  }

  locationTrackedTeamMemberCount(team: ServiceStation['team']) {
    return team?.filter((member) => member.enableLocationTracking)?.length;
  }

  validateLocationTrackedTeamMember({
    serviceStationType,
    team,
  }: {
    serviceStationType: ServiceStation['serviceStationType'];
    team: ServiceStation['team'];
  }) {
    const trackedTeamMember = this.locationTrackedTeamMemberCount(team);

    if (
      serviceStationType === ServiceStationTypeEnum.FIXED &&
      trackedTeamMember > 0
    ) {
      throw new BadRequestException(
        "enableLocationTracking should be false for all team member's with fixed serviceStationType",
      );
    }

    if (trackedTeamMember > 1) {
      throw new BadRequestException(
        'enableLocationTracking should be true for only one team member',
      );
    }

    if (serviceStationType === ServiceStationTypeEnum.MOBILE) {
      if (trackedTeamMember === 0) {
        throw new BadRequestException(
          'for mobile serviceStationType, set enableLocationTracking true for atleast one team member',
        );
      } else {
        return true;
      }
    }

    return false;
  }

  updateServiceStationTeamMemberLocationTracking({
    serviceStationType,
    team,
  }: {
    serviceStationType: ServiceStation['serviceStationType'];
    team: ServiceStation['team'];
  }) {
    let isLocationTrackingEnabled = false;

    const trackedTeamMemberCount = this.locationTrackedTeamMemberCount(team);
    let teamMembers = [...team];
    if (team?.length > 0) {
      if (serviceStationType === ServiceStationTypeEnum.MOBILE) {
        isLocationTrackingEnabled = true;
        if (trackedTeamMemberCount === 0) {
          teamMembers = teamMembers.map((teamMember, index) => ({
            ...teamMember,
            enableLocationTracking: index === 0,
          }));
        }
      } else if (serviceStationType === ServiceStationTypeEnum.FIXED) {
        isLocationTrackingEnabled = false;
        teamMembers = teamMembers.map((teamMember) => ({
          ...teamMember,
          enableLocationTracking: false,
        }));
      }
    }
    console.log(teamMembers);

    return { isLocationTrackingEnabled, teamMembers };
  }

  async updateServiceStationById(
    userId: mongoose.ObjectId,
    serviceStationId: string,
    updateServiceStationDto: UpdateServiceStationDto,
  ) {
    const serviceStation = await this.findServiceStationByParams({
      _id: new mongoose.mongo.ObjectId(serviceStationId),
      deleted: false,
    });
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }
    const {
      name,
      serviceStationType,
      pickAndDrop,
      availableWithin,
      location,
      serviceStationManagerType,
      bookingCapacity,
      team,
      // locationTrackingMemberId,
      serviceHours,
    } = updateServiceStationDto;

    this.validateServiceHours(serviceHours);

    const { latitude, longitude } = location;
    serviceStation.name = name;
    serviceStation.serviceStationType = serviceStationType;
    serviceStation.pickAndDrop = pickAndDrop;
    serviceStation.bookingCapacity = bookingCapacity;
    serviceStation.availableWithin = availableWithin;
    serviceStation.serviceHours = serviceHours as ServiceHours;

    serviceStation.location = {
      type: 'Point',
      coordinates: [longitude, latitude],
    };

    const { isLocationTrackingEnabled, teamMembers: updatedTeams } =
      this.updateServiceStationTeamMemberLocationTracking({
        team,
        serviceStationType,
      });
    this.validateLocationTrackedTeamMember({
      team: updatedTeams,
      serviceStationType,
    });
    serviceStation.isLocationTrackingEnabled = isLocationTrackingEnabled;

    if (serviceStationManagerType === ServiceStationManagerType.OTHER) {
      const managerMobileNum = team.filter(
        (member) => member.role === ServiceStationRoleType.MANAGER,
      )[0].mobileNumber;
      if (
        !serviceStation.managerDetails.userId ||
        serviceStation.managerDetails.mobileNumber !== managerMobileNum
      ) {
        serviceStation.managerDetails = {
          mobileNumber: managerMobileNum,
        };
      }
    } else {
      serviceStation.managerDetails.userId = userId.toString();
    }

    const teamMembers = updatedTeams.map((teamUser) => {
      if (
        updatedTeams.some(
          (user) =>
            user.mobileNumber === teamUser.mobileNumber &&
            user.role === teamUser.role,
        )
      ) {
        const filterMem = updatedTeams.filter(
          (user) =>
            user.mobileNumber === teamUser.mobileNumber &&
            user.role === teamUser.role,
        );
        return filterMem[0];
      } else {
        if (teamUser.role === ServiceStationRoleType.MANAGER && teamUser.userId)
          delete teamUser.userId;
        return teamUser;
      }
    });
    console.log({ teamMembers });

    serviceStation.team = teamMembers;

    serviceStation.team.map((data) => {
      console.log('name', data.name);
      console.log('mobileNumber', data.mobileNumber);
      console.log('role', data.role);
      console.log('userId', data.userId);
      console.log('dynamiclinkShared', data.dynamicLinkShared);
    });

    const mobNumWithErr = [];

    if (serviceStation.team.length) {
      await Promise.all(
        serviceStation.team.map(async (member, index) => {
          if (!member.userId && !member.dynamicLinkShared) {
            const data = {
              station: serviceStation.id,
              mobileNumber: member.mobileNumber,
              role: member.role,
            };
            const token = jwt.sign(data, process.env.JWT_SECRET_KEY);
            console.log({ token });
            const redirectURL = await this.dynamicLinkService.getDynamicLink(
              token,
            );

            if (redirectURL.error) {
              mobNumWithErr.push(member.mobileNumber);
            }

            if (!mobNumWithErr.length) {
              try {
                console.log({ member });
                console.log(
                  `This is to notify that you are invited to be part of '+ ${serviceStation.name} +'. To verify your account, please click here ' + ${redirectURL.dynamicLink}`,
                );
                serviceStation.team[index].dynamicLinkShared = true;

                await this.smsService.sendSms(
                  member.mobileNumber,
                  `This is to notify that you are invited to be part of ${serviceStation.name}.To verify your account, please click here.${redirectURL.dynamicLink}.`,
                );
              } catch (error) {
                console.log(error);
                mobNumWithErr.push(member.mobileNumber);
              }
            }
          }
        }),
      );
    }

    await serviceStation.save();

    if (mobNumWithErr.length) {
      return {
        serviceStation,
        errors: {
          message: `Error while inviting users with given mobileNumbers: ${mobNumWithErr}`,
        },
      };
    }

    return serviceStation;
  }

  private getTimeValue(time: string): number {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));
    return date.getTime();
  }

  private validateServiceHours(serviceHours: ServiceHoursDto) {
    if (serviceHours) {
      const { openingTime, closingTime } = serviceHours;
      const openingTimeValue = this.getTimeValue(openingTime);
      const closingTimeValue = this.getTimeValue(closingTime);
      if (openingTimeValue > closingTimeValue) {
        throw new BadRequestException(
          'Opening time cannot be greater than closing time',
        );
      }
    }
  }

  async createServiceStation(
    createServiceStationDto: CreateServiceStationDto & {
      user: User;
    },
  ) {
    const {
      name,
      availableWithin,
      user,
      location,
      bookingCapacity,
      serviceStationManagerType,
      team,
      serviceStationType,
      serviceHours,
    } = createServiceStationDto;

    this.validateServiceHours(serviceHours);

    const { isLocationTrackingEnabled, teamMembers: updatedTeams } =
      this.updateServiceStationTeamMemberLocationTracking({
        team,
        serviceStationType,
      });

    this.validateLocationTrackedTeamMember({
      team: updatedTeams,
      serviceStationType,
    });

    const { latitude, longitude } = location;
    const address = await this.geoService.getPlaceNameFromLatLong(
      latitude,
      longitude,
    );

    const params: any = {};
    if (user.role === 'provider') {
      params.userId = user._id;
    } else {
      params.managers = user._id;
    }
    const business = await this.businessService.findBusinessByParams(params);

    const station: any = {
      name,
      availableWithin,
      userId: business.userId,
      address,
      businessId: business._id,
      serviceStationManagerType,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      bookingCapacity,
      team: updatedTeams,
      serviceStationType,
      isLocationTrackingEnabled,
      serviceHours: serviceHours,
    };

    if (serviceStationManagerType === ServiceStationManagerType.OTHER) {
      station.managerDetails = {
        mobileNumber: team.filter(
          (member) => member.role === ServiceStationRoleType.MANAGER,
        )[0].mobileNumber,
      };
    } else {
      station.managerDetails = { userId: user._id };
    }
    const serviceStation = await this.serviceStationModel.create(station);
    const mobNumWithErr = [];

    if (team.length) {
      await Promise.all(
        serviceStation.team.map(async (member, index) => {
          if (member.mobileNumber !== user.mobileNumber) {
            const data = {
              station: serviceStation.id,
              mobileNumber: member.mobileNumber,
              role: member.role,
            };
            const token = jwt.sign(data, process.env.JWT_SECRET_KEY);
            console.log({ token });
            const redirectURL = await this.dynamicLinkService.getDynamicLink(
              token,
            );

            if (redirectURL.error) {
              mobNumWithErr.push(member.mobileNumber);
            }

            if (!mobNumWithErr.length) {
              try {
                console.log(
                  `This is to notify that you are invited to be part of '+ ${serviceStation.name} +'. To verify your account, please click here ' + ${redirectURL.dynamicLink}`,
                );
                await this.smsService.sendSms(
                  member.mobileNumber,
                  'This is to notify that you are invited to be part of ' +
                    serviceStation.name +
                    '. To verify your account, please click here ' +
                    redirectURL.dynamicLink,
                );
                serviceStation.team[index].dynamicLinkShared = true;
              } catch (error) {
                console.log(error);
                mobNumWithErr.push(member.mobileNumber);
              }
            }
            // const to = [email];
            // await this.mailerService.sendServiceManagerRegistrationMail(
            //   to,
            //   serviceStation.name,
            //   redirectURL.dynamicLink,
            // );
          }
        }),
      );
    }

    await serviceStation.save();

    if (mobNumWithErr.length) {
      return {
        serviceStation,
        errors: {
          message: `Error while inviting users with given mobileNumbers: ${mobNumWithErr}`,
        },
      };
    }

    return serviceStation;
  }

  async removeServiceStationManager(user: User, serviceStationId: string) {
    const serviceStation = await this.findServiceStationByParams({
      _id: new mongoose.mongo.ObjectId(serviceStationId),
      deleted: false,
    });
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }

    serviceStation.managerDetails = {
      mobileNumber: null,
      userId: null,
    };

    //add remove manager from team
    serviceStation.team = serviceStation.team.filter(
      (teamUser) => teamUser.role !== 'manager',
    );

    await serviceStation.save();
    return;
    // what to do once, service station manager is removed
  }

  async deleteServiceStationById(
    userId: mongoose.ObjectId,
    serviceStationId: string,
  ): Promise<void> {
    const serviceStation = await this.findServiceStationByParams({
      _id: new mongoose.mongo.ObjectId(serviceStationId),
      deleted: false,
    });
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }
    serviceStation.deleted = true;
    await serviceStation.save();
    return;
  }

  async getServiceStationById(serviceStationId: string) {
    const serviceStationObjectId = new mongoose.mongo.ObjectId(
      serviceStationId,
    );
    const serviceStation = await this.serviceStationModel.aggregate([
      {
        $match:
          /**
           * query: The query in MQL.
           */
          {
            _id: serviceStationObjectId,
          },
      },
      {
        $lookup:
          /**
           * from: The target collection.
           * localField: The local join field.
           * foreignField: The target join field.
           * as: The name for the results.
           * pipeline: Optional pipeline to run on the foreign collection.
           * let: Optional variables to use in the pipeline field stages.
           */
          {
            from: 'providerservices',
            localField: 'services',
            foreignField: 'serviceId',
            as: 'providerServices',
            pipeline: [
              {
                $match: {
                  serviceStationId: serviceStationObjectId,
                },
              },
              {
                $lookup: {
                  from: 'services',
                  localField: 'serviceId',
                  foreignField: '_id',
                  as: 'service',
                },
              },
              {
                $unwind: {
                  path: '$service',
                },
              },
              {
                $project: {
                  _id: '$service._id',
                  jobs: 1,
                  minPrice: 1,
                  maxPrice: 1,
                  providedServiceId: '$_id',
                  isActive: 1,
                  expectedTimeToComplete: 1,
                  name: '$service.name',
                  description: '$service.description',
                },
              },
            ],
          },
      },
      ...this.washRequestService.getActiveServicesCountQuery(),
      {
        $project:
          /**
           * specifications: The fields to
           *   include or exclude.
           */
          {
            _id: 1,
            name: 1,
            serviceStationType: 1,
            serviceStationManagerType: 1,
            address: 1,
            bookingCapacity: 1,
            activeServiceCount: 1,
            pickAndDrop: 1,
            serviceHours: 1,
            availableWithin: 1,
            location: {
              latitude: {
                $arrayElemAt: ['$location.coordinates', 1],
              },
              longitude: {
                $arrayElemAt: ['$location.coordinates', 0],
              },
            },
            published: 1,
            userId: 1,
            businessId: 1,
            managerDetails: 1,
            team: 1,
            isLocationTrackingEnabled: 1,
            services: '$providerServices',
          },
      },
      {
        $limit:
          /**
           * Provide the number of documents to limit.
           */
          1,
      },
    ]);
    return serviceStation?.[0];
  }

  async findServiceStationByParams(params = {}) {
    const serviceStation: ServiceStation =
      await this.serviceStationModel.findOne(params);
    return serviceStation;
  }

  async searchServiceStations(
    userId: any,
    serviceId: string,
    serviceStationSearchDto: SearchServiceStationDto,
  ) {
    const {
      latitude,
      longitude,
      // nearest__asc,
      // nearest__desc,
      // price__gt,
      // price__lt,
      // serviceStationType,
      sortBy,
    } = serviceStationSearchDto;
    await this.seekerPlaceService.updatePlaceTimestamp(
      userId,
      latitude,
      longitude,
    );
    // by default sort by distance
    let sort: any = { distance: 1 };

    if (sortBy === 'price') {
      // sort by max price.
      sort = {
        maxPrice: 1,
      };
    }

    const serviceStations = await this.serviceStationModel.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [+longitude, +latitude] },
          distanceField: 'distance',
          distanceMultiplier: 1 / 1609.34, // meter to miles
          key: 'location',
          includeLocs: 'dist.location',
          maxDistance: 10 * 1609.34,
          spherical: true,
        },
      },
      // match service in services
      {
        $match: {
          published: true,
          $expr: {
            $in: [new mongoose.mongo.ObjectId(serviceId), '$services'],
          },
        },
      },

      // group and sort stage if sort by price is provided
      {
        $lookup: {
          from: 'providerservices',
          let: {
            service_id: new mongoose.mongo.ObjectId(serviceId),
            service_station: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$serviceStationId', '$$service_station'] },
                    { $eq: ['$serviceId', '$$service_id'] },
                  ],
                },
              },
            },
          ],
          as: 'providerService',
        },
      },
      {
        $unwind: {
          path: '$providerService',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'feedbacks',
          let: { providerservice_id: '$providerService._id' },
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
        $lookup: {
          from: 'businesses',
          localField: 'userId',
          foreignField: 'userId',
          as: 'business',
        },
      },
      {
        $unwind: {
          path: '$business',
          preserveNullAndEmptyArrays: false,
        },
      },
      ...this.washRequestService.getActiveServicesCountQuery(),
      {
        $project: {
          // compute distance also
          _id: '$providerService._id',
          distance: 1,
          address: 1,
          description: '$providerService.description',
          name: 1,
          isActive: '$providerService.isActive',
          serviceStationType: 1,
          serviceType: serviceId,
          serviceHours: 1,
          pickAndDrop: 1,
          bookingCapacity: 1,
          activeServiceCount: 1,
          minPrice: '$providerService.minPrice',
          maxPrice: '$providerService.maxPrice',
          expectedTimeToComplete: '$providerService.expectedTimeToComplete',
          published: 1,
          ratings: '$feedbacks',
          business: '$business',
          message: {
            // $cond: { if: { $eq: ['$serviceStationType', 'mobile'] } },
            // then: ',
            // else: {
            //   $cond: { if: { $eq: ['$pickAndDrop', true] } },
            //   then: 'Pick & drop service',
            //   else: "Doesn't have pick & drop service",
            // },
            $switch: {
              branches: [
                {
                  case: { $eq: ['$serviceStationType', 'mobile'] },
                  then: 'Provide service at your location',
                },
                {
                  case: { $eq: ['$pickAndDrop', true] },
                  then: 'Pick & drop service',
                },
              ],
              default: "Doesn't have pick & drop service",
            },
            // $cond: {
            //   if: { $eq: ['$serviceStationType', 'mobile'] },
            //   then: 'Provide service at your location',
            //   else: 20,
            // },
          },
        },
      },
      {
        $sort: { ...sort },
      },
    ]);
    if (serviceStations.length) {
      const serviceStationsWithRatings = await Promise.all(
        serviceStations.map(async (serviceStation) => {
          let ratings = 0;
          if (serviceStation.ratings?.length) {
            let totalRatings = 0;
            serviceStation.ratings.map((rating: any) => {
              totalRatings = totalRatings + rating.rating;
            });
            ratings = totalRatings / serviceStation.ratings.length;
          }
          serviceStation.ratings = ratings;
          serviceStation.businessImage = '';
          if (serviceStation.business?.logo) {
            serviceStation.businessImage = await this.s3Service.getSignedUrl(
              serviceStation.business.logo,
            );
          }
          if (serviceStation?.business?.coverImage) {
            serviceStation.businessCoverImage =
              await this.s3Service.getSignedUrl(
                serviceStation.business.coverImage,
              );
          }
          return serviceStation;
        }),
      );
      return serviceStationsWithRatings;
    }

    return serviceStations;
  }

  async searchServiceStationDetail(_id: any, providerServiceId: string) {
    const providerService = await this.providerServiceModel.aggregate([
      {
        $match: {
          _id: new mongoose.mongo.ObjectId(providerServiceId),
        },
      },
      {
        $lookup: {
          from: 'servicestations',
          localField: 'serviceStationId',
          foreignField: '_id',
          as: 'servicestations',
          pipeline: this.washRequestService.getActiveServicesCountQuery(),
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
          from: 'businesses',
          localField: 'userId',
          foreignField: 'userId',
          as: 'business',
        },
      },
      {
        $unwind: {
          path: '$business',
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
          name: '$servicestations.name',
          address: '$servicestations.address',
          bookingCapacity: '$servicestations.bookingCapacity',
          activeServiceCount: '$servicestations.activeServiceCount',
          serviceType: '$serviceId',
          serviceStationType: '$servicestations.serviceStationType',
          published: '$servicestations.published',
          serviceHours: '$servicestations.serviceHours',
          expectedTimeToComplete: 1,
          minPrice: 1,
          maxPrice: 1,
          jobs: 1,
          isActive: 1,
          ratings: '$feedbacks',
          business: '$business',
          assignedUsers: '$servicestations.assignedUsers',
        },
      },
    ]);

    if (!providerService.length) {
      throw new NotFoundException('Service station not found');
    }

    let rating = 0;
    let noOfReviews = 0;

    providerService[0].businessImage = '';
    if (providerService[0].business?.logo) {
      providerService[0].businessImage = await this.s3Service.getSignedUrl(
        providerService[0].business.logo,
      );
    }
    if (providerService[0].business?.coverImage) {
      providerService[0].businessCoverImage = await this.s3Service.getSignedUrl(
        providerService[0].business.coverImage,
      );
    }

    if (providerService[0].ratings?.length) {
      noOfReviews = providerService[0].ratings.length;
      let totalRatings = 0;
      providerService[0].ratings.map(async (rating: any) => {
        totalRatings = totalRatings + rating.rating;
      });
      rating = totalRatings / providerService[0].ratings.length;
    }

    providerService[0].noOfReviews = noOfReviews;
    providerService[0].rating = rating;
    providerService[0].description = providerService[0].business.description;

    return providerService[0];
  }

  async publishServiceStation(user: User, serviceStationId: string) {
    // todo: can only publish if they have added at least once service, otherwise they cant
    const serviceStation = await this.findServiceStationByParams({
      _id: new mongoose.mongo.ObjectId(serviceStationId),
      deleted: false,
    });
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }

    if (!serviceStation.services.length) {
      throw new BadRequestException('No services listed in service station');
    }

    if (serviceStation.published) {
      throw new BadRequestException('Service station already published');
    }
    serviceStation.published = true;
    await serviceStation.save();
    return serviceStation;
  }

  async unpublishServiceStation(user: User, serviceStationId: string) {
    const serviceStation = await this.findServiceStationByParams({
      _id: new mongoose.mongo.ObjectId(serviceStationId),
      deleted: false,
    });
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }
    if (!serviceStation.published) {
      throw new BadRequestException('Service station already unpublished');
    }
    serviceStation.published = false;
    await serviceStation.save();
    return serviceStation;
  }

  async getActiveMembers(serviceStationId: string) {
    const serviceStation = await this.findServiceStationByParams({
      _id: new mongoose.mongo.ObjectId(serviceStationId),
      deleted: false,
    });
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }

    const activeMembers: any[] = [];
    if (serviceStation.team?.length) {
      const teamMembers = serviceStation.team.filter(
        (member) => member.role === ServiceStationRoleType.TEAM_MEMBER,
      );

      if (teamMembers.length) {
        await Promise.all(
          teamMembers.map(async (member) => {
            if (member.userId) {
              const memberStatus =
                await this.washRequestService.getMemberAvailabilityStatus(
                  member.userId,
                );
              const memberWithAvailabilityStatus = {
                ...member,
                availabilityStatus: memberStatus,
              };
              activeMembers.push(memberWithAvailabilityStatus);
            }
          }),
        );
      }
    }

    return activeMembers;
  }

  async updateServiceStationTeam(serviceStationId: string, team: any) {
    await this.serviceStationModel.updateOne(
      { _id: serviceStationId },
      {
        $set: {
          team: team,
        },
      },
    );
  }

  async updateServiceStationTeamUserDetail(userId: string, profile: Profile) {
    const params: any = {
      team: {
        $elemMatch: {
          userId: userId,
        },
      },
    };
    const serviceStation = await this.findServiceStationByParams(params);

    if (serviceStation) {
      this.validateLocationTrackedTeamMember(serviceStation);
      const userName = this.profileService.getUserFullName(profile);
      const team = serviceStation.team;
      const objIndex = team.findIndex((obj) => obj.userId === userId);
      team[objIndex].name = userName;

      await this.updateServiceStationTeam(serviceStation._id, team);
    }
  }

  async checkUserInTeam(
    serviceStationId: string,
    user: User,
  ): Promise<boolean> {
    const teamExists = await this.serviceStationModel.findOne({
      _id: serviceStationId,
      'teams.userId': user._id,
    });
    return !!teamExists;
  }

  async validateServiceStation(serviceStationId: string, user: User) {
    const userId = user._id;

    const query = {
      _id: new mongoose.mongo.ObjectId(serviceStationId),
      published: true,
      deleted: false,
      $or: [
        {
          userId,
        },
        {
          'managerDetails.userId': userId,
        },
        {
          team: {
            $elemMatch: {
              userId: userId.toString(),
            },
          },
        },
      ],
    };
    const serviceStation = await this.serviceStationModel.findOne(query);
    if (!serviceStation) {
      throw new NotFoundException('Service station not found');
    }
    return serviceStation;
  }

  async toggleLocationTracking(serviceStationId: string, user: User) {
    const serviceStation = await this.validateServiceStation(
      serviceStationId,
      user,
    );
    // Check if user has permission for toggle location tracking
    const hasAssignedLocationTracking =
      serviceStation?.team.findIndex(
        (member) => member.enableLocationTracking,
      ) !== -1;

    if (!hasAssignedLocationTracking) {
      throw new BadRequestException(
        'No team member has location tracking enabled, Please enable location tracking for a team member',
      );
    }
    if (
      user.role === Role.TEAM_MEMBER &&
      serviceStation?.team.findIndex(
        (member) =>
          member.userId?.toString() === user._id?.toString() &&
          member.enableLocationTracking,
      ) === -1
    ) {
      throw new ForbiddenException(
        "You don't have permission for toggle location tracking ",
      );
    }

    if (serviceStation.serviceStationType !== ServiceStationTypeEnum.MOBILE) {
      throw new BadRequestException('Service station type is not mobile');
    }

    serviceStation.isLocationTrackingEnabled =
      !serviceStation?.isLocationTrackingEnabled;
    await serviceStation.save();
    return serviceStation;
  }

  /**
   * Updates the location of a service station for a specific user.
   *
   * @param {User} user - The user object.
   * @param {string} serviceStationId - The ID of the service station.
   * @param {UpdateServiceStationLocationDto} location - The new location of the service station.
   * @return {Promise<ServiceStation>} The updated service station object.
   */
  async updateLocation(
    user: User,
    serviceStationId: string,
    location: UpdateServiceStationLocationDto,
  ) {
    const serviceStation = await this.serviceStationModel.findOne({
      _id: serviceStationId,
      'teams.userId': user._id,
      locationTrackingMemberId: user._id,
      serviceStationType: ServiceStationTypeEnum.MOBILE,
      isDeleted: false,
    });

    if (!serviceStation)
      throw new NotFoundException('Service station not found');

    if (!serviceStation.isLocationTrackingEnabled)
      throw new BadRequestException('Location tracking is not enabled');

    serviceStation.location = {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    };
    this.locationTrackingGateway.handleLocationUpdate(location);
    return await serviceStation.save();
  }

  async searchServiceStationsWithinRadius(
    location: UpdateServiceStationLocationDto,
    radius: number,
  ) {
    const coordinates = [location.longitude, location.latitude] as [
      number,
      number,
    ];
    const serviceStations = await this.serviceStationModel.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates,
          },
          distanceField: 'distance',
          distanceMultiplier: 1 / 1609.34,
          maxDistance: radius,
          spherical: true,
          key: 'location',
          query: {
            published: true,
            deleted: false,
          },
        },
      },
      {
        $lookup: {
          from: 'providerservices',
          localField: '_id',
          foreignField: 'serviceStationId',
          as: 'providerServices',
          pipeline: [
            {
              $lookup: {
                from: 'feedbacks',
                localField: '_id',
                foreignField: 'to',
                as: 'feedbacks',
              },
            },
            {
              $lookup: {
                from: 'services',
                localField: 'serviceId',
                foreignField: '_id',
                as: 'service',
              },
            },
            {
              $unwind: {
                path: '$service',
                preserveNullAndEmptyArrays: false,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessId',
          foreignField: '_id',
          as: 'business',
        },
      },
      {
        $unwind: {
          path: '$business',
          preserveNullAndEmptyArrays: false,
        },
      },
    ]);
    if (!serviceStations?.length) {
      return [];
    }
    const promises = [];
    serviceStations.forEach((serviceStation) => {
      promises.push(this.s3Service.getSignedUrl(serviceStation.business.logo));
    });
    const businessLogos = await Promise.all(promises);

    return serviceStations?.map((serviceStation, index) => {
      serviceStation.businessImage = businessLogos?.[index];
      const providerServices = serviceStation?.providerServices ?? [];
      providerServices?.map((providerService) => {
        const ratings = providerService.ratings ?? [];
        const totalRatings = ratings?.reduce((acc: number, rating) => {
          acc += rating.rating;
          return acc;
        }, 0 as number);
        providerService['rating'] = totalRatings / ratings.length ?? 0;
        providerService['noOfReviews'] = ratings.length;
        return providerService;
      });
      serviceStation['providerServices'] = providerServices;
      return serviceStation;
    });
  }

  async toggleProviderServiceActiveStatus(
    serviceStationId: string,
    serviceId: string,
    user: User,
  ) {
    await this.validateServiceStation(serviceStationId, user);

    const providerService = await this.providerServiceModel.findOne({
      serviceId,
      serviceStationId,
    });
    if (!providerService) {
      throw new NotFoundException('Provider service not found');
    }

    providerService.isActive = !providerService.isActive;

    return await providerService.save();
  }
}
