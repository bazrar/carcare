import { BusinessDocumentSchema } from './business-document.schema';

describe('BusinessDocumentSchema', () => {
  it('should be defined', () => {
    expect(new BusinessDocumentSchema()).toBeDefined();
  });
});
