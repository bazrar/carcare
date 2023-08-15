import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsEnum,
} from 'class-validator';
import { boolean } from 'joi';
import { ProviderServiceStatus } from '../enums/wash-request-status.enum';

export class WashRequestDto {
  @ApiProperty({ description: 'Service station', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  readonly vehicleId: string;

  @ApiProperty({ description: 'seeker place id', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  readonly placeId: string;

  @ApiProperty({ description: 'paymentMethod', example: 'py-dehdhdhdh' })
  @IsString()
  @IsNotEmpty()
  readonly paymentMethod: string;
}

class availabilityStatusDto {
  @ApiProperty({ description: 'availableNow', example: false })
  availableNow: boolean;

  @ApiProperty({ description: 'availableAfter', example: Date() })
  @IsOptional()
  availableAfter: Date;
}
export class AcceptWashRequestDto {
  @ApiProperty({ description: 'amount', example: 100 })
  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;

  @ApiProperty()
  @IsObject()
  @IsNotEmpty()
  readonly availabilityStatus: availabilityStatusDto;

  @ApiProperty({
    example: '30',
    description: 'time to complete the wash request',
  })
  @IsNumber()
  @IsNotEmpty()
  readonly approximateTimeToComplete: number;
}

export class UpdateProviderStatusDto {
  @IsEnum(ProviderServiceStatus)
  @ApiProperty({ description: 'status', example: 'provided' })
  readonly status: ProviderServiceStatus;
}

export class VerifyTokenDto {
  @IsString()
  @ApiProperty({ description: 'token', example: 'sfesfefe' })
  readonly token: string;
}

export class AddFeedbackDto {
  @ApiProperty({ description: 'rating', example: 3 })
  @IsNumber()
  @IsNotEmpty()
  readonly rating: number;

  @ApiProperty({ description: 'reviewreason', example: ' [uuid]' })
  @IsNotEmpty()
  readonly reviewReason: string[];

  @ApiProperty({
    description: 'feedback',
    example: 'feedback to seeker/business',
  })
  @IsString()
  readonly feedback: string;
}

export class MemberDto {
  @ApiProperty({ description: 'memberId', example: 'fsadakapssadu' })
  @IsNotEmpty()
  readonly member: string;
}
