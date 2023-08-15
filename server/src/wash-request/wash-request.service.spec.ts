import { Test, TestingModule } from '@nestjs/testing';
import { WashRequestService } from './wash-request.service';

describe('WashRequestService', () => {
  let service: WashRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WashRequestService],
    }).compile();

    service = module.get<WashRequestService>(WashRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
