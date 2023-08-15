import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';

class JobDescription {
  @ApiProperty({ description: 'job Id' })
  @IsString()
  @IsOptional()
  readonly jobId;

  @ApiProperty({
    description: 'additional job description for the provider service',
  })
  @IsString()
  @IsOptional()
  readonly description: string;

  @ApiProperty({
    description: 'job name for the provider service',
  })
  @IsString()
  @IsOptional()
  readonly name: string;
}
export class CreateProviderServiceDto {
  @ApiProperty({ description: 'minimum price' })
  @IsNotEmpty()
  minPrice: number;

  @ApiProperty({ description: 'maximum price' })
  @IsNotEmpty()
  maxPrice: number;

  @ApiProperty({ description: 'time to complete' })
  @IsNotEmpty()
  expectedTimeToComplete: number;

  @ApiProperty({
    description: 'List of job description',
    example: [
      {
        jobId: 'id of job',
        description: 'description of job',
        name: 'name of job',
      },
    ],
    type: () => [JobDescription],
  })
  @IsArray()
  jobs: [JobDescription];

  @ApiProperty({
    description: 'set active status',
    example: false,
  })
  @IsOptional()
  isActive: boolean;

  @ApiProperty({
    description: 'add description',
    example: 'this is just a demo description',
  })
  @IsOptional()
  @IsString()
  description: string;

  //   @IsNotEmpty()
  //   serviceId: string;

  //   @IsNotEmpty()
  //   userId: string;
}
