import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone, IsNotEmpty, IsOptional } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: '6digit Otp code',
    example: '123456',
  })
  @IsNotEmpty()
  otp: string;

  @ApiProperty({
    description: 'Mobile number',
    example: '12345678901',
  })
  @IsNotEmpty()
  @IsMobilePhone()
  mobileNumber: string;

  @ApiProperty({
    description: 'Device token and type for handling notifications',
    example: '{ token: afyifwqldaksfkdfha;lsfsaf, type: android | ios }',
  })
  @IsOptional()
  deviceToken: {
    token: string;
    type: string;
  };
}
