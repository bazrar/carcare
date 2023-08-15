import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ServiceStationTypeEnum } from '../schemas/service-station.schema';

export class FilterServiceStationListDto {
  @ApiProperty({ description: 'search query filter', required: false })
  @IsOptional()
  q: string;

  @ApiProperty({
    description: 'Whether pickAndDrop is available',
    required: false,
  })
  @IsOptional()
  pickAndDrop: boolean;

  @ApiProperty({ description: 'service station type', required: false })
  @IsOptional()
  serviceStationType: ServiceStationTypeEnum;

  @ApiProperty({ description: 'location filter', required: false })
  @IsOptional()
  location: [number, number];
}
