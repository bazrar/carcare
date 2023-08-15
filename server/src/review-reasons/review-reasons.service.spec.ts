import { Test, TestingModule } from '@nestjs/testing';
import { ReviewReasonsService } from './review-reasons.service';

describe('ReviewReasonsService', () => {
  let service: ReviewReasonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewReasonsService],
    }).compile();

    service = module.get<ReviewReasonsService>(ReviewReasonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
