import { Test, TestingModule } from '@nestjs/testing';
import { UserVehicleController } from './user-vehicle.controller';

describe('UserVehicleController', () => {
  let controller: UserVehicleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserVehicleController],
    }).compile();

    controller = module.get<UserVehicleController>(UserVehicleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
