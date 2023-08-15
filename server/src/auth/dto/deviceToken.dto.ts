import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeviceTokenDto {
  @ApiProperty({
    description: 'device token related to current user',
    example: 'fwdsfhbdsfhkdfasdlasdladladlkajdjl',
  })
  @IsString()
  deviceToken: string;
}
