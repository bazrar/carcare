import { Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import { JsonPlaceholderReplacer } from 'json-placeholder-replacer';
import { DeviceToken, User } from 'src/user/schemas/auth.schema';

import * as serviceAccount from './mobilecarcare-dev-firebase-adminsdk-6f08z-f6bc3643c9.json';

@Injectable()
export class PushNotificationService {
  private admin: any;
  constructor() {
    const configuration = this.getFirebaseConfiguration();
    this.admin = firebase.initializeApp(configuration);
  }

  async send(user: User, notificationType: any, rawData: any) {
    console.log('sendPushNotification******', notificationType, rawData);
    const payload: any = this.getText(notificationType, rawData);
    const { type, status, ...data } = payload;
    const notification = {
      title: data.title,
      body: data.message,
      sound: 'default',
    };
    console.log('Debugging firebase status');
    console.log(payload);
    console.log(status);
    data.type = status;
    const tokens = this.getUserTokens(user);
    await this.sendToDevices(tokens, { data, notification });
  }

  getFirebaseConfiguration() {
    const firebaseCredentials = JSON.parse(JSON.stringify(serviceAccount));
    const databaseURL = process.env.DATABASE_URL;
    return {
      credential: firebase.credential.cert(firebaseCredentials),
      databaseURL,
    };
  }

  getUserTokens(user: User): [DeviceToken] | any[] {
    const notificationTokens = user.notificationTokens.length
      ? user.notificationTokens
      : [];
    return notificationTokens;
  }

  async sendToDevices(
    tokens: [DeviceToken] | any[],
    payload: firebase.messaging.MessagingPayload,
  ): Promise<void> {
    if (tokens && tokens.length > 0) {
      try {
        await Promise.all(
          tokens.map(async (token) => {
            const response = await this.admin
              .messaging()
              .sendToDevice(token.token, payload);
            console.log(
              `Notification sent to ${token} -> ${JSON.stringify(response)}`,
            );
            if (response.failureCount !== 0) {
              console.warn(
                `An error occured while sending to token ${token} -> ${JSON.stringify(
                  response,
                )}`,
              );
            }
            return;
          }),
        );
        return;
      } catch (error) {
        console.log(error);
      }
    }
  }

  getText(notificationType, variables: any) {
    const {
      seekerName,
      washRequest,
      status,
      serviceStationName,
      providerName,
    } = variables;
    switch (notificationType) {
      case 'booking_created':
        return {
          type: 'push',
          title: 'New wash request',
          message: `${seekerName} has requested for vehicle wash`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      case 'booking_accepted':
        return {
          type: 'push',
          title: 'Wash request accepted',
          message: `${serviceStationName} has accepted your vehicle wash`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      case 'booking_rejected_by_provider':
        return {
          type: 'push',
          title: 'Wash request rejected',
          message: `${serviceStationName} has declined your vehicle wash request`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      case 'booking_rejected_by_seeker':
        return {
          type: 'push',
          title: 'Wash request rejected',
          message: `${seekerName} has declined vehicle wash request`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      case 'booking_confirmed':
        return {
          type: 'push',
          title: 'Wash request confirmed',
          message: `${seekerName} has confirmed vehicle wash request`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };

      case 'booking_assigned':
        return {
          type: 'push',
          title: 'Wash request assigned',
          message: `${seekerName}'s vehicle wash request has been assigned to you`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };

      case 'booking_completed':
        return {
          type: 'push',
          title: 'Wash request completed',
          message:
            'Wash request for ${date} at ${location} has completed. Please add review',
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      case 'provider_commuting':
        return {
          type: 'push',
          title: 'Provider commuting',
          message: `${serviceStationName} is commuting to pick`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      case 'provider_arrived':
        return {
          type: 'push',
          title: 'Provider arrived',
          message: `${providerName} has reached to your location`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      case 'service_completed':
        return {
          type: 'push',
          title: 'Service completed',
          message: `${providerName} has completed your service`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      case 'payment_completed':
        return {
          type: 'push',
          title: 'Payment completed',
          message: `${seekerName} has completed payment for vehicle wash`,
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
      default:
        return {
          type: 'push',
          title: 'Not defined status',
          message: 'Not defined status',
          washRequest: `${washRequest}`,
          status: `${status}`,
        };
    }
    // const placeHolderReplacer = new JsonPlaceholderReplacer();
    // placeHolderReplacer.addVariableMap(variables);
    // return placeHolderReplacer.replace(notificationType);
  }
}
