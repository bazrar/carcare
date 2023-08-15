import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { ProfileService } from 'src/profile/profile.service';
import { Profile } from 'src/profile/schemas/profile.schema';
import { User } from 'src/user/schemas/auth.schema';
import { Payment } from './schemas/payment.schema';
import { Stripe } from 'stripe';
import {
  MakePaymentDto,
  RegisterCardDto,
  RegisterBankAccountDto,
  PayOutDto,
} from './dto/payment.dto';

import { ServiceStationService } from 'src/service-station/service-station.service';
import { UserService } from 'src/user/user.service';
import { WashRequestService } from 'src/wash-request/wash-request.service';
import { WashRequest } from 'src/wash-request/schemas/wash-request.schema';
import {
  ProviderServiceStatus,
  WashRequestStatus,
} from '../wash-request/enums/wash-request-status.enum';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<Payment>,
    private readonly profileService: ProfileService,
    private readonly serviceStationService: ServiceStationService,
    private readonly userService: UserService,
    private readonly washRequestService: WashRequestService,
  ) {}

  async registerCard(
    userId: mongoose.ObjectId,
    registerCardDto: RegisterCardDto,
  ): Promise<void> {
    try {
      const { fullName, cardNumber, cvc, expiryDate, postalCode } =
        registerCardDto;
      const userProfile: Profile = await this.profileService.getProfileByUserId(
        userId,
      );
      if (!userProfile.paymentDetails?.customerId) {
        const customer = await stripe.customers.create({
          name: fullName,
          email: userProfile.email,
        });
        userProfile.paymentDetails = {
          customerId: customer.id,
        };
      }

      const card = {
        number: cardNumber,
        exp_month: parseInt(expiryDate.split('/')[0]),
        exp_year: parseInt('20' + expiryDate.split('/')[1]),
        cvc: cvc,
      };

      const createPaymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card:
          process.env.NODE_ENV === 'production'
            ? card
            : {
                token: 'tok_visa',
              },
      });

      await stripe.paymentMethods.attach(createPaymentMethod.id, {
        customer: userProfile.paymentDetails.customerId,
      });
      userProfile.paymentDetails.paymentMethods.push({
        id: createPaymentMethod.id,
        fullName,
        expiryDate,
        postalCode,
      });
      await userProfile.save();
      return;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async getCardDetails(user: User) {
    const userProfile: Profile = await this.profileService.getUserProfile(user);
    if (!userProfile.paymentDetails) {
      return [];
    }
    const paymentMethodDetails: any = await stripe.customers.listPaymentMethods(
      userProfile.paymentDetails.customerId,
      {
        type: 'card',
      },
    );

    const cardDetails = paymentMethodDetails.data;

    const cardsInfo = [];

    if (cardDetails.length) {
      cardDetails.forEach((cardDetail) => {
        const item: any = { ...cardDetail.card };
        const paymentMethodDetails =
          userProfile.paymentDetails.paymentMethods.filter(
            (x) => x.id === cardDetail.id,
          );
        const { id, fullName, postalCode } = paymentMethodDetails[0];
        const card = {
          brand: item.brand,
          expiryMonth: item.exp_month,
          expiryYear:
            `${item.exp_year}` && `${item.exp_year}`.length > 2
              ? `${item.exp_year}`.slice(-2)
              : '',
          last4: item.last4,
          paymentMethod: id,
          fullName,
          postalCode,
        };
        cardsInfo.push(card);
      });
    }

    return cardsInfo;
  }

  async makePayment(
    userId: mongoose.ObjectId,
    makePaymentDto: MakePaymentDto,
  ): Promise<any> {
    try {
      const { amount, tips, paymentMethod, washRequest } = makePaymentDto;
      const amountWithValidDecimal = parseFloat(Math.abs(amount).toFixed(2));
      const tipsWithValidDecimal = parseFloat(Math.abs(tips).toFixed(2));

      const userProfile: Profile = await this.profileService.getProfileByUserId(
        userId,
      );
      const washRequestDetails: WashRequest =
        await this.washRequestService.findWashRequestByParams({
          _id: washRequest,
        });
      const serviceStation =
        await this.serviceStationService.findServiceStationByParams({
          _id: washRequestDetails.serviceStation,
        });

      const totalAmount = amountWithValidDecimal + tipsWithValidDecimal;
      const paymentAmount = Math.trunc(totalAmount * 100);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentAmount,
        currency: 'usd',
        payment_method: paymentMethod,
        customer: userProfile.paymentDetails.customerId,
        off_session: true,
        confirm: true,
        metadata: {
          washRequest,
        },
      });

      if (
        paymentIntent.status === 'succeeded' ||
        paymentIntent.status === 'processing'
      ) {
        const payment = await this.paymentModel.create({
          washRequest,
          amount: totalAmount,
          currency: 'usd',
          paymentMethod,
          user: userId,
          payOutCompleted: false,
        });
        washRequestDetails.tips = tipsWithValidDecimal;
        washRequestDetails.providerServiceStatus =
          ProviderServiceStatus.PAYMENT_RECEIVED;
        await washRequestDetails.save();
        console.log('date logger');
        console.log(JSON.stringify(paymentIntent, null, 2));
        console.log(paymentIntent.created);

        await this.washRequestService.notifyWashRequest(washRequestDetails);
        await this.washRequestService.notifyPaymentCompletion(
          userId,
          washRequest,
        );

        return {
          message: 'Payment successful',
          receiptURL: paymentIntent.charges.data[0].receipt_url,
          amount: amountWithValidDecimal,
          tips: tipsWithValidDecimal,
          currency: paymentIntent.currency,
          transactionDate: paymentIntent.created
            ? new Date(paymentIntent.created).toLocaleDateString()
            : new Date().toLocaleTimeString(),
          paidTo: serviceStation.name,
        };
      }
      return {
        message: 'Error in completing payment',
        error: paymentIntent.status,
      };
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async registerBankAccount(
    userId: mongoose.ObjectId,
    registerBankAccountDto: RegisterBankAccountDto,
  ) {
    try {
      const { fullName, routingNumber, accountNumber } = registerBankAccountDto;
      const userProfile: Profile = await this.profileService.getProfileByUserId(
        userId,
      );
      if (!userProfile.paymentDetails) {
        const customer = await stripe.customers.create({
          name: fullName,
          email: userProfile.email,
        });
        userProfile.paymentDetails = {
          customerId: customer.id,
        };
      }
      const token = await stripe.tokens.create({
        bank_account: {
          country: 'US',
          currency: 'usd',
          account_holder_name: fullName,
          account_holder_type: 'individual',
          routing_number: routingNumber,
          account_number: accountNumber,
        },
      });

      const bankAccount = await stripe.customers.createSource(
        userProfile.paymentDetails.customerId,
        { source: token.id },
      );
      userProfile.paymentDetails.bankAccount = bankAccount.id;
      await userProfile.save();
      return 'Success';
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async payOut(payoutDto: PayOutDto) {
    try {
      const { amount, providerId } = payoutDto;
      const providerProfile: Profile =
        await this.profileService.getProfileByUserId(providerId);
      if (!providerProfile) {
        throw new BadRequestException('Profile not setup yet');
      }
      const payOuts = await stripe.payouts.create({
        amount,
        currency: 'usd',
        destination: providerProfile.paymentDetails.bankAccount,
        method: 'standard',
      });
      console.log({ payOuts });
      return 'Payment Processing';
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async getDashBoardData() {
    const params = {};
    const [userData, paymentData, washRequestData] = await Promise.all([
      this.userService.getAllUsers(params),
      this.paymentModel.find(params),
      this.washRequestService.getAllWashRequests(params),
    ]);

    let oldProviders = 0;
    let newProviders = 0;
    let oldSeekers = 0;
    let newSeekers = 0;
    let newPaymentData = 0;
    let oldPaymentData = 0;
    let oldMonthRevenue = 0;
    let acceptedWashRequests = 0;
    let cancelledWashRequests = 0;
    let unAnsweredWashRequests = 0;

    const date = new Date();
    const firstDayCurrentMonth = this.getFirstDayOfMonth(date);
    const firstDayPreviousMonth = this.getFirstDayOfPrevMonth(date);

    userData.map((user: any) => {
      if (user.role === 'provider') {
        if (user.createdAt >= firstDayCurrentMonth) {
          newProviders++;
        } else {
          oldProviders++;
        }
      } else if (user.role === 'seeker') {
        if (user.createdAt >= firstDayCurrentMonth) {
          newSeekers++;
        } else {
          oldSeekers++;
        }
      }
    });

    paymentData.map((payment: any) => {
      if (payment.createdAt >= firstDayCurrentMonth) {
        newPaymentData += payment.amount;
      } else {
        oldPaymentData += payment.amount;

        if (payment.createdAt >= firstDayPreviousMonth) {
          oldMonthRevenue += payment.amount;
        }
      }
    });

    washRequestData.map((washRequest: any) => {
      if (
        washRequest.status ===
        (WashRequestStatus.SEEKER_REJECTED ||
          WashRequestStatus.PROVIDER_REJECTED)
      ) {
        cancelledWashRequests++;
      } else if (washRequest.status === WashRequestStatus.PENDING) {
        unAnsweredWashRequests++;
      } else {
        acceptedWashRequests++;
      }
    });

    const totalProviders = newProviders + oldProviders;
    const totalSeekers = newSeekers + oldSeekers;
    const totalPayments = newPaymentData + oldPaymentData;

    const dashboardData = {
      cardData: {
        providers: {
          newCount: totalProviders,
          previousCount: oldProviders,
          change: this.diffPercent(totalProviders, oldProviders),
        },
        seekers: {
          newCount: totalSeekers,
          previousCount: oldSeekers,
          change: this.diffPercent(totalSeekers, oldSeekers),
        },
        transactions: {
          newCount: totalPayments,
          previousCount: oldPaymentData,
          change: this.diffPercent(totalPayments, oldPaymentData),
        },
        revenue: {
          newCount: newPaymentData,
          previousCount: oldMonthRevenue,
          change: this.diffPercent(newPaymentData, oldMonthRevenue),
        },
      },
      pieChartData: {
        requestStatus: {
          serviceAccepted: acceptedWashRequests,
          serviceCancelled: cancelledWashRequests,
          unansweredRequests: unAnsweredWashRequests,
        },
      },
    };

    return { dashboardData };
  }

  getFirstDayOfMonth(date: Date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1);
  }

  getFirstDayOfPrevMonth(date: Date) {
    date.setDate(0); //sets date to the last day of the previous month
    date.setDate(1); //sets date to the first day of that month
    date.setHours(0, 0, 0, 0); //sets date time to midnight
    return date;
  }

  diffPercent(a, b) {
    if (a && b) {
      return (a < b ? '-' + ((b - a) * 100) / a : ((a - b) * 100) / b) + '%';
    }

    return 0 + '%';
  }

  async detachCard(userId: mongoose.ObjectId, paymentMethodId: string) {
    try {
      const userProfile: Profile = await this.profileService.getProfileByUserId(
        userId,
      );

      const paymentMethods = userProfile.paymentDetails?.paymentMethods;
      if (!paymentMethods?.length) {
        throw new NotFoundException('Payment method not found for the card');
      }

      const foundPaymentMethod = paymentMethods.find(
        (paymentMethod) => paymentMethod.id === paymentMethodId,
      );
      if (!foundPaymentMethod) {
        throw new NotFoundException('Payment method not found for the card');
      }

      const detachedPayment = await stripe.paymentMethods.detach(
        paymentMethodId,
      );

      userProfile.paymentDetails.paymentMethods = paymentMethods.filter(
        (paymentMethod) => paymentMethod.id !== paymentMethodId,
      ) as [
        {
          id: string;
          fullName: string;
          postalCode: string;
          expiryDate: string;
        },
      ];

      await userProfile.save();
      const item: any = detachedPayment.card;

      return {
        brand: item.brand,
        expiryMonth: item.exp_month,
        expiryYear:
          `${item.exp_year}` && `${item.exp_year}`.length > 2
            ? `${item.exp_year}`.slice(-2)
            : '',
        last4: item.last4,
        paymentMethod: detachedPayment.id,
        fullName: foundPaymentMethod.fullName,
        postalCode: foundPaymentMethod.postalCode,
      };
    } catch (error) {
      throw error;
    }
  }
}
