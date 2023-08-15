import {
  UseGuards,
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
} from '@nestjs/common';
import { GetUser } from 'src/auth/get-user.decorator';
import { JwtAccessTokenGuard } from 'src/auth/guards/jwt-access-token.guard';
import { Roles } from 'src/role/decorators/role.decorator';
import { Role } from 'src/user/enums/roles.enum';
import { User } from 'src/user/schemas/auth.schema';
import { PaymentService } from './payment.service';
import { ApiBearerAuth, ApiForbiddenResponse, ApiTags } from '@nestjs/swagger';
import { RoleGuard } from 'src/role/guards/role.guard';
import {
  MakePaymentDto,
  RegisterCardDto,
  RegisterBankAccountDto,
  PayOutDto,
} from './dto/payment.dto';

@ApiTags('Payment')
@ApiBearerAuth('access-token')
@Controller('api')
@UseGuards(JwtAccessTokenGuard, RoleGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Post('registerCard')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  async registerCard(
    @Body() registerCardDto: RegisterCardDto,
    @GetUser() user: User,
  ) {
    return await this.paymentService.registerCard(user._id, registerCardDto);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Get('getCardDetails')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  async getCardDetails(@GetUser() user: User) {
    return await this.paymentService.getCardDetails(user);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Post('makePayment')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  async makePayment(
    @Body() makePaymentDto: MakePaymentDto,
    @GetUser() user: User,
  ) {
    return await this.paymentService.makePayment(user._id, makePaymentDto);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Post('registerBankAcc')
  @ApiBearerAuth('access-token')
  @Roles(Role.PROVIDER)
  async registerBankAccount(
    @Body() registerBankAccountDto: RegisterBankAccountDto,
    @GetUser() user: User,
  ) {
    return await this.paymentService.registerBankAccount(
      user._id,
      registerBankAccountDto,
    );
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Post('payout')
  @Roles(Role.SEEKER)
  async payOut(@Body() payOutDto: PayOutDto) {
    return await this.paymentService.payOut(payOutDto);
  }

  @ApiForbiddenResponse({ description: 'Unauthorized' })
  @Delete('detachCard/:paymentMethodId')
  @ApiBearerAuth('access-token')
  @Roles(Role.SEEKER)
  async detachCard(
    @GetUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    return await this.paymentService.detachCard(user._id, paymentMethodId);
  }
}
