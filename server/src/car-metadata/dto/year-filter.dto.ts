import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class YearFilterDto {
  @ApiProperty({ description: 'search query string', example: '202' })
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

  @ApiProperty({
    description: 'Body Styles of vechicle',
    example: 'Sedan',
  })
  @IsNotEmpty()
  readonly bodyStyles: string;
}
