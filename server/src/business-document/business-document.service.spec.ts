import { Test, TestingModule } from '@nestjs/testing';
import { BusinessDocumentService } from './business-document.service';

describe('BusinessDocumentService', () => {
  let service: BusinessDocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BusinessDocumentService],
    }).compile();

    service = module.get<BusinessDocumentService>(BusinessDocumentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
