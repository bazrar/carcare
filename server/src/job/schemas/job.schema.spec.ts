import { JobSchema } from './job.schema';

describe('ServiceSchema', () => {
  it('should be defined', () => {
    expect(new JobSchema()).toBeDefined();
  });
});
