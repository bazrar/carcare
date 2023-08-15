export enum WashRequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  SEEKER_REJECTED = 'seeker_rejected',
  PROVIDER_REJECTED = 'provider_rejected',
  COMPLETED = 'completed',
  CONFIRMED = 'confirmed',
}

export enum ProviderServiceStatus {
  COMMUTING = 'commuting',
  ARRIVED = 'arrived',
  CODE_SHARED = 'code-shared',
  CODE_VERIFIED = 'code_verified',
  SERVICE_STARTED = 'service-started',
  SERVICE_COMPLETED = 'service-completed',
  PAYMENT_RECEIVED = 'payment-received',
}
