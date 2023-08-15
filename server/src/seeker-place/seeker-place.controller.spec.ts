import { Test, TestingModule } from '@nestjs/testing';
import { SeekerPlaceController } from './seeker-place.controller';

describe('SeekerPlaceController', () => {
  let controller: SeekerPlaceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SeekerPlaceController],
    }).compile();

    controller = module.get<SeekerPlaceController>(SeekerPlaceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
