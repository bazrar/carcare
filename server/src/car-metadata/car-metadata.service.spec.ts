import { Test, TestingModule } from '@nestjs/testing';
import { CarMetadataService } from './car-metadata.service';

describe('CarMetadataService', () => {
  let service: CarMetadataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CarMetadataService],
    }).compile();

    service = module.get<CarMetadataService>(CarMetadataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
