import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Notification } from '../schemas/notification.schema';
import { User } from 'src/user/schemas/auth.schema';

@Injectable()
export class NotificationCenterService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async add(user: User, notificationType, rawData) {
    try {
      console.log('notificiation logs before');
      console.log(JSON.stringify({ notificationType, rawData }, null, 2));
      const payload: any = this.getText(notificationType, rawData);
      console.log('notification logs after');
      console.log(JSON.stringify(payload, null, 2));
      payload.from = rawData.from;
      payload.to = rawData.to;
      payload.isSeen = false;
      console.log('Notification prms', JSON.stringify(payload, null, 2));
      const notificationCount = await this.notificationModel.count();
      payload.trackingId = (notificationCount + 1).toString().padStart(6, '0');

      await this.notificationModel.create(payload);
      return;
    } catch (error) {
      console.log(error);
    }
  }

  getText(notificationType, variables: any) {
    console.log('getText: ', JSON.stringify(variables, null, 2));
    // const placeHolderReplacer = new JsonPlaceholderReplacer();
    // placeHolderReplacer.addVariableMap(variables);
    // return placeHolderReplacer.replace(notificationType);
    console.log('Inside getText');
    console.log(JSON.stringify(notificationType, null, 2));
    const {
      brand,
      model,
      seekerName,
      status,
      washRequest,
      serviceStationName,
      providerName,
    } = variables;
    switch (notificationType) {
      case 'booking_created':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${seekerName} has requested for vehicle wash`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };
      case 'booking_accepted':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${serviceStationName} has accepted your vehicle wash`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };
      case 'booking_rejected_by_provider':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${serviceStationName} has declined your vehicle wash request`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };
      case 'booking_rejected_by_seeker':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${seekerName} has declined vehicle wash request`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };
      case 'booking_confirmed':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${seekerName} has confirmed vehicle wash request`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };

      case 'booking_assigned':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${seekerName}'s vehicle wash request has been assigned to you`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };

      case 'provider_commuting':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${serviceStationName} is commuting to pick`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };

      case 'provider_arrived':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${providerName} has reached to your location`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };

      case 'payment_completed':
        return {
          type: 'notificationCenter',
          title: `${brand} | ${model}`,
          message: `${seekerName} has completed payment for vehicle wash`,
          status: `${status}`,
          washRequest: `${washRequest}`,
          redirectLink: 'redirectLink',
        };
    }
  }
}
