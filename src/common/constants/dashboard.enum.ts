export enum DashboardScopeType {
  GLOBAL = 'global',
  TEMPLATE = 'template',
  CREDENTIAL = 'credential',
}

export enum ReportJobType {
  DASHBOARD_SUMMARY = 'dashboard_summary',
  QUESTION_QUALITY = 'question_quality',
  EXAM_PERFORMANCE = 'exam_performance',
  CREDENTIAL_REGISTRY = 'credential_registry',
  AUDIT_EXPORT = 'audit_export',
}

export enum ReportJobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
