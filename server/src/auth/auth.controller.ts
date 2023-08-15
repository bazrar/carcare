import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginWithPhoneDto, TokenDto } from './dto/login-with-phone.dto';
import { DeviceTokenDto } from './dto/deviceToken.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { GetUser } from './get-user.decorator';
import { User } from '../user/schemas/auth.schema';
import { JwtAccessTokenGuard } from './guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { Role } from 'src/user/enums/roles.enum';
import { RoleGuard } from 'src/role/guards/role.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtRefreshTokenGuard } from './guards/jwt-refresh-token.guard';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/provider/login-with-phone')
  loginWithPhone(@Body() loginWithPhoneDto: LoginWithPhoneDto) {
    console.log('loginWithPhone', JSON.stringify(loginWithPhoneDto, null, 2));
    return this.authService.loginWithPhone(loginWithPhoneDto, Role.PROVIDER);
  }

  @Post('/seeker/login-with-phone')
  loginSeeker(@Body() loginWithPhone: LoginWithPhoneDto) {
    return this.authService.loginWithPhone(loginWithPhone, Role.SEEKER);
  }

  @Post('/provider/verify_otp')
  verfiyProviderOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto, Role.PROVIDER);
  }

  // @Post('/manager/verify_otp')
  // verfiyManagerOtp(@Body() verifyOtpDto: VerifyOtpDto) {
  //   return this.authService.verifyOtp(verifyOtpDto, Role.MANAGER);
  // }

  @Post('/seeker/verify_otp')
  verifySeekerOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto, Role.SEEKER);
  }

  @UseGuards(JwtRefreshTokenGuard)
  @ApiBearerAuth('refresh-token')
  @Get('refresh')
  getRefreshToken(@GetUser() user: User) {
    return this.authService.getRefreshToken(user);
  }

  @Get('/me')
  @UseGuards(JwtAccessTokenGuard, RoleGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER, Role.PROVIDER, Role.MANAGER, Role.TEAM_MEMBER)
  me(@GetUser() user: User) {
    return user;
  }

  @Post('/logout')
  @ApiBearerAuth('access-token')
  async logout(@Body() deviceTokenDto: DeviceTokenDto) {
    return this.authService.logout(deviceTokenDto);
  }

  // @Get('/verifyToken')
  // verifyToken(@Query() tokenDto: TokenDto) {
  //   const token = tokenDto.token;
  //   return this.authService.loginWithPhone(
  //     {
  //       mobileNumber: '1234554321',
  //       token,
  //     },
  //     Role.PROVIDER,
  //   );
  // }
}
