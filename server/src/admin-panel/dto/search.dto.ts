import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export enum QueryType {
  Seeker = 'seeker',
  Provider = 'provider',
  WashRequest = 'washRequest',
}

export class SearchDto {
  @ApiProperty({ description: 'search string', required: true })
  @IsString()
  queryString: string;

  @ApiProperty({ description: 'collection type', required: true })
  @IsString()
  queryType: QueryType;
}
