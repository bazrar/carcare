import { FeedbackSchema } from './feedback.schema';

describe('RatingSchema', () => {
  it('should be defined', () => {
    expect(new FeedbackSchema()).toBeDefined();
  });
});
