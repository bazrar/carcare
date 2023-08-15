import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateServiceStationLocationDto {
  @ApiProperty({ description: 'latitude', example: 10 })
  @IsNumber()
  @IsNotEmpty()
  readonly latitude;

  @ApiProperty({ description: 'longitude', example: 20 })
  @IsNumber()
  @IsNotEmpty()
  readonly longitude;
}
