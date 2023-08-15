import { Injectable } from '@nestjs/common';
import { string } from 'joi';
import { type } from 'os';

import { AuthService } from 'src/auth/auth.service';
import { BusinessService } from 'src/business/business.service';
import { PaymentService } from 'src/payment/payment.service';
import { UserService } from 'src/user/user.service';
import { WashRequestService } from 'src/wash-request/wash-request.service';
import { QueryType } from './dto/search.dto';

@Injectable()
export class AdminPanelService {
  constructor(
    private readonly authService: AuthService,
    private readonly washRequestService: WashRequestService,
    private readonly businessService: BusinessService,
    private readonly paymentService: PaymentService,
    private readonly userService: UserService,
  ) {}

  async webLogin(email: string, password: string) {
    return await this.authService.webLogin(email, password);
  }

  async getDashBoardData() {
    return await this.paymentService.getDashBoardData();
  }

  async getGraphData() {
    return await this.washRequestService.getGraphData();
  }

  async getWashRequests(
    page: string,
    limit: string,
    sortKey: string,
    sortType: string,
  ) {
    const washRequests = await this.washRequestService.getWashRequests(
      page,
      limit,
      sortKey,
      sortType,
    );
    return washRequests;
  }

  async getSeekers(
    page: string,
    limit: string,
    sortKey: string,
    sortType: string,
  ) {
    const seekers = await this.userService.getSeekers(
      page,
      limit,
      sortKey,
      sortType,
    );
    return seekers;
  }

  async getSeekerDetail(seekerId: string) {
    const seekerDetail = await this.userService.getSeekerDetail(seekerId);
    return seekerDetail;
  }

  async getProviders(
    page: string,
    limit: string,
    sortKey: string,
    sortType: string,
  ) {
    const providers = await this.businessService.getProviders(
      page,
      limit,
      sortKey,
      sortType,
    );
    return providers;
  }

  async getProviderDetail(providerId: string) {
    const providerDetail = await this.businessService.getProviderDetail(
      providerId,
    );
    return providerDetail;
  }

  async verifyProvider(providerId: string, verified: string) {
    await this.businessService.verifyProvider(providerId, verified);
    return { message: 'Success' };
  }

  async getServiceStations(businessId: string) {
    const serviceStations = await this.businessService.getServiceStations(businessId);
    return serviceStations;
  }

  async getTotalEarnings(businessId: string) {
    const totalEarnings = await this.businessService.getTotalEarnings(businessId);
    return totalEarnings;
  }

  async handleSearch(queryString: string, queryType: string) {
    console.log({ queryString, queryType });

    let responseData: any = {};
    switch (queryType) {
      case QueryType.Seeker: {
        responseData = await this.userService.searchSeekers(queryString);
        break;
      }
      case QueryType.Provider: {
        responseData = await this.businessService.searchProviders(queryString);
        break;
      }
      case QueryType.WashRequest: {
        responseData = await this.washRequestService.searchWashRequests(
          queryString,
        );
        break;
      }
    }
    return responseData;
  }
}
