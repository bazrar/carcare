import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';
export class CreateVehicleDto {
  @ApiProperty({ description: 'make of seeker vechicle' })
  @IsNotEmpty()
  make: string;

  @ApiProperty({ description: 'model of seeker vechicle' })
  @IsNotEmpty()
  model: string;

  @ApiProperty({ description: 'year of seeker vechicle' })
  @IsNotEmpty()
  year: string;

  //todo: make this array
  @IsNotEmpty()
  bodyStyles: string;

  @ApiProperty({ description: 'color of seeker vehicle' })
  @IsNotEmpty()
  color: string;

  @ApiProperty({
    description: 'image of seeker vehicle',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  vehicleImage: Express.Multer.File;
}
