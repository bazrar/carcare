import { ApiProperty } from '@nestjs/swagger';
import {
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class LoginWithPhoneDto {
  @ApiProperty({
    description: 'Mobile number',
    example: '12345678901',
  })
  @IsNotEmpty()
  // @IsMobilePhone(['en-US'])
  mobileNumber: string;

  @ApiProperty({
    description: 'Token',
    example: 'token for invited case',
  })
  @IsOptional()
  token: string;
}

export class TokenDto {
  @ApiProperty({
    description: 'validation token',
    example: 'bxewicxbquxqwo',
  })
  @IsString()
  token: string;
}
