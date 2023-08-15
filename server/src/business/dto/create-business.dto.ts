import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUrl } from 'class-validator';

class Location {
  @ApiProperty({ description: 'latitude' })
  @IsNumber()
  readonly latitude;

  @ApiProperty({ description: 'longitude' })
  @IsNumber()
  readonly longitude;
}

export class CreateBusinessDto {
  @ApiProperty({ description: 'name of business' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'description of business' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'website url of business', required: false })
  @IsOptional()
  @IsUrl()
  website: string;

  @ApiProperty({ description: 'contact number of business' })
  @IsNotEmpty()
  contactNumber: string;

  @ApiProperty({ description: 'zipCode of business' })
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({
    description: 'business logo',
    type: 'string',
    format: 'binary',
    required: false,
  })
  logo: any;

  @ApiProperty({
    description: 'business type for Solo Proprietor',
    type: 'boolean',
    required: true,
    default: false,
  })
  @IsNotEmpty()
  isSoloProprietor: boolean;

  @ApiProperty({ description: 'instagram url of business', required: false })
  @IsOptional()
  @IsUrl()
  instagramUrl: string;

  @ApiProperty({
    description: '[latitude, longitude] location of business',
    example: { latitude: 10, longitude: 20 },
    type: () => Location,
  })
  @IsNotEmpty()
  location: Location;

  @ApiProperty({
    description: 'business Cover image',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  coverImage: any;
}
