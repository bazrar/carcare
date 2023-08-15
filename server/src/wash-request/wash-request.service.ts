import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ProviderServicesService } from 'src/provider-services/provider-services.service';
import { SeekerPlaceService } from 'src/seeker-place/seeker-place.service';
import { ServiceStationService } from 'src/service-station/service-station.service';
import { UserVehicleService } from 'src/user-vehicle/user-vehicle.service';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import {
  AcceptWashRequestDto,
  AddFeedbackDto,
  WashRequestDto,
  UpdateProviderStatusDto,
  VerifyTokenDto,
} from './dto/booking.dto';
import {
  WashRequestStatus,
  ProviderServiceStatus,
} from './enums/wash-request-status.enum';
import { WashRequest } from './schemas/wash-request.schema';
import { User } from 'src/user/schemas/auth.schema';
import { S3Service } from 'src/s3/s3.service';
import { BadRequestException } from '@nestjs/common';
import { NotificationService } from 'src/notification/notification.service';
import { FeedbackService } from 'src/feedback/feedback.service';
import { CarMetadataService } from 'src/car-metadata/car-metadata.service';
import { CarMetadata } from 'src/car-metadata/schemas/car-metadata.schema';
import { ProfileService } from 'src/profile/profile.service';
import { WashRequestGateWay } from './wash-request.gateway';
import { ServiceStationRoleType } from 'src/service-station/schemas/service-station.schema';
import { Role } from 'src/user/enums/roles.enum';

@Injectable()
export class WashRequestService {
  constructor(
    @InjectModel(WashRequest.name)
    private readonly washRequestModel: mongoose.Model<WashRequest>,
    private readonly vehicleService: UserVehicleService,
    @Inject(forwardRef(() => ServiceStationService))
    private readonly serviceStationService: ServiceStationService,
    private readonly placeService: SeekerPlaceService,
    private readonly providerServicesService: ProviderServicesService,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
    private readonly feedbackService: FeedbackService,
    private readonly carMetaDataService: CarMetadataService,
    private readonly profileService: ProfileService,
    private readonly washRequestGateWay: WashRequestGateWay,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {}

  async bookProviderService(
    userId: mongoose.ObjectId, // userId is seekerId
    providerServiceId: string,
    washRequestDto: WashRequestDto,
  ) {
    const { vehicleId, placeId, paymentMethod } = washRequestDto;

    const [seekerVehicle, seekerPlace, seekerProfile, providerService] =
      await Promise.all([
        this.vehicleService.findUserVehicleByParams({
          userId,
          _id: vehicleId,
        }),
        this.placeService.findSeekerPlaceById(userId, placeId),
        this.profileService.getProfileByUserId(userId),
        this.providerServicesService.findProviderServiceByParams({
          _id: providerServiceId,
        }),
      ]);

    const serviceStation =
      await this.serviceStationService.findServiceStationByParams({
        _id: providerService.serviceStationId,
      });

    const providerUserId =
      serviceStation?.managerDetails?.userId || providerService.userId;

    const washRequestCount = await this.washRequestModel.count();

    const washRequest = await this.washRequestModel.create({
      status: WashRequestStatus.PENDING,
      orderNumber: (washRequestCount + 1).toString().padStart(6, '0'),
      service: providerService.serviceId,
      serviceStation: providerService.serviceStationId,
      business: serviceStation.businessId,
      vehicle: seekerVehicle._id,
      place: seekerPlace._id,
      provider: providerUserId,
      userId: userId, // seekerId
      paymentMethod,
    });

    const vehicleMetaData: CarMetadata =
      await this.carMetaDataService.findCarMetadataByAttribues({
        _id: seekerVehicle.carMetadataId,
      });
    console.log(
      'Washrequest vechicle metadata: ',
      JSON.stringify(vehicleMetaData.toJSON(), null, 2),
    );

    const seekerName = this.profileService.getUserFullName(seekerProfile);
    await this.notificationService.sendNotifications('booking_created', {
      seekerName,
      brand: vehicleMetaData.make,
      model: vehicleMetaData.model,
      status: washRequest.status,
      from: userId,
      to: providerUserId,
      washRequest: washRequest._id,
    });
    await this.notifyWashRequest(washRequest);

    return washRequest;
  }

  async listAllWashRequest(user: User) {
    const matchParams: any = {};
    if (user.role === 'seeker') {
      matchParams.userId = new mongoose.mongo.ObjectId(user.id);
    } else {
      const serviceStation =
        await this.serviceStationService.findServiceStationByParams({
          team: {
            $elemMatch: {
              userId: user.id,
              role: ServiceStationRoleType.TEAM_MEMBER,
            },
          },
        });

      if (serviceStation) {
        matchParams.assignedTo = new mongoose.mongo.ObjectId(user.id);
      } else {
        matchParams.provider = new mongoose.mongo.ObjectId(user.id);
      }
    }
    console.log({ matchParams });

    const washRequests = await this.washRequestModel
      .aggregate([
        { $match: matchParams },
        {
          $lookup: {
            from: 'uservehicles',
            localField: 'vehicle',
            foreignField: '_id',
            as: 'vehicles',
          },
        },
        {
          $unwind: {
            path: '$vehicles',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'carmetadatas',
            localField: 'vehicles.carMetadataId',
            foreignField: '_id',
            as: 'metadata',
          },
        },
        {
          $unwind: {
            path: '$metadata',
            preserveNullAndEmptyArrays: true,
          },
        },
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
            from: 'profiles',
            localField: 'assignedTo',
            foreignField: 'userId',
            as: 'teamMemberProfile',
          },
        },
        {
          $unwind: {
            path: '$teamMemberProfile',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'seekerplaces',
            localField: 'place',
            foreignField: '_id',
            as: 'seekerplace',
          },
        },
        {
          $unwind: {
            path: '$seekerplace',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: 'providerservices',
            let: { service_id: '$service', service_station: '$serviceStation' },
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
            as: 'providerservices',
          },
        },
        {
          $unwind: {
            path: '$providerservices',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: 'servicestations',
            localField: 'serviceStation',
            foreignField: '_id',
            as: 'servicestation',
          },
        },
        {
          $unwind: {
            path: '$servicestation',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            _id: 1,
            status: 1,
            orderNumber: 1,
            amount: 1,
            tips: 1,
            paymentMethod: 1,
            createdAt: 1,
            color: '$vehicles.color',
            make: '$metadata.make',
            model: '$metadata.model',
            bodyStyles: '$metadata.bodyStyles',
            year: '$metadata.year',
            serviceType: '$service',
            vehicleImage: '$vehicles.vehicleImage',
            seekerFirstName: '$profiles.firstName',
            seekerMiddleName: '$profiles.middleName',
            seekerLastName: '$profiles.lastName',
            seekerImage: '$profiles.avatar',
            locationName: '$seekerplace.name',
            seekerLocation: {
              latitude: '$seekerplace.latitude',
              longitude: '$seekerplace.longitude',
            },
            minPrice: '$providerservices.minPrice',
            maxPrice: '$providerservices.maxPrice',
            providerLocation: '$servicestation.location.coordinates',
            providerServiceStatus: 1,
            businessId: '$providerservices._id',
            seekerId: '$userId',
            assignedTo: '$teamMemberProfile',
            serviceStationName: '$servicestation.name',
          },
        },
      ])
      .sort({ createdAt: -1 });

