import { ApiProperty } from '@nestjs/swagger';
import { IsAlpha, IsArray, IsNotEmpty, IsOptional } from 'class-validator';
import { SeekerPlaceType } from '../enums/seeker-place-type.enum';

export class CreateSeekerPlaceDto {
  @ApiProperty({ description: 'name of seeker place', example: 'liverpool' })
  @IsOptional()
  name: string;

  @IsOptional()
  address: string;

  @IsOptional()
  type: SeekerPlaceType;

  @IsNotEmpty()
  longitude: number;

  @IsNotEmpty()
  latitude: number;
}
