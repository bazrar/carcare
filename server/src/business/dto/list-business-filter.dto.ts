export class ListBusinessFilterDto {}
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BusinessFilterDto {
  @ApiProperty({ description: 'search query filter', required: false })
  @IsOptional()
  @IsString()
  q: string;

  @ApiProperty({ description: 'verfied business filter', required: false })
  @IsOptional()
  @IsBoolean()
  verified: boolean;
}
