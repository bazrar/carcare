import { WashRequestSchema } from './wash-request.schema';

describe('WashRequestSchema', () => {
  it('should be defined', () => {
    expect(new WashRequestSchema()).toBeDefined();
  });
});
