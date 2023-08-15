import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class WebLoginDto {
  @ApiProperty({ description: 'email of user' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'password of user' })
  @IsNotEmpty()
  password: string;
}
