import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterDto {
  @ApiProperty({ description: 'page number filter', required: true })
  @IsString()
  page: string;

  @ApiProperty({ description: 'limit filter', required: true })
  @IsString()
  limit: string;

  @ApiProperty({ description: 'filter key' })
  @IsOptional()
  sortKey: string;

  @ApiProperty({ description: 'filter type asc | desc' })
  @IsOptional()
  sortType: string;
}
