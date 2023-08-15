import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class LimitDto {
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  limit: string;
}
