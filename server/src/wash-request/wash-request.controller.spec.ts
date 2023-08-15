import { Test, TestingModule } from '@nestjs/testing';
import { WashRequestController } from './wash-request.controller';

describe('WashRequestController', () => {
  let controller: WashRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WashRequestController],
    }).compile();

    controller = module.get<WashRequestController>(WashRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
