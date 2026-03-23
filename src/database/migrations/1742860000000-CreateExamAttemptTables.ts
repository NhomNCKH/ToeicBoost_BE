import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExamAttemptTables1742860000000 implements MigrationInterface {
  name = 'CreateExamAttemptTables1742860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'exam_attempt_status') THEN
          CREATE TYPE "exam_attempt_status" AS ENUM (
            'in_progress',
            'submitted',
            'graded',
            'abandoned',
            'cancelled'
          );
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_attempts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "exam_template_id" uuid NOT NULL,
        "attempt_no" integer NOT NULL,
        "status" "exam_attempt_status" NOT NULL DEFAULT 'in_progress',
        "mode" "template_mode" NOT NULL,
        "started_at" TIMESTAMPTZ NOT NULL,
        "submitted_at" TIMESTAMPTZ,
        "graded_at" TIMESTAMPTZ,
        "duration_sec" integer,
        "total_questions" integer NOT NULL DEFAULT 0,
        "answered_count" integer NOT NULL DEFAULT 0,
        "correct_count" integer NOT NULL DEFAULT 0,
        "listening_raw_score" numeric(8,2) NOT NULL DEFAULT 0,
        "reading_raw_score" numeric(8,2) NOT NULL DEFAULT 0,
        "listening_scaled_score" numeric(8,2) NOT NULL DEFAULT 0,
        "reading_scaled_score" numeric(8,2) NOT NULL DEFAULT 0,
        "total_score" numeric(8,2) NOT NULL DEFAULT 0,
        "pass_threshold_snapshot" integer NOT NULL DEFAULT 500,
        "passed" boolean NOT NULL DEFAULT false,
        "scoring_version" character varying(50),
        "template_snapshot" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "result_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_exam_attempts_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_exam_attempts_user_template_attempt_no" UNIQUE ("user_id", "exam_template_id", "attempt_no"),
        CONSTRAINT "fk_exam_attempts_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_exam_attempts_exam_template_id" FOREIGN KEY ("exam_template_id") REFERENCES "exam_templates"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempts_user_id" ON "exam_attempts" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempts_exam_template_id" ON "exam_attempts" ("exam_template_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempts_status" ON "exam_attempts" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempts_started_at" ON "exam_attempts" ("started_at")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempts_submitted_at" ON "exam_attempts" ("submitted_at")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_attempt_answers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "exam_attempt_id" uuid NOT NULL,
        "question_group_id" uuid NOT NULL,
        "question_id" uuid NOT NULL,
        "part" "question_part" NOT NULL,
        "question_no" integer NOT NULL,
        "selected_option_key" character varying(10),
        "selected_option_snapshot" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "is_correct" boolean NOT NULL DEFAULT false,
        "score_weight_snapshot" numeric(6,2) NOT NULL DEFAULT 1,
        "score_awarded" numeric(8,2) NOT NULL DEFAULT 0,
        "answered_at" TIMESTAMPTZ,
        "time_spent_sec" integer,
        "answer_payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_exam_attempt_answers_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_exam_attempt_answers_attempt_question" UNIQUE ("exam_attempt_id", "question_id"),
        CONSTRAINT "fk_exam_attempt_answers_attempt_id" FOREIGN KEY ("exam_attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_exam_attempt_answers_question_group_id" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_exam_attempt_answers_question_id" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempt_answers_attempt_id" ON "exam_attempt_answers" ("exam_attempt_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempt_answers_question_group_id" ON "exam_attempt_answers" ("question_group_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempt_answers_question_id" ON "exam_attempt_answers" ("question_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempt_answers_part" ON "exam_attempt_answers" ("part")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_attempt_part_scores" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "exam_attempt_id" uuid NOT NULL,
        "part" "question_part" NOT NULL,
        "section_order" integer NOT NULL,
        "question_count" integer NOT NULL DEFAULT 0,
        "correct_count" integer NOT NULL DEFAULT 0,
        "raw_score" numeric(8,2) NOT NULL DEFAULT 0,
        "scaled_score" numeric(8,2) NOT NULL DEFAULT 0,
        "duration_sec" integer,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_exam_attempt_part_scores_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_exam_attempt_part_scores_attempt_part" UNIQUE ("exam_attempt_id", "part"),
        CONSTRAINT "fk_exam_attempt_part_scores_attempt_id" FOREIGN KEY ("exam_attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempt_part_scores_attempt_id" ON "exam_attempt_part_scores" ("exam_attempt_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_attempt_part_scores_part" ON "exam_attempt_part_scores" ("part")
    `);

    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      ADD COLUMN IF NOT EXISTS "exam_attempt_id" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      ADD COLUMN IF NOT EXISTS "eligibility_score" numeric(8,2)
    `);
    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      ADD COLUMN IF NOT EXISTS "pass_threshold_snapshot" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      DROP CONSTRAINT IF EXISTS "fk_credential_requests_exam_attempt_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      ADD CONSTRAINT "fk_credential_requests_exam_attempt_id"
      FOREIGN KEY ("exam_attempt_id") REFERENCES "exam_attempts"("id") ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_credential_requests_exam_attempt_id" ON "credential_requests" ("exam_attempt_id")
    `);

    await queryRunner.query(`
      UPDATE "credential_requests"
      SET "pass_threshold_snapshot" = 500
      WHERE "pass_threshold_snapshot" IS NULL
        AND "eligibility_source" = 'exam_result'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_credential_requests_exam_attempt_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      DROP CONSTRAINT IF EXISTS "fk_credential_requests_exam_attempt_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      DROP COLUMN IF EXISTS "pass_threshold_snapshot"
    `);
    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      DROP COLUMN IF EXISTS "eligibility_score"
    `);
    await queryRunner.query(`
      ALTER TABLE "credential_requests"
      DROP COLUMN IF EXISTS "exam_attempt_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempt_part_scores_part"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempt_part_scores_attempt_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_attempt_part_scores"`);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempt_answers_part"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempt_answers_question_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempt_answers_question_group_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempt_answers_attempt_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_attempt_answers"`);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempts_submitted_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempts_started_at"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempts_status"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempts_exam_template_id"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_exam_attempts_user_id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_attempts"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "exam_attempt_status"`);
  }
}
