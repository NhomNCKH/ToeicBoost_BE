export enum UserRole {
  ADMIN = 'admin',
  ORG_ADMIN = 'org_admin',
  INSTRUCTOR = 'instructor',
  CURATOR = 'curator',
  LEARNER = 'learner',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}
