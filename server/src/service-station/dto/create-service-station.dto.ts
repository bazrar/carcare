import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import {
  ServiceStationManagerType,
  ServiceStationRoleType,
  ServiceStationTypeEnum,
} from '../schemas/service-station.schema';
class Location {
  @ApiProperty({ description: 'latitude' })
  @IsNumber()
  readonly latitude;

  @ApiProperty({ description: 'longitude' })
  @IsNumber()
  readonly longitude;
}

class Team {
  @ApiProperty({ description: 'mobileNumber' })
  @IsString()
  readonly mobileNumber: string;

  @ApiProperty({ description: 'name' })
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: 'role',
    example: ServiceStationRoleType.TEAM_MEMBER,
  })
  @IsString()
  readonly role: ServiceStationRoleType;

  @ApiProperty({
    description: 'userId',
    example: 'safudhaskuyfgasdfvaskyd',
  })
  userId?: string;

  @ApiProperty({
    description: 'enableLocationTracking',
    example: true,
  })
  @IsOptional()
  enableLocationTracking?: boolean;
}

export class ServiceHoursDto {
  @ApiProperty({
    description: 'openingTime',
    example: '10:00',
  })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Invalid time format. Please use HH:MM format',
  })
  openingTime: string;

  @ApiProperty({
    description: 'closingTime',
    example: '20:00',
  })
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Invalid time format. Please use HH:MM format',
  })
  closingTime: string;
}

export class CreateServiceStationDto {
  @ApiProperty({
    description: 'service station name',
    example: 'Service station name',
  })
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @ApiProperty({
    description: 'service station manager type',
    example: ServiceStationManagerType.SELF,
  })
  @IsOptional()
  @IsString()
  serviceStationManagerType: ServiceStationManagerType;

  @ApiProperty({
    description: 'service station manager type',
    example: 10,
  })
  @IsNumber()
  bookingCapacity: number;

  @ApiProperty({
    description: 'service station type',
    example: ServiceStationTypeEnum.MOBILE,
  })
  @IsString()
  readonly serviceStationType: ServiceStationTypeEnum;

  @ApiProperty({
    description: 'available with miles',
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  readonly availableWithin: number;

  @ApiProperty({
    description: '[latitude, longitude] location of service station',
    example: { latitude: 10, longitude: 20 },
    type: () => Location,
  })
  @IsNotEmpty()
  readonly location: Location;

  @ApiProperty({
    description: 'has pick and drop facility',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly pickAndDrop: boolean;

  @ApiProperty({
    description: 'user phoneNumber, name and roles',
    example: [
      {
        mobileNumber: '1234567890',
        role: 'manager',
        name: 'name',
        userId: 'dfjdsfasjfdgajsjdla',
        enableLocationTracking: false,
      },
    ],
  })
  @IsArray()
  readonly team: [Team];

  @ApiProperty({
    description: 'to enable location location tracking for a team member',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  readonly isLocationTrackingEnabled: boolean;

  @ApiProperty({
    example: { openingTime: '9:00', closingTime: '18:00' },
    type: ServiceHoursDto,
    required: false,
    default: null,
  })
  @IsOptional()
  readonly serviceHours: ServiceHoursDto;
}
