import { Test, TestingModule } from '@nestjs/testing';
import { ProviderServicesService } from './provider-services.service';

describe('ProviderServicesService', () => {
  let service: ProviderServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderServicesService],
    }).compile();

    service = module.get<ProviderServicesService>(ProviderServicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
