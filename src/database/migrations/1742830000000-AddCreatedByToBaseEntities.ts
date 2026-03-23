import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreatedByToBaseEntities1742830000000 implements MigrationInterface {
  name = 'AddCreatedByToBaseEntities1742830000000';

  private readonly tablesToAddCreatedBy = [
    'users',
    'refresh_tokens',
    'tags',
    'question_group_assets',
    'questions',
    'question_options',
    'question_group_tags',
    'question_group_reviews',
    'exam_template_sections',
    'exam_template_rules',
    'exam_template_items',
    'admin_invites',
    'credential_requests',
    'credentials',
    'credential_events',
    'credential_verification_logs',
    'dashboard_kpi_snapshots',
    'question_quality_snapshots',
    'exam_performance_snapshots',
    'report_jobs',
    'system_settings',
    'feature_flags',
    'audit_logs',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of this.tablesToAddCreatedBy) {
      await queryRunner.query(`
        ALTER TABLE "${tableName}"
        ADD COLUMN IF NOT EXISTS "created_by" uuid
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of [...this.tablesToAddCreatedBy].reverse()) {
      await queryRunner.query(`
        ALTER TABLE "${tableName}"
        DROP COLUMN IF EXISTS "created_by"
      `);
    }
  }
}
