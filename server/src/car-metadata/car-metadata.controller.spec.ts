import { Test, TestingModule } from '@nestjs/testing';
import { CarMetadataController } from './car-metadata.controller';

describe('CarProfileController', () => {
  let controller: CarMetadataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarMetadataController],
    }).compile();

    controller = module.get<CarMetadataController>(CarMetadataController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
