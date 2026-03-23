export enum CredentialTemplateStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum CredentialRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ISSUED = 'issued',
  FAILED = 'failed',
}

export enum CredentialStatus {
  ISSUED = 'issued',
  REVOKED = 'revoked',
  FAILED = 'failed',
}

export enum CredentialEventType {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ISSUED = 'issued',
  SYNCED_ONCHAIN = 'synced_onchain',
  VERIFIED = 'verified',
  REVOKED = 'revoked',
  FAILED = 'failed',
}
