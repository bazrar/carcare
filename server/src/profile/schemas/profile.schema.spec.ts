import { Profile } from './profile.schema';

describe('ProfileSchema', () => {
  it('should be defined', () => {
    expect(new Profile()).toBeDefined();
  });
});
