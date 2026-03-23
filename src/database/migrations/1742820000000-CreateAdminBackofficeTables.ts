import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminBackofficeTables1742820000000 implements MigrationInterface {
  name = 'CreateAdminBackofficeTables1742820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_invite_status') THEN
          CREATE TYPE "admin_invite_status" AS ENUM ('pending', 'accepted', 'expired', 'revoked');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credential_template_status') THEN
          CREATE TYPE "credential_template_status" AS ENUM ('draft', 'published', 'archived');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credential_request_status') THEN
          CREATE TYPE "credential_request_status" AS ENUM ('pending', 'approved', 'rejected', 'issued', 'failed');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credential_status') THEN
          CREATE TYPE "credential_status" AS ENUM ('issued', 'revoked', 'failed');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credential_event_type') THEN
          CREATE TYPE "credential_event_type" AS ENUM (
            'requested',
            'approved',
            'rejected',
            'issued',
            'synced_onchain',
            'verified',
            'revoked',
            'failed'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dashboard_scope_type') THEN
          CREATE TYPE "dashboard_scope_type" AS ENUM ('global', 'template', 'credential');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_job_type') THEN
          CREATE TYPE "report_job_type" AS ENUM (
            'dashboard_summary',
            'question_quality',
            'exam_performance',
            'credential_registry',
            'audit_export'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_job_status') THEN
          CREATE TYPE "report_job_status" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'setting_data_type') THEN
          CREATE TYPE "setting_data_type" AS ENUM ('string', 'number', 'boolean', 'json');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "admin_invites" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "email" character varying(255) NOT NULL,
        "role" "user_role" NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "status" "admin_invite_status" NOT NULL DEFAULT 'pending',
        "expires_at" TIMESTAMPTZ NOT NULL,
        "accepted_at" TIMESTAMPTZ,
        "revoked_at" TIMESTAMPTZ,
        "accepted_user_id" uuid,
        "invited_by" uuid NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_admin_invites_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_admin_invites_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "fk_admin_invites_invited_by" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_admin_invites_accepted_user_id" FOREIGN KEY ("accepted_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admin_invites_email" ON "admin_invites" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admin_invites_status" ON "admin_invites" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_admin_invites_invited_by" ON "admin_invites" ("invited_by")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credential_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "status" "credential_template_status" NOT NULL DEFAULT 'draft',
        "issuer_name" character varying(255) NOT NULL,
        "issuer_did" character varying(255),
        "pass_score_threshold" integer,
        "validity_days" integer,
        "artwork_storage_key" character varying(500),
        "artwork_public_url" character varying(1000),
        "template_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "published_at" TIMESTAMPTZ,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_by" uuid NOT NULL,
        "updated_by" uuid,
        CONSTRAINT "PK_credential_templates_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_credential_templates_code" UNIQUE ("code"),
        CONSTRAINT "fk_credential_templates_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_credential_templates_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_templates_status" ON "credential_templates" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_templates_created_by" ON "credential_templates" ("created_by")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credential_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "status" "credential_request_status" NOT NULL DEFAULT 'pending',
        "user_id" uuid NOT NULL,
        "credential_template_id" uuid NOT NULL,
        "exam_template_id" uuid,
        "eligibility_source" character varying(50) NOT NULL,
        "source_ref" character varying(255),
        "requested_at" TIMESTAMPTZ NOT NULL,
        "decision_at" TIMESTAMPTZ,
        "decided_by" uuid,
        "rejection_reason" text,
        "approved_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_credential_requests_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_credential_requests_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_credential_requests_template_id" FOREIGN KEY ("credential_template_id") REFERENCES "credential_templates"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_credential_requests_exam_template_id" FOREIGN KEY ("exam_template_id") REFERENCES "exam_templates"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_credential_requests_decided_by" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_requests_status" ON "credential_requests" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_requests_user_id" ON "credential_requests" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_requests_template_id" ON "credential_requests" ("credential_template_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credentials" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "serial_number" character varying(100) NOT NULL,
        "vc_id" character varying(255) NOT NULL,
        "status" "credential_status" NOT NULL DEFAULT 'issued',
        "user_id" uuid NOT NULL,
        "credential_template_id" uuid NOT NULL,
        "request_id" uuid,
        "subject_did" character varying(255),
        "issuer_did" character varying(255),
        "storage_uri" character varying(1000),
        "ipfs_cid" character varying(255),
        "qr_token" character varying(255) NOT NULL,
        "qr_url" character varying(1000),
        "network" character varying(100),
        "contract_address" character varying(255),
        "token_id" character varying(255),
        "tx_hash" character varying(255),
        "issued_at" TIMESTAMPTZ NOT NULL,
        "expires_at" TIMESTAMPTZ,
        "revoked_at" TIMESTAMPTZ,
        "revoked_by" uuid,
        "revocation_reason" text,
        "credential_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_credentials_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_credentials_serial_number" UNIQUE ("serial_number"),
        CONSTRAINT "uq_credentials_vc_id" UNIQUE ("vc_id"),
        CONSTRAINT "uq_credentials_request_id" UNIQUE ("request_id"),
        CONSTRAINT "uq_credentials_qr_token" UNIQUE ("qr_token"),
        CONSTRAINT "fk_credentials_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_credentials_template_id" FOREIGN KEY ("credential_template_id") REFERENCES "credential_templates"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_credentials_request_id" FOREIGN KEY ("request_id") REFERENCES "credential_requests"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_credentials_revoked_by" FOREIGN KEY ("revoked_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credentials_status" ON "credentials" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credentials_user_id" ON "credentials" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credentials_template_id" ON "credentials" ("credential_template_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credential_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "event_type" "credential_event_type" NOT NULL,
        "credential_id" uuid,
        "credential_request_id" uuid,
        "actor_id" uuid,
        "note" text,
        "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "occurred_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "PK_credential_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_credential_events_credential_id" FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_credential_events_request_id" FOREIGN KEY ("credential_request_id") REFERENCES "credential_requests"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_credential_events_actor_id" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_events_type" ON "credential_events" ("event_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_events_credential_id" ON "credential_events" ("credential_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_events_request_id" ON "credential_events" ("credential_request_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "credential_verification_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "credential_id" uuid,
        "verification_source" character varying(50) NOT NULL DEFAULT 'public_verify',
        "verifier_ip" character varying(100),
        "user_agent" character varying(1000),
        "is_success" boolean NOT NULL DEFAULT true,
        "error_code" character varying(100),
        "checked_at" TIMESTAMPTZ NOT NULL,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_credential_verification_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_credential_verification_logs_credential_id" FOREIGN KEY ("credential_id") REFERENCES "credentials"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_credential_verification_logs_credential_id" ON "credential_verification_logs" ("credential_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "dashboard_kpi_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "snapshot_date" date NOT NULL,
        "scope_type" "dashboard_scope_type" NOT NULL DEFAULT 'global',
        "scope_ref" character varying(255) NOT NULL DEFAULT '',
        "active_learners" integer NOT NULL DEFAULT 0,
        "active_admins" integer NOT NULL DEFAULT 0,
        "new_users" integer NOT NULL DEFAULT 0,
        "practice_attempts" integer NOT NULL DEFAULT 0,
        "mock_test_attempts" integer NOT NULL DEFAULT 0,
        "average_score" numeric(8,2) NOT NULL DEFAULT 0,
        "pass_rate" numeric(5,2) NOT NULL DEFAULT 0,
        "credentials_issued" integer NOT NULL DEFAULT 0,
        "credentials_revoked" integer NOT NULL DEFAULT 0,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_dashboard_kpi_snapshots_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_dashboard_kpi_snapshots_date_scope" UNIQUE ("snapshot_date", "scope_type", "scope_ref")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_dashboard_kpi_snapshots_scope_type" ON "dashboard_kpi_snapshots" ("scope_type")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_quality_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "snapshot_date" date NOT NULL,
        "question_group_id" uuid NOT NULL,
        "attempts_count" integer NOT NULL DEFAULT 0,
        "correct_count" integer NOT NULL DEFAULT 0,
        "accuracy_rate" numeric(5,2) NOT NULL DEFAULT 0,
        "avg_time_sec" numeric(8,2) NOT NULL DEFAULT 0,
        "discrimination_index" numeric(5,2),
        "flagged_count" integer NOT NULL DEFAULT 0,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_question_quality_snapshots_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_question_quality_snapshots_date_group" UNIQUE ("snapshot_date", "question_group_id"),
        CONSTRAINT "fk_question_quality_snapshots_group_id" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_quality_snapshots_group_id" ON "question_quality_snapshots" ("question_group_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_performance_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "snapshot_date" date NOT NULL,
        "exam_template_id" uuid NOT NULL,
        "attempts_count" integer NOT NULL DEFAULT 0,
        "completed_count" integer NOT NULL DEFAULT 0,
        "abandoned_count" integer NOT NULL DEFAULT 0,
        "average_score" numeric(8,2) NOT NULL DEFAULT 0,
        "pass_rate" numeric(5,2) NOT NULL DEFAULT 0,
        "avg_duration_sec" numeric(8,2) NOT NULL DEFAULT 0,
        "p90_duration_sec" numeric(8,2),
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_exam_performance_snapshots_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_exam_performance_snapshots_date_template" UNIQUE ("snapshot_date", "exam_template_id"),
        CONSTRAINT "fk_exam_performance_snapshots_template_id" FOREIGN KEY ("exam_template_id") REFERENCES "exam_templates"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_exam_performance_snapshots_template_id" ON "exam_performance_snapshots" ("exam_template_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "report_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "type" "report_job_type" NOT NULL,
        "status" "report_job_status" NOT NULL DEFAULT 'queued',
        "requested_by" uuid NOT NULL,
        "file_storage_key" character varying(500),
        "file_public_url" character varying(1000),
        "filters" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "started_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        "error_message" text,
        "rows_exported" integer,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_report_jobs_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_report_jobs_requested_by" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_report_jobs_type" ON "report_jobs" ("type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_report_jobs_status" ON "report_jobs" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_report_jobs_requested_by" ON "report_jobs" ("requested_by")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "key" character varying(150) NOT NULL,
        "group_name" character varying(100) NOT NULL,
        "data_type" "setting_data_type" NOT NULL,
        "value_json" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "is_secret" boolean NOT NULL DEFAULT false,
        "is_public" boolean NOT NULL DEFAULT false,
        "description" text,
        "updated_by" uuid,
        CONSTRAINT "PK_system_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_system_settings_key" UNIQUE ("key"),
        CONSTRAINT "fk_system_settings_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_system_settings_group_name" ON "system_settings" ("group_name")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "feature_flags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "key" character varying(150) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "is_enabled" boolean NOT NULL DEFAULT false,
        "rollout_percentage" integer NOT NULL DEFAULT 100,
        "conditions" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "updated_by" uuid,
        CONSTRAINT "PK_feature_flags_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_feature_flags_key" UNIQUE ("key"),
        CONSTRAINT "fk_feature_flags_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "actor_id" uuid,
        "actor_email" character varying(255),
        "action" character varying(100) NOT NULL,
        "resource_type" character varying(100) NOT NULL,
        "resource_id" character varying(255),
        "route" character varying(255),
        "method" character varying(20),
        "ip_address" character varying(100),
        "user_agent" character varying(1000),
        "status_code" integer,
        "success" boolean NOT NULL DEFAULT true,
        "changes" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "occurred_at" TIMESTAMPTZ NOT NULL,
        CONSTRAINT "PK_audit_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_audit_logs_actor_id" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor_id" ON "audit_logs" ("actor_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs" ("action")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_audit_logs_resource_type" ON "audit_logs" ("resource_type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_audit_logs_resource_type"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_action"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audit_logs_actor_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "feature_flags"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_system_settings_group_name"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_report_jobs_requested_by"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_report_jobs_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_report_jobs_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "report_jobs"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_exam_performance_snapshots_template_id"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "exam_performance_snapshots"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_quality_snapshots_group_id"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "question_quality_snapshots"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_dashboard_kpi_snapshots_scope_type"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "dashboard_kpi_snapshots"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_verification_logs_credential_id"`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "credential_verification_logs"`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_events_request_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_events_credential_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_events_type"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "credential_events"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credentials_template_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_credentials_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_credentials_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "credentials"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_requests_template_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_requests_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_requests_status"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "credential_requests"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_templates_created_by"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_credential_templates_status"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "credential_templates"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_admin_invites_invited_by"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_invites_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_admin_invites_email"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_invites"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "setting_data_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_job_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_job_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dashboard_scope_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credential_event_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credential_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credential_request_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credential_template_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admin_invite_status"`);
  }
}
