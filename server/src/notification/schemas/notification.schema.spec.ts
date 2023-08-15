import { Notification } from './notification.schema';

describe('NotificationSchema', () => {
  it('should be defined', () => {
    expect(new Notification()).toBeDefined();
  });
});
