import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BrandFilterDto {
  @ApiProperty({ description: 'search query string', example: 'Acura' })
  @IsString()
  readonly q: string;
}