    const washRequestsWithVehicleImageSignedUrls = await Promise.all(
      washRequests.map(async (washRequest) => {
        let vehicleImage = '';
        let seekerImage = '';

        if (washRequest.vehicleImage) {
          vehicleImage = await this.s3Service.getSignedUrl(
            washRequest.vehicleImage,
          );
        }

        if (washRequest.seekerImage) {
          seekerImage = await this.s3Service.getSignedUrl(
            washRequest.seekerImage,
          );
        }

        washRequest.vehicleImage = vehicleImage;
        washRequest.seekerImage = seekerImage;
        washRequest.distance = this.calcDist(
          washRequest.seekerLocation.latitude,
          washRequest.seekerLocation.longitude,
          washRequest.providerLocation[1],
          washRequest.providerLocation[0],
        );
        return washRequest;
      }),
    );
    return washRequestsWithVehicleImageSignedUrls;
  }

  async listWashRequest(washRequestId: string, user: User) {
    if (user.role === Role.TEAM_MEMBER) {
      const userWashRequest = await this.washRequestModel.findOne({
        _id: new mongoose.mongo.ObjectId(washRequestId),
        assignedTo: new mongoose.mongo.ObjectId(user._id),
      });

      if (!userWashRequest) {
        throw new BadRequestException('Washrequest not found');
      }
    }
    const washRequest = await this.washRequestModel.aggregate([
      { $match: { _id: new mongoose.mongo.ObjectId(washRequestId) } },
      {
        $lookup: {
          from: 'uservehicles',
          localField: 'vehicle',
          foreignField: '_id',
          as: 'vehicles',
        },
      },
      {
        $unwind: {
          path: '$vehicles',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'carmetadatas',
          localField: 'vehicles.carMetadataId',
          foreignField: '_id',
          as: 'metadata',
        },
      },
      {
        $unwind: {
          path: '$metadata',
          preserveNullAndEmptyArrays: true,
        },
      },
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
          from: 'profiles',
          localField: 'assignedTo',
          foreignField: 'userId',
          as: 'teamMemberProfile',
        },
      },
      {
        $unwind: {
          path: '$teamMemberProfile',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'seekerplaces',
          localField: 'place',
          foreignField: '_id',
          as: 'seekerplace',
        },
      },
      {
        $unwind: {
          path: '$seekerplace',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'providerservices',
          let: { service_id: '$service', service_station: '$serviceStation' },
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
          as: 'providerservices',
        },
      },
      {
        $unwind: {
          path: '$providerservices',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'servicestations',
          localField: 'serviceStation',
          foreignField: '_id',
          as: 'servicestation',
        },
      },
      {
        $unwind: {
          path: '$servicestation',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'business',
          foreignField: '_id',
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
          foreignField: 'washRequest',
          as: 'feedbacks',
        },
      },
      {
        $lookup: {
          from: 'feedbacks',
          localField: 'provider',
          foreignField: 'to',
          as: 'businessfeedbacks',
        },
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'washRequest',
          as: 'payment',
        },
      },
      {
        $project: {
          _id: 1,
          status: 1,
          statusHistory: 1,
          tips: 1,
          amount: 1,
          orderNumber: 1,
          paymentMethod: 1,
          availabilityStatus: 1,
          color: '$vehicles.color',
          make: '$metadata.make',
          model: '$metadata.model',
          bodyStyles: '$metadata.bodyStyles',
          year: '$metadata.year',
          serviceType: '$service',
          vehicleImage: '$vehicles.vehicleImage',
          seekerFirstName: '$profiles.firstName',
          seekerMiddleName: '$profiles.middleName',
          seekerLastName: '$profiles.lastName',
          seekerImage: '$profiles.avatar',
          locationName: '$seekerplace.name',
          seekerLocation: {
            latitude: '$seekerplace.latitude',
            longitude: '$seekerplace.longitude',
          },
          minPrice: '$providerservices.minPrice',
          maxPrice: '$providerservices.maxPrice',
          serviceStationId: '$serviceStation',
          providerName: '$servicestation.name',
          providerLocation: '$servicestation.location.coordinates',
          expectedTimeToComplete: '$providerservices.expectedTimeToComplete',
          pickAndDrop: '$servicestation.pickAndDrop',
          providerServiceStatus: 1,
          providerServiceStatusHistory: 1,
          businessId: '$providerservices._id',
          seekerId: '$userId',
          business: '$business',
          businessRating: {
            $avg: '$businessfeedbacks',
          },
          seekerRating: {
            $getField: {
              field: 'rating',
              input: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$feedbacks',
                      as: 'feedback',
                      cond: {
                        $eq: ['$$feedback.from', '$userId'],
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
          providerRating: {
            $getField: {
              field: 'rating',
              input: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$feedbacks',
                      as: 'feedback',
                      cond: {
                        $eq: ['$$feedback.from', '$provider'],
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
          paymentCompletedAt: '$payment.createdAt',
          assignedTo: '$teamMemberProfile',
        },
      },
    ]);

    let vehicleImage = '';
    let seekerImage = '';

    if (washRequest[0].vehicleImage) {
      vehicleImage = await this.s3Service.getSignedUrl(
        washRequest[0].vehicleImage,
      );
    }

    if (washRequest[0].seekerImage) {
      seekerImage = await this.s3Service.getSignedUrl(
        washRequest[0].seekerImage,
      );
    }

    washRequest[0].vehicleImage = vehicleImage;
    washRequest[0].seekerImage = seekerImage;
    washRequest[0].distance = this.calcDist(
      washRequest[0].seekerLocation.latitude,
      washRequest[0].seekerLocation.longitude,
      washRequest[0].providerLocation[1],
      washRequest[0].providerLocation[0],
    );
    washRequest[0].businessImage = '';
    if (washRequest[0].business?.logo) {
      washRequest[0].businessImage = await this.s3Service.getSignedUrl(
        washRequest[0].business.logo,
      );
    }

    washRequest[0].serviceCharge =
      this.configService.get<string>('SERVICE_CHARGE'); //% of service charge

    return washRequest[0];
  }

  async completeServiceRequest(
    userId: mongoose.ObjectId,
    washRequestId: string,
  ) {
    const washRequest = await this.findWashRequestByParams({
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });
    washRequest.status = WashRequestStatus.COMPLETED;
    washRequest.completedAt = new Date();
    await washRequest.save();
    await this.notifyWashRequest(washRequest);
    return { message: 'Success' };
  }

  async rejectServiceRequest(user: User, washRequestId: string, type: string) {
    const queryParams: any =
      user.role === 'seeker'
        ? {
            userId: new mongoose.mongo.ObjectId(user.id),
          }
        : {
            provider: new mongoose.mongo.ObjectId(user.id),
          };
    const washRequest = await this.findWashRequestByParams({
      _id: new mongoose.mongo.ObjectId(washRequestId),
      ...queryParams,
    });
    if (washRequest.status === WashRequestStatus.CONFIRMED) {
      throw new BadRequestException('Wash request already confirmed');
    }
    if (
      [
        WashRequestStatus.SEEKER_REJECTED,
        WashRequestStatus.PROVIDER_REJECTED,
      ].includes(washRequest.status)
    ) {
      throw new BadRequestException('Wash request already rejected');
    }

    washRequest.status =
      type === 'seeker_rejected'
        ? WashRequestStatus.SEEKER_REJECTED
        : WashRequestStatus.PROVIDER_REJECTED;
    await washRequest.save();
    await this.notifyWashRequest(washRequest);

    const seekerVehicle = await this.vehicleService.findUserVehicleByParams({
      userId: washRequest.userId,
      _id: washRequest.vehicle,
    });

    const vehicleMetaData: CarMetadata =
      await this.carMetaDataService.findCarMetadataByAttribues({
        _id: seekerVehicle.carMetadataId,
      });

    const serviceStation =
      await this.serviceStationService.findServiceStationByParams({
        _id: washRequest.serviceStation,
      });

    const providerUserId =
      serviceStation.managerDetails?.userId || washRequest.provider;

    let notificationType = '';
    const notificationPayload: any = {
      brand: vehicleMetaData.make,
      model: vehicleMetaData.model,
      status: washRequest.status,
      washRequest: washRequest._id,
    };

    if (type === 'seeker_rejected') {
      const seekerProfile = await this.profileService.getProfileByUserId(
        user._id,
      );
      notificationType = 'booking_rejected_by_seeker';
      const seekerName = this.profileService.getUserFullName(seekerProfile);
      notificationPayload.seekerName = seekerName;
      notificationPayload.from = washRequest.userId;
      notificationPayload.to = providerUserId;
    } else {
      const serviceStation =
        await this.serviceStationService.findServiceStationByParams({
          _id: washRequest.serviceStation,
        });
      notificationType = 'booking_rejected_by_provider';
      notificationPayload.serviceStationName = serviceStation.name;
      notificationPayload.from = providerUserId;
      notificationPayload.to = washRequest.userId;
    }

    await this.notificationService.sendNotifications(
      notificationType,
      notificationPayload,
    );
    return washRequest;
  }

  async acceptServiceRequest(
    userId: mongoose.ObjectId,
    washRequestId: string,
    availability: AcceptWashRequestDto,
  ) {
    const washRequest = await this.findWashRequestByParams({
      provider: userId,
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });
    washRequest.status = WashRequestStatus.ACCEPTED;
    const { amount, availabilityStatus, approximateTimeToComplete } =
      availability;
    washRequest.amount = amount;
    washRequest.availabilityStatus = availabilityStatus;
    washRequest.approximateTimeToComplete = approximateTimeToComplete;
    await washRequest.save();
    await this.notifyWashRequest(washRequest);

    const [seekerVehicle, serviceStation] = await Promise.all([
      this.vehicleService.findUserVehicleByParams({
        userId: washRequest.userId,
        _id: washRequest.vehicle,
      }),
      this.serviceStationService.findServiceStationByParams({
        _id: washRequest.serviceStation,
      }),
    ]);

    const vehicleMetaData: CarMetadata =
      await this.carMetaDataService.findCarMetadataByAttribues({
        _id: seekerVehicle.carMetadataId,
      });
    // check if availabilityStatus.availableAfter is after current time
    // send conditional notification
    await this.notificationService.sendNotifications('booking_accepted', {
      serviceStationName: serviceStation.name,
      brand: vehicleMetaData.make,
      model: vehicleMetaData.model,
      status: washRequest.status,
      from: serviceStation.managerDetails?.userId || washRequest.provider,
      to: washRequest.userId,
      washRequest: washRequest._id,
    });
    return washRequest;
  }

  async findWashRequestByParams(params = {}) {
    const washRequest = await this.washRequestModel.findOne(params);
    return washRequest;
  }

  async confirmServiceRequest(
    userId: mongoose.ObjectId,
    washRequestId: string,
  ) {
    const washRequest = await this.findWashRequestByParams({
      userId,
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });

    if (washRequest.status === WashRequestStatus.CONFIRMED) {
      throw new BadRequestException('Wash request already confirmed');
    }

    if (
      [
        WashRequestStatus.SEEKER_REJECTED,
        WashRequestStatus.PROVIDER_REJECTED,
      ].includes(washRequest.status)
    ) {
      throw new BadRequestException('Wash request already rejected');
    }
    washRequest.status = WashRequestStatus.CONFIRMED;
    await washRequest.save();

    const [seekerVehicle, seekerProfile] = await Promise.all([
      this.vehicleService.findUserVehicleByParams({
        userId,
        _id: washRequest.vehicle,
      }),
      this.profileService.getProfileByUserId(userId),
    ]);

    const vehicleMetaData: CarMetadata =
      await this.carMetaDataService.findCarMetadataByAttribues({
        _id: seekerVehicle.carMetadataId,
      });

    const serviceStation =
      await this.serviceStationService.findServiceStationByParams({
        _id: washRequest.serviceStation,
      });
    const currentDate = new Date().getTime();
    const availableAfterDate = new Date(
      washRequest.availabilityStatus.availableAfter,
    ).getTime();
    const diffDate = Math.abs(availableAfterDate - currentDate);
    if (diffDate > 0) {
      const seekerName = this.profileService.getUserFullName(seekerProfile);
      const bookingConfirmedNotificationToSeeker = {
        seekerName,
        brand: vehicleMetaData.make,
        model: vehicleMetaData.model,
        status: washRequest.status,
        from: washRequest.provider,
        to: serviceStation.managerDetails?.userId || washRequest.provider,
        washRequest: washRequest._id,
      };
      const bookinConfirmedNotificationToProvider = {
        seekerName,
        brand: vehicleMetaData.make,
        model: vehicleMetaData.model,
        status: washRequest.status,
        from: serviceStation.managerDetails?.userId || washRequest.provider,
        to: washRequest.provider,
        washRequest: washRequest._id,
      };
      // await this.notificationService.notifyBookingConfirmation(
      //   bookingConfirmedNotificationToSeeker,
      // );
      await this.notificationService.notifyBookingConfirmation(
        bookinConfirmedNotificationToProvider,
      );
    } else {
      // send notification through notification cron job
    }

    await this.notifyWashRequest(washRequest);
    return washRequest;
  }

  async assignServiceRequest(
    userId: mongoose.ObjectId,
    washRequestId: string,
    member: string,
  ) {
    const washRequest = await this.findWashRequestByParams({
      provider: userId,
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });

    const assignedTo = washRequest?.assignedTo?._id?.toString() as string;

    if (assignedTo === member) {
      throw new BadRequestException('Member already assigned');
    }

    const [seekerVehicle, serviceStation, seekerProfile] = await Promise.all([
      this.vehicleService.findUserVehicleByParams({
        userId: washRequest.userId,
        _id: washRequest.vehicle,
      }),
      this.serviceStationService.findServiceStationByParams({
        _id: washRequest.serviceStation,
      }),
      this.profileService.getUserProfile(washRequest.userId),
    ]);

    const vehicleMetaData: CarMetadata =
      await this.carMetaDataService.findCarMetadataByAttribues({
        _id: seekerVehicle.carMetadataId,
      });

    const memberInfo: User = await this.userService.findUserById(member);
    washRequest.assignedTo = memberInfo;
    await washRequest.save();

    const seekerName = this.profileService.getUserFullName(seekerProfile);

    const notificationFrom = (serviceStation.managerDetails?.userId ||
      washRequest.provider) as User;

    const notificationFromUserId = notificationFrom._id?.toString();
    if (notificationFromUserId !== member) {
      await this.notificationService.sendNotifications('booking_assigned', {
        seekerName,
        serviceStationName: serviceStation.name,
        brand: vehicleMetaData.make,
        model: vehicleMetaData.model,
        status: washRequest.status,
        from: notificationFrom,
        to: member,
        washRequest: washRequest._id,
      });
    }

    return washRequest;
  }

  async updateStatusRequest(
    user: User,
    washRequestId: string,
    updateProviderStatusDto: UpdateProviderStatusDto,
  ) {
    const washRequest = await this.findWashRequestByParams({
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });
    washRequest.providerServiceStatus = updateProviderStatusDto.status;
    await washRequest.save();

    const seekerVehicle = await this.vehicleService.findUserVehicleByParams({
      userId: washRequest.userId,
      _id: washRequest.vehicle,
    });

    const vehicleMetaData: CarMetadata =
      await this.carMetaDataService.findCarMetadataByAttribues({
        _id: seekerVehicle.carMetadataId,
      });

    const serviceStation =
      await this.serviceStationService.findServiceStationByParams({
        _id: washRequest.serviceStation,
      });

    // const providerUserId =
    //   serviceStation.managerDetails?.userId || washRequest.provider;
    const providerUserId = washRequest.assignedTo;
    const providerProfile = await this.profileService.getProfileByUserId(
      user._id,
    );
    if (!providerProfile) {
      throw new BadRequestException('Profile not setup yet');
    }

    const providerName = this.profileService.getUserFullName(providerProfile);

    switch (updateProviderStatusDto.status) {
      case 'commuting':
        await this.notificationService.sendNotifications('provider_commuting', {
          serviceStationName: serviceStation.name,
          brand: vehicleMetaData.make,
          model: vehicleMetaData.model,
          status: washRequest.providerServiceStatus,
          from: providerUserId,
          to: washRequest.userId,
          washRequest: washRequest._id,
        });
        break;

      case 'arrived':
        await this.notificationService.sendNotifications('provider_arrived', {
          providerName,
          brand: vehicleMetaData.make,
          model: vehicleMetaData.model,
          status: washRequest.providerServiceStatus,
          from: providerUserId,
          to: washRequest.userId,
          washRequest: washRequest._id,
        });
        break;

      case 'service-completed':
        await this.notificationService.sendNotifications('service_completed', {
          providerName,
          brand: vehicleMetaData.make,
          model: vehicleMetaData.model,
          from: providerUserId,
          to: washRequest.userId,
          washRequest: washRequest._id,
          status: washRequest.providerServiceStatus,
        });
        break;

      default:
        break;
    }
    await this.notifyWashRequest(washRequest);
    return washRequest;
  }

  async notifyPaymentCompletion(
    userId: mongoose.ObjectId,
    washRequestId: string,
  ) {
    const washRequest = await this.findWashRequestByParams({
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });

    const [seekerVehicle, seekerProfile] = await Promise.all([
      this.vehicleService.findUserVehicleByParams({
        userId,
        _id: washRequest.vehicle,
      }),
      this.profileService.getProfileByUserId(userId),
    ]);

    const vehicleMetaData: CarMetadata =
      await this.carMetaDataService.findCarMetadataByAttribues({
        _id: seekerVehicle.carMetadataId,
      });

    const seekerName = this.profileService.getUserFullName(seekerProfile);

    await Promise.all([
      this.notificationService.sendNotifications('payment_completed', {
        seekerName,
        brand: vehicleMetaData.make,
        model: vehicleMetaData.model,
        status: washRequest.status,
        from: userId,
        to: washRequest.assignedTo,
        washRequest: washRequest._id,
      }),
      this.notificationService.sendNotifications('payment_completed', {
        seekerName,
        brand: vehicleMetaData.make,
        model: vehicleMetaData.model,
        status: washRequest.status,
        from: userId,
        to: washRequest.provider,
        washRequest: washRequest._id,
      }),
    ]);
  }

  async getVerificationTokenRequest(washRequestId: string) {
    const washRequest = await this.findWashRequestByParams({
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });
    const token: string = this.generateOtp();
    washRequest.verificationToken = token;
    washRequest.providerServiceStatus = ProviderServiceStatus.CODE_SHARED;
    await washRequest.save();
    await this.notifyWashRequest(washRequest);
    return token;
  }

  async verifyTokenRequest(
    washRequestId: string,
    verifyTokenDto: VerifyTokenDto,
  ) {
    const washRequest = await this.findWashRequestByParams({
      _id: new mongoose.mongo.ObjectId(washRequestId),
      verificationToken: verifyTokenDto.token,
    });
    if (!washRequest) {
      return 'Invalid token';
    }
    washRequest.providerServiceStatus = ProviderServiceStatus.SERVICE_STARTED;
    // Start recording the time when the service is started
    washRequest.startedAt = new Date();
    await washRequest.save();
    await this.notifyWashRequest(washRequest);
    return 'Success';
  }

  async addFeedback(
    from: User,
    washRequestId: string,
    addFeedbackDto: AddFeedbackDto,
  ) {
    const washRequest = await this.findWashRequestByParams({
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });
    const providerService =
      await this.providerServicesService.findProviderServiceByParams({
        serviceId: washRequest.service,
        serviceStationId: washRequest.serviceStation,
      });

    const dbQuery = {
      washRequest: washRequestId,
      to: from.role === 'seeker' ? providerService._id : washRequest.userId,
      from: from.role === 'seeker' ? washRequest.userId : providerService._id,
    };

    return await this.feedbackService.addFeedback(dbQuery, addFeedbackDto);
  }

  async hasFeedback(from: User, washRequestId: string) {
    const dbQuery = {
      washRequest: washRequestId,
      from: from._id,
    };

    if (from.role === 'provider') {
      const washRequest = await this.findWashRequestByParams({
        _id: new mongoose.mongo.ObjectId(washRequestId),
      });

      const providerService =
        await this.providerServicesService.findProviderServiceByParams({
          serviceId: washRequest.service,
          serviceStationId: washRequest.serviceStation,
        });

      dbQuery.from = providerService._id;
    }

    const feedback = await this.feedbackService.getFeedback(dbQuery);

    if (feedback) {
      return true;
    }

    return false;
  }

  generateOtp(length = 6) {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  }

  calcDist(lat1, lon1, lat2, lon2) {
    // var R = 6371 // km
    const R = 3960; // miles
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const latitude1 = this.toRad(lat1);
    const latitude2 = this.toRad(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) *
        Math.sin(dLon / 2) *
        Math.cos(latitude1) *
        Math.cos(latitude2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }

  async getWashRequestProviderService(washRequestId: string) {
    const washRequest = await this.findWashRequestByParams({
      _id: new mongoose.mongo.ObjectId(washRequestId),
    });
    const providerService =
      await this.providerServicesService.findProviderServiceByParams({
        service: washRequest.service,
        serviceStation: washRequest.serviceStation,
      });
    return providerService;
  }

  async notifyWashRequest(washRequest: WashRequest) {
    const seekerId = washRequest.userId.toString();
    const providerId = washRequest.provider.toString();
    const washRequestId = washRequest._id.toString();
    const teamMemberId = washRequest.assignedTo?.toString();
    const status = washRequest.status;
    console.log('notifyWashRequest', {
      seekerId,
      providerId,
      washRequestId,
      status,
    });
    await this.washRequestGateWay.notifyWashRequestStatus(
      seekerId,
      washRequestId,
      status,
    );
    await this.washRequestGateWay.notifyWashRequestStatus(
      providerId,
      washRequestId,
      status,
    );
    if (teamMemberId && providerId !== teamMemberId) {
      await this.washRequestGateWay.notifyWashRequestStatus(
        teamMemberId,
        washRequestId,
        status,
      );
    }
  }

  async getGraphData() {
    const timeRange: Date = new Date();
    timeRange.setDate(timeRange.getDate() - 7);
    timeRange.setHours(0, 0, 0, 0);

    const matchParams: any = {
      createdAt: {
        $gte: timeRange,
      },
    };

    const report = await this.washRequestModel.aggregate([
      { $match: matchParams },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          washRequests: {
            $sum: 1,
          },
        },
      },
      // { $sort: { _id: -1 } },
    ]);

    const dateRangeArr = [
      this.getDateWithInitialDay(6),
      this.getDateWithInitialDay(5),
      this.getDateWithInitialDay(4),
      this.getDateWithInitialDay(3),
      this.getDateWithInitialDay(2),
      this.getDateWithInitialDay(1),
      this.getDateWithInitialDay(0),
    ];

    const newArr = dateRangeArr.map((date) => {
      if (report.some((data) => data._id === date)) {
        const index = report.findIndex((e) => e._id === date);
        return report[index];
      }

      return {
        _id: date,
        washRequests: 0,
      };
    });

    return { newArr };
  }

  async getWashRequests(
    page: string,
    limit: string,
    sortKey: string,
    sortType: string,
  ) {
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

    const washRequests = await this.washRequestModel
      .aggregate([
        { $match: matchParams },
        {
          $lookup: {
            from: 'servicestations',
            localField: 'serviceStation',
            foreignField: '_id',
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
            from: 'services',
            localField: 'service',
            foreignField: '_id',
            as: 'services',
          },
        },
        {
          $unwind: {
            path: '$services',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            _id: 1,
            orderNumber: 1,
            createdAt: 1,
            provider: '$servicestations.name',
            seeker:
              '$profiles.firstName' +
              ' ' +
              '$profiles.middleName' +
              ' ' +
              '$profiles.lastName',
            amount: 1,
            serviceType: '$services.name',
            status: 1,
            providerServiceStatus: 1,
          },
        },
      ])
      .sort(sort)
      .skip((pageinNumType - 1) * limitinNumType)
      .limit(limitinNumType);

    const washRequestCount: number =
      await this.washRequestModel.countDocuments();
    return { washRequests, washRequestCount };
  }

  async getAllFutureAvailableWashRequests() {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 5 * 60000);

    const washRequests = await this.washRequestModel.find({
      'availabilityStatus.availableNow': true,
      'availabilityStatus.availableAfter': {
        $gte: startDate,
        $lte: endDate,
      },
    });

    return washRequests;
  }

  async getAllWashRequests(params: any) {
    return await this.washRequestModel.find(params);
  }

  async getMemberAvailabilityStatus(userId: string) {
    const flagPeriodTime = new Date().setHours(new Date().getHours() + 1);
    const params = {
      assignedTo: new mongoose.mongo.ObjectId(userId),
      providerServiceStatus: {
        $nin: [
          ProviderServiceStatus.PAYMENT_RECEIVED,
          ProviderServiceStatus.SERVICE_COMPLETED,
        ],
      },
      'availabilityStatus.availableAfter': {
        $lte: flagPeriodTime,
      },
    };

    const washRequests = await this.getAllWashRequests(params);
    if (washRequests.length) {
      return 'booked';
    }
    return 'available';
  }

  async searchWashRequests(queryString: string) {
    const matchParams: any = {};

    const washRequests = await this.washRequestModel.aggregate([
      { $match: matchParams },
      {
        $lookup: {
          from: 'servicestations',
          localField: 'serviceStation',
          foreignField: '_id',
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
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'services',
        },
      },
      {
        $unwind: {
          path: '$services',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $addFields: {
          result: {
            $regexMatch: {
              input: '$servicestations.name',
              regex: queryString,
              options: 'i',
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          orderNumber: 1,
          createdAt: 1,
          provider: '$servicestations.name',
          seeker:
            '$profiles.firstName' +
            ' ' +
            '$profiles.middleName' +
            ' ' +
            '$profiles.lastName',
          amount: 1,
          serviceType: '$services.name',
          status: 1,
          providerServiceStatus: 1,
          result: 1,
        },
      },
    ]);

    const washRequestsWithQueryMatch = washRequests.filter(
      (washRequest) => washRequest.result === true,
    );

    return {
      washRequests: washRequestsWithQueryMatch,
      washRequestCount: washRequestsWithQueryMatch.length,
    };
  }

  getDateWithInitialDay(day: number) {
    const timeRange: Date = new Date();
    timeRange.setDate(timeRange.getDate() - day);
    return this.formatDate(timeRange);
  }

  formatDate(date: Date) {
    return [
      date.getFullYear(),
      this.padTo2Digits(date.getMonth() + 1),
      this.padTo2Digits(date.getDate()),
    ].join('-');
  }

  padTo2Digits(num: number) {
    return num.toString().padStart(2, '0');
  }

  async getActiveServiceCount(serviceId: string): Promise<number> {
    const count = await this.washRequestModel
      .countDocuments({
        service: serviceId,
        status: { $ne: 'completed' },
      })
      .exec();

    return count ?? 0;
  }

  getActiveServicesCountQuery() {
    return [
      {
        $lookup: {
          from: 'washrequests',
          let: {
            stationId: '$_id',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$serviceStation', '$$stationId'],
                    },
                    {
                      $ne: ['$status', 'completed'],
                    },
                  ],
                },
              },
            },
          ],
          as: 'incompleteWashRequests',
        },
      },
      {
        $addFields: {
          activeServiceCount: {
            $size: '$incompleteWashRequests',
          },
        },
      },
    ];
  }
}
