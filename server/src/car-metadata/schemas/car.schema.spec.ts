import { CarProfileSchema } from './car-metadata.schema';

describe('CarProfileSchema', () => {
  it('should be defined', () => {
    expect(new CarProfileSchema()).toBeDefined();
  });
});
