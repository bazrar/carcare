import { UserVehicleSchema } from './user-vehicle.schema';

describe('UserVehicleSchema', () => {
  it('should be defined', () => {
    expect(new UserVehicleSchema()).toBeDefined();
  });
});
