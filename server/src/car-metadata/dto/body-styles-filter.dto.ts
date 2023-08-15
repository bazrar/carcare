import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BodyStylesFilterDto {
  @ApiProperty({ description: 'search query string', example: 'il' })
  @IsString()
  readonly q: string;

  @ApiProperty({ description: 'Brand of vechicle', example: 'Acura' })
  @IsString()
  @IsNotEmpty()
  readonly make: string;

  @ApiProperty({ description: 'Model of vechicle', example: 'ILX' })
  @IsString()
  @IsNotEmpty()
  readonly model: string;
}
