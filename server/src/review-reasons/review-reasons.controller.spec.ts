import { Test, TestingModule } from '@nestjs/testing';
import { ReviewReasonsController } from './review-reasons.controller';

describe('ReviewReasonsController', () => {
  let controller: ReviewReasonsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewReasonsController],
    }).compile();

    controller = module.get<ReviewReasonsController>(ReviewReasonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
