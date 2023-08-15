import { Test, TestingModule } from '@nestjs/testing';
import { OtpSmsController } from './otp-sms.controller';

describe('OtpSmsController', () => {
  let controller: OtpSmsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OtpSmsController],
    }).compile();

    controller = module.get<OtpSmsController>(OtpSmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
