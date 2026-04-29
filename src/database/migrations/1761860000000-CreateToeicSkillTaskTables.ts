import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateToeicSkillTaskTables1761860000000 implements MigrationInterface {
  name = 'CreateToeicSkillTaskTables1761860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_task_status') THEN
          CREATE TYPE "skill_task_status" AS ENUM ('draft', 'published', 'archived');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'toeic_writing_task_type') THEN
          CREATE TYPE "toeic_writing_task_type" AS ENUM ('part1_sentence', 'part2_email', 'part3_essay');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'toeic_speaking_task_type') THEN
          CREATE TYPE "toeic_speaking_task_type" AS ENUM ('read_aloud', 'describe_picture', 'express_opinion', 'respond_to_questions');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "toeic_writing_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "code" character varying(60) NOT NULL,
        "title" character varying(255) NOT NULL,
        "task_type" "toeic_writing_task_type" NOT NULL,
        "level" "question_level" NOT NULL,
        "status" "skill_task_status" NOT NULL DEFAULT 'draft',
        "prompt" text NOT NULL,
        "min_words" integer,
        "max_words" integer,
        "time_limit_sec" integer,
        "tips" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "rubric" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "published_at" TIMESTAMPTZ,
        "created_by" uuid NOT NULL,
        "updated_by" uuid,
        CONSTRAINT "PK_toeic_writing_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_toeic_writing_tasks_code" UNIQUE ("code"),
        CONSTRAINT "fk_toeic_writing_tasks_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_toeic_writing_tasks_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_writing_tasks_type" ON "toeic_writing_tasks" ("task_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_writing_tasks_level" ON "toeic_writing_tasks" ("level")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_writing_tasks_status" ON "toeic_writing_tasks" ("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "toeic_speaking_tasks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "code" character varying(60) NOT NULL,
        "title" character varying(255) NOT NULL,
        "task_type" "toeic_speaking_task_type" NOT NULL,
        "level" "question_level" NOT NULL,
        "status" "skill_task_status" NOT NULL DEFAULT 'draft',
        "prompt" text NOT NULL,
        "target_seconds" integer,
        "time_limit_sec" integer,
        "tips" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "rubric" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "published_at" TIMESTAMPTZ,
        "created_by" uuid NOT NULL,
        "updated_by" uuid,
        CONSTRAINT "PK_toeic_speaking_tasks_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_toeic_speaking_tasks_code" UNIQUE ("code"),
        CONSTRAINT "fk_toeic_speaking_tasks_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_toeic_speaking_tasks_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_speaking_tasks_type" ON "toeic_speaking_tasks" ("task_type")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_speaking_tasks_level" ON "toeic_speaking_tasks" ("level")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_speaking_tasks_status" ON "toeic_speaking_tasks" ("status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_speaking_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_speaking_tasks_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_speaking_tasks_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "toeic_speaking_tasks"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_writing_tasks_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_writing_tasks_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_writing_tasks_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "toeic_writing_tasks"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "toeic_speaking_task_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "toeic_writing_task_type"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "skill_task_status"`);
  }
}

