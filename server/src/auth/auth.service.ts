import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import * as mongoose from 'mongoose';
import {
  BadRequestException,
  GoneException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/schemas/auth.schema';
import { LoginWithPhoneDto } from './dto/login-with-phone.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload.interface';
import { Role } from 'src/user/enums/roles.enum';
import { RedisClientService } from 'src/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { ServiceStationService } from 'src/service-station/service-station.service';
import { SmsService } from 'src/sms/sms.service';
import { Business } from 'src/business/schemas/business.schema';
import { BusinessService } from 'src/business/business.service';
import { ServiceStationRoleType } from 'src/service-station/schemas/service-station.schema';
import { DeviceTokenDto } from './dto/deviceToken.dto';

const MAX_NUMBER_OF_FAILED_LOGINS = 5; // 5 minutes
const TIME_WINDOW_FOR_FAILED_LOGINS = 60 * 10; // otp token expiry
const OTP_TOKEN_EXPIRY = 60 * 5; // 1minute
// const OTP_TOKEN_EXPIRY = 60 * 1; // 1minute
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisClientService,
    private readonly configService: ConfigService,
    private readonly serviceStationService: ServiceStationService,
    private readonly smsService: SmsService,
    private readonly businessService: BusinessService,
  ) {}

  isValidMobileNumber(mobileNumber: string) {
    return mobileNumber.substring(0, 3) === '+01' && mobileNumber.length === 12;
  }

  async saveOtpInRedis(userId, otp) {
    const redisOtpKey = this.getOtpKey(userId);
    await this.redisService.setex(redisOtpKey, otp, OTP_TOKEN_EXPIRY);
  }

  async getUserOtpCodes(userId) {
    const otpKey = this.getOtpKey(userId);
    return this.redisService.getValue(otpKey);
  }

  async loginWithPhone(loginWithPhoneDto: LoginWithPhoneDto, role: Role) {
    const providerHashKey = this.configService.get<string>('PROVIDER_HASH_KEY');
    const seekerHashKey = this.configService.get<string>('SEEKER_HASH_KEY');
    const { mobileNumber, token } = loginWithPhoneDto;
    let mNumber = mobileNumber;
    const testNumbers = [
      '9841430732', // RAKESH
      '9845295221', // SANDESH
      '9813604624', // RAKESH
      '9810099012', // RAJU
      '9815393041', // MANISHA
      '9824119274', // PRASHANT
      '9803393041', // SANDESH
      '9846856255', // PRASHANT
      '9819016975', // SAGAR,
      '9765425457', // BIKESH
    ];
    if (testNumbers.includes(mobileNumber.slice(mobileNumber.length - 10))) {
      mNumber = `1${mobileNumber.slice(mobileNumber.length - 10)}`;
    }
    console.log({ mNumber });
    let user: User;
    user = await this.userModel.findOne({
      mobileNumber: mNumber,
      role:
        role === 'provider'
          ? [Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER]
          : role,
    });
    console.log({ user });

    if (!user) {
      if (token) {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log({ decoded });
        role = decoded.role;
        if (decoded.mobileNumber !== mNumber) {
          throw new BadRequestException('Not a token related mobile number');
        }
      }
      user = await this.userModel.create({ mobileNumber: mNumber, role });
      await user.save();
    }

    if (token) {
      await this.updateInvitedUser(user, token);
    }

    const otp = this.generateOtp(6);

    // const otp =
    //   this.configService.get<string>('NODE_ENV') === 'production'
    //     ? this.generateOtp(6)
    //     : '123456';
    // after generating otp token, put token in the redis set
    await this.saveOtpInRedis(user._id, otp);

    console.log(
      `<#> Your Carwash app code is: ${otp}.\n${
        role === 'seeker' ? seekerHashKey : providerHashKey
      }`,
    );
    const result = await this.smsService.sendSms(
      mobileNumber,
      `<#> Your Carwash app code is: ${otp}.\n${
        role === 'seeker' ? seekerHashKey : providerHashKey
      }`,
    );
    console.log({ result });
    return { status: true, message: 'Successfully sent otp' };
    // push the otp to queue
  }
  // user_id:otp ===> set data structure
  // user_id:number_of_attempts  ==> string/number data structure

  async verifyOtp(verifyOtpDto: VerifyOtpDto, role: Role) {
    const { mobileNumber, otp, deviceToken } = verifyOtpDto;
    let user: User;

    const providerUser = await this.userModel.findOne({
      mobileNumber,
      role,
    });

    if (providerUser) {
      user = providerUser;
    } else {
      const managerUser = await this.userModel.findOne({
        mobileNumber,
        role: Role.MANAGER,
      });

      if (managerUser) {
        user = managerUser;
      } else {
        const teamMemberUser = await this.userModel.findOne({
          mobileNumber,
          role: Role.TEAM_MEMBER,
        });
        if (!teamMemberUser) throw new BadRequestException('Invalid OTP');

        user = teamMemberUser;
      }
    }

    const otpKey = this.getOtpKey(user._id);
    const failedLoginAttemptsKey = this.getFailedLoginAttemptKey(user._id);
    const numberOfFailedLoginAttempts = await this.redisService.getValue(
      failedLoginAttemptsKey,
    );

    if (
      Number.isInteger(numberOfFailedLoginAttempts) &&
      parseInt(numberOfFailedLoginAttempts) > MAX_NUMBER_OF_FAILED_LOGINS
    ) {
      throw new ThrottlerException(
        `Too Many Attempts try it ${
          TIME_WINDOW_FOR_FAILED_LOGINS / 60
        } minutes later`,
      );
    }

    const userOtpCodes = await this.getUserOtpCodes(user._id);

    if (!userOtpCodes) {
      console.log('Doesnt include otp codes');
      // the user has not entered the code during this time
      throw new BadRequestException('Session expired');
    }

    try {
      console.log('include otp codes', JSON.stringify(userOtpCodes, null, 2));
      if (otp.length != 6 || !userOtpCodes.includes(otp)) {
        let attempts = Number.isInteger(numberOfFailedLoginAttempts)
          ? +numberOfFailedLoginAttempts
          : 0;
        // block user for 5 minutes
        await this.redisService.setex(
          failedLoginAttemptsKey,
          ++attempts,
          TIME_WINDOW_FOR_FAILED_LOGINS,
        );
        throw new BadRequestException('Invalid OTP');
      }

      const { accessToken, refreshToken } = await this.login(user._id);

      if (deviceToken) {
        user.notificationTokens.push(deviceToken);
      }

      await user.save();
      this.redisService.del(otpKey);
      return {
        accessToken,
        refreshToken,
      };
    } catch (err) {
      console.log('err', err);
      throw new BadRequestException('Invalid OTP');
    }
  }

  async login(userId) {
    return this.getTokens(userId);
  }

  async getRefreshToken(user: User) {
    // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/#Keeping-Refresh-Tokens-Secure
    const { accessToken, refreshToken } = await this.getTokens(user._id);
    return { accessToken, refreshToken };
  }

  async getTokens(userId) {
    const accessTokenSecret = this.configService.get<string>(
      'JWT_ACCESS_TOKEN_SECRET',
    );
    const refreshTokenSecret = this.configService.get<string>(
      'JWT_REFRESH_TOKEN_SECRET',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          userId,
        },
        {
          // expiresIn: 60 * 60 * 24 * 7,
          expiresIn: 60 * 60 * 24,
          secret: 'access-token',
        },
      ),
      this.jwtService.signAsync(
        { userId },
        {
          // expiresIn: 60 * 60 * 24 * 7,
          expiresIn: 60 * 60 * 24 * 7,
          secret: 'refresh-token',
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  getOtpKey(userId: string): string {
    return `${userId}:otps`;
  }

  getFailedLoginAttemptKey(userId: string): string {
    return `${userId}:failedLoginAttempts`;
  }

  generateOtp(length = 6) {
    const digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < length; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  }

  findOneById(id: string) {
    return this.userModel.findById(id);
  }

  async createUser(mobileNumber: string, role: string) {
    const user = await this.userModel.create({
      mobileNumber,
      role,
    });
    return user;
  }

  async updateInvitedUser(user: User, token: string) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET_KEY);

      const stationId = decoded.station;
      const mobileNumber = decoded.mobileNumber;
      const role = decoded.role;

      const serviceStation =
        await this.serviceStationService.findServiceStationById(stationId);

      const team = serviceStation.team;
      const objIndex = team.findIndex(
        (obj) => obj.mobileNumber === mobileNumber,
      );
      team[objIndex].userId = user.id;

      await this.serviceStationService.updateServiceStationTeam(
        stationId,
        team,
      );

      if (role === ServiceStationRoleType.MANAGER) {
        if (serviceStation.managerDetails.mobileNumber === mobileNumber) {
          serviceStation.managerDetails.userId = user.id;
          await serviceStation.save();
        }

        const business = await this.businessService.findBusinessByParams({
          userId: serviceStation.userId,
        });

        business.managers.push(user._id);
        await business.save();
      }
    } catch (error) {
      console.log(error);
      return;
    }
  }

  async webLogin(email: string, password: string) {
    const user = await this.userModel.findOne({
      email: email,
      role: 'admin',
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordVaild = await bcrypt.compare(password, user.password);

    if (!isPasswordVaild) {
      throw new BadRequestException('Invalid password');
    }

    const { accessToken, refreshToken } = await this.login(user._id);
    return { accessToken, refreshToken };
  }

  async logout(deviceTokenDto: DeviceTokenDto) {
    const userData = await this.userModel.findOne({
      'notificationTokens.token': deviceTokenDto.deviceToken,
    });

    if (!userData) {
      throw new BadRequestException('Invalid device token');
    }
    await this.removeUserNotifToken(userData, deviceTokenDto.deviceToken);
    return { message: 'User logged out' };
  }

  async removeUserNotifToken(user: User, deviceToken: string) {
    let newNotifTokenArr: any = [];
    newNotifTokenArr = user.notificationTokens.filter(
      (token) => token.token !== deviceToken,
    );
    user.notificationTokens = newNotifTokenArr;
    await user.save();
  }
}
