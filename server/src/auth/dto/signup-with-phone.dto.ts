import { IsNotEmpty } from 'class-validator';

export class SignupWithPhoneDto {
  @IsNotEmpty()
  mobileNumber: string;
}
