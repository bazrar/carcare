import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DynamicLinkService {
  dynamicLinkAPIKey: string;
  fetchDynamicLinkURL: string;
  firebaseDomainURIPrefix: string;
  redirectURL: string;
  androidPackageName: string;
  iosBundleId: string;
  constructor(private configService: ConfigService) {
    this.dynamicLinkAPIKey = this.configService.get<string>(
      'DYNAMIC_LINK_API_KEY',
    );
    this.fetchDynamicLinkURL = this.configService.get<string>(
      'FETCH_DYNAMIC_LINK_URL',
    );
    this.firebaseDomainURIPrefix = this.configService.get<string>(
      'FIREBASE_DOMAIN_URI_PREFIX',
    );
    this.redirectURL = this.configService.get<string>('REDIRECT_URL');
    this.androidPackageName = this.configService.get<string>(
      'ANDROID_PACKAGE_NAME',
    );
    this.iosBundleId = this.configService.get<string>('IOS_BUNDLE_ID');
  }

  async getDynamicLink(token: string) {
    try {
      const payload: any = {
        dynamicLinkInfo: {
          domainUriPrefix: this.firebaseDomainURIPrefix,
          link: `${this.redirectURL}` + '?token=' + `${token}`, //redirect URL
          androidInfo: {
            androidPackageName: this.androidPackageName,
          },
          iosInfo: {
            iosBundleId: this.iosBundleId,
          },
        },
      };

      const dynamicLink = await axios.post(
        `${this.fetchDynamicLinkURL}` + '?key=' + `${this.dynamicLinkAPIKey}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      return { dynamicLink: dynamicLink.data.shortLink };
    } catch (error) {
      console.log(error);
      return {
        error: error.response.data,
      };
    }
  }
}
