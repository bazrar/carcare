import { Test, TestingModule } from '@nestjs/testing';
import { BusinessDocumentController } from './business-document.controller';

describe('BusinessDocumentController', () => {
  let controller: BusinessDocumentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessDocumentController],
    }).compile();

    controller = module.get<BusinessDocumentController>(
      BusinessDocumentController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
