import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import * as mongoose from 'mongoose';

export class RegisterCardDto {
  @ApiProperty({ description: 'full name', example: 'Firstname Lastname' })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'card number', example: '474735734953450345' })
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({ description: 'CVC', example: '495' })
  @IsNotEmpty()
  cvc: string;

  @ApiProperty({ description: 'expiry date of', example: '02/25' })
  @IsNotEmpty()
  expiryDate: string;

  @ApiProperty({ description: 'postalCode', example: '49557' })
  @IsNotEmpty()
  postalCode: string;
}

export class MakePaymentDto {
  @ApiProperty({ description: 'amount', example: 100 })
  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;

  @ApiProperty({ description: 'tips', example: 2.32 })
  @IsNumber()
  @IsNotEmpty()
  readonly tips: number;

  @ApiProperty({ description: 'washRequestId', example: 'wuihsshfskfsd' })
  @IsString()
  @IsNotEmpty()
  readonly washRequest: string;

  @ApiProperty({ description: 'paymentMethodId', example: 'wuihsshfskfsd' })
  @IsString()
  @IsNotEmpty()
  readonly paymentMethod: string;
}

export class RegisterBankAccountDto {
  @ApiProperty({ description: 'full name', example: 'Firstname Lastname' })
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'routing number', example: '10000272373' })
  @IsNotEmpty()
  routingNumber: string;

  @ApiProperty({ description: 'account number', example: '569045272373' })
  @IsNotEmpty()
  accountNumber: string;
}

export class PayOutDto {
  @ApiProperty({ description: 'amount', example: 100 })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'providerId', example: 'efafglfddas' })
  @IsNotEmpty()
  providerId: mongoose.ObjectId;
}
