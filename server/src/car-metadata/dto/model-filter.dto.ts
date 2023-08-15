import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ModelFilterDto {
  @ApiProperty({ description: 'search query string', example: 'ix' })
  @IsString()
  readonly q: string;

  @ApiProperty({ description: 'Brand of vechicle', example: 'Acura' })
  @IsString()
  @IsNotEmpty()
  readonly make: string;
}
