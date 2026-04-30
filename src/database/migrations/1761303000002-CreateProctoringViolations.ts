import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProctoringViolations1761303000002
  implements MigrationInterface
{
  name = 'CreateProctoringViolations1761303000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_attempts"
      ADD COLUMN IF NOT EXISTS "proctoring_enabled" boolean NOT NULL DEFAULT true,
      ADD COLUMN IF NOT EXISTS "warning_count" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "violation_count" integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "last_violation_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "blocked_at" timestamptz,
      ADD COLUMN IF NOT EXISTS "block_reason" text,
      ADD COLUMN IF NOT EXISTS "proctoring_status" character varying(20) NOT NULL DEFAULT 'active'
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "proctoring_violations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "exam_id" uuid NOT NULL,
        "exam_attempt_id" uuid,
        "violation_type" character varying NOT NULL,
        "message" character varying,
        "severity" integer NOT NULL DEFAULT 1,
        "confidence" double precision NOT NULL DEFAULT 0,
        "timestamp" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proctoring_violations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "proctoring_violations"
      ADD COLUMN IF NOT EXISTS "user_id" uuid,
      ADD COLUMN IF NOT EXISTS "exam_id" uuid,
      ADD COLUMN IF NOT EXISTS "exam_attempt_id" uuid,
      ADD COLUMN IF NOT EXISTS "violation_type" character varying,
      ADD COLUMN IF NOT EXISTS "message" character varying,
      ADD COLUMN IF NOT EXISTS "severity" integer NOT NULL DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "confidence" double precision NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "timestamp" timestamptz NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      ALTER TABLE "proctoring_violations"
      ALTER COLUMN "user_id" SET NOT NULL,
      ALTER COLUMN "exam_id" SET NOT NULL,
      ALTER COLUMN "violation_type" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_proctoring_violations_user_exam"
      ON "proctoring_violations" ("user_id", "exam_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_proctoring_violations_attempt"
      ON "proctoring_violations" ("exam_attempt_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_proctoring_violations_timestamp"
      ON "proctoring_violations" ("timestamp")
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_proctoring_violations_user_id'
        ) THEN
          ALTER TABLE "proctoring_violations"
          ADD CONSTRAINT "fk_proctoring_violations_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'fk_proctoring_violations_attempt_id'
        ) THEN
          ALTER TABLE "proctoring_violations"
          ADD CONSTRAINT "fk_proctoring_violations_attempt_id"
          FOREIGN KEY ("exam_attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "proctoring_violations"`,
    );

    await queryRunner.query(`
      ALTER TABLE "exam_attempts"
      DROP COLUMN IF EXISTS "proctoring_status",
      DROP COLUMN IF EXISTS "block_reason",
      DROP COLUMN IF EXISTS "blocked_at",
      DROP COLUMN IF EXISTS "last_violation_at",
      DROP COLUMN IF EXISTS "violation_count",
      DROP COLUMN IF EXISTS "warning_count",
      DROP COLUMN IF EXISTS "proctoring_enabled"
    `);
  }
}
