import { Test, TestingModule } from '@nestjs/testing';
import { SeekerPlaceService } from './seeker-place.service';

describe('SeekerPlaceService', () => {
  let service: SeekerPlaceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeekerPlaceService],
    }).compile();

    service = module.get<SeekerPlaceService>(SeekerPlaceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
