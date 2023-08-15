import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ description: 'name of job' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'description of job' })
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Reference to the business',
    default: null,
    required: false,
  })
  @IsOptional()
  businessId?: string;

  @ApiProperty({
    description: 'refers if the job is default',
    default: false,
    required: false,
  })
  @IsOptional()
  isDefault?: boolean;
}
