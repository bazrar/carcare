import { Test, TestingModule } from '@nestjs/testing';
import { UserVehicleService } from './user-vehicle.service';

describe('UserVehicleService', () => {
  let service: UserVehicleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserVehicleService],
    }).compile();

    service = module.get<UserVehicleService>(UserVehicleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
