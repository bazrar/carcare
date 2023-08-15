import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Cron } from '@nestjs/schedule';

import { Notification } from './schemas/notification.schema';

import { UserService } from 'src/user/user.service';

import * as NotificationTypes from './methods/NOTIFICATION.json';

import { NotificationCenterService } from './methods/addOnNotificationCenter';
import { PushNotificationService } from './methods/sendPushNotification';
import { LimitDto } from 'src/feedback/dto/feedback.dto';
import { WashRequest } from '../wash-request/schemas/wash-request.schema';
import { WashRequestService } from '../wash-request/wash-request.service';
import { ServiceStationService } from '../service-station/service-station.service';
import { UserVehicleService } from '../user-vehicle/user-vehicle.service';
import { CarMetadataService } from '../car-metadata/car-metadata.service';
import { ProfileService } from '../profile/profile.service';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: mongoose.Model<Notification>,
    private readonly userService: UserService,
    private readonly notificationCenterService: NotificationCenterService,
    private readonly profileService: ProfileService,
    private readonly pushNotificationService: PushNotificationService,
    @Inject(forwardRef(() => WashRequestService))
    private readonly washRequestService: WashRequestService,
    @Inject(forwardRef(() => ServiceStationService))
    private readonly serviceStationService: ServiceStationService,
    private readonly vehicleService: UserVehicleService,
    private readonly carMetaDataService: CarMetadataService,
    private readonly s3Service: S3Service,
  ) {}

  async sendNotifications(type: string, rawData: any) {
    const notificationTypes: any = NotificationTypes[type];
    const user = await this.userService.findUserById(rawData.to);
    for (const notificationType of notificationTypes) {
      if (notificationType.type === 'notificationCenter') {
        await this.notificationCenterService.add(
          user,
          type,
          { ...rawData }, // create new object
        );
      }
      if (notificationType.type === 'push') {
        await this.pushNotificationService.send(
          user,
          type,
          { ...rawData }, // create new object
        );
      }
    }

    return;
  }

  async getNotifications(userId: mongoose.ObjectId, limitDto: LimitDto) {
    const queryLimit = parseInt(limitDto.limit) || 10;
    const notifications = await this.notificationModel
      .find({ to: userId })
      .populate({
        path: 'washRequest',
        select: 'id business',
        populate: {
          path: 'business',
          select: 'logo',
        },
      })
      .limit(queryLimit)
      .sort({ createdAt: -1 });

    const promises = notifications.map(async (notification) => {
      const businessLogo = notification?.washRequest?.business?.logo;
      let businessLogoImage: null | string = null;
      if (businessLogo) {
        businessLogoImage = await this.s3Service.getSignedUrl(businessLogo);
      }

      return {
        ...notification.toJSON(),
        washRequest: notification?.washRequest?._id,
        businessLogoImage,
      };
    });

    const _notifications = await Promise.all(promises);

    return _notifications;
  }

  async getUnReadNotificationsCount(userId: mongoose.ObjectId) {
    const unReadNotificationsCount = await this.notificationModel.count({
      to: userId,
      isSeen: false,
    });
    return { unReadNotificationsCount };
  }

  async markNotificationAsSeen(notificationId: string) {
    const notification = await this.notificationModel.findOne({
      _id: notificationId,
    });

    notification.isSeen = true;
    await notification.save();

    return { message: 'Success' };
  }

  @Cron('* 5 * * * *')
  async updateProvider() {
    try {
      this.logger.debug('Called when the current second is 45');
      // get all
      const washRequests =
        await this.washRequestService.getAllFutureAvailableWashRequests();
      for (const washRequest of washRequests) {
        const serviceStation =
          await this.serviceStationService.findServiceStationByParams({
            _id: washRequest.serviceStation,
          });
        const seekerVehicle = await this.vehicleService.findUserVehicleByParams(
          {
            userId: washRequest.userId,
            _id: washRequest.vehicle,
          },
        );

        const vehicleMetaData =
          await this.carMetaDataService.findCarMetadataByAttribues({
            _id: seekerVehicle.carMetadataId,
          });
        // get seeker profile
        const seekerProfile = await this.profileService.getProfileByUserId(
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          washRequest.userId,
        );

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
        await this.notifyBookingConfirmation(
          bookingConfirmedNotificationToSeeker,
        );
        await this.notifyBookingConfirmation(
          bookinConfirmedNotificationToProvider,
        );
      }
    } catch (error) {
      console.log({ error });
      console.log({ errorStack: error.stack });
    }
  }

  async notifyBookingConfirmation(params = {}) {
    await this.sendNotifications('booking_confirmed', params);
  }
}
