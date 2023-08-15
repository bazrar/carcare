import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class SearchServiceStationDto {
  @ApiProperty({
    description: 'Latitude',
  })
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({
    description: 'Longitude',
  })
  @IsNotEmpty()
  longitude: number;

  @ApiProperty({
    description: 'Price greater than',
    required: false,
  })
  @IsOptional()
  price__gt?: number;

  @ApiProperty({
    description: 'Price less than',
    required: false,
  })
  @IsOptional()
  price__lt?: number;

  @IsOptional()
  sortBy?: string;
}
