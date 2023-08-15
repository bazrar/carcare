import { ServiceStationSchema } from './service-station.schema';

describe('ServiceStationSchema', () => {
  it('should be defined', () => {
    expect(new ServiceStationSchema()).toBeDefined();
  });
});
