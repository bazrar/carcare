import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProfileDto {
  @ApiProperty({ description: 'First name', example: 'Ram' })
  @IsString()
  @IsNotEmpty()
  readonly firstName: string;

  @ApiProperty({ description: 'Middle name', example: 'Bahadur' })
  @IsString()
  @IsOptional()
  readonly middleName: string;

  @ApiProperty({ description: 'Last name', example: 'Shrestha' })
  @IsString()
  @IsNotEmpty()
  readonly lastName: string;

  @ApiProperty({ description: 'email of user', example: 'abc@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  // @ApiProperty({ description: 'Profile picture of use' })
  // @IsString()
  // readonly avatar: string;
}
