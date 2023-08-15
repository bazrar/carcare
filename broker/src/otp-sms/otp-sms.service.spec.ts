import { Test, TestingModule } from '@nestjs/testing';
import { OtpSmsService } from './otp-sms.service';

describe('OtpSmsService', () => {
  let service: OtpSmsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OtpSmsService],
    }).compile();

    service = module.get<OtpSmsService>(OtpSmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
