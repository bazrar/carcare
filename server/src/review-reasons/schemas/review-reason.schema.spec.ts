import { ReviewReasonSchema } from './review-reason.schema';

describe('ReviewReasonSchema', () => {
  it('should be defined', () => {
    expect(new ReviewReasonSchema()).toBeDefined();
  });
});
