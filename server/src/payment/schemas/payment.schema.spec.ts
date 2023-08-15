import { Payment } from './payment.schema';

describe('PaymentSchema', () => {
  it('should be defined', () => {
    expect(new Payment()).toBeDefined();
  });
});
