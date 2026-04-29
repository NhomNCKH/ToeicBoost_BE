import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateToeicSpeakingSetTables1761860000001
  implements MigrationInterface
{
  name = 'CreateToeicSpeakingSetTables1761860000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "toeic_speaking_sets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "code" character varying(60) NOT NULL,
        "title" character varying(255) NOT NULL,
        "level" "question_level" NOT NULL,
        "status" "skill_task_status" NOT NULL DEFAULT 'draft',
        "time_limit_sec" integer,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "published_at" TIMESTAMPTZ,
        "created_by" uuid NOT NULL,
        "updated_by" uuid,
        CONSTRAINT "PK_toeic_speaking_sets_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_toeic_speaking_sets_code" UNIQUE ("code"),
        CONSTRAINT "fk_toeic_speaking_sets_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_toeic_speaking_sets_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_speaking_sets_level" ON "toeic_speaking_sets" ("level")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_speaking_sets_status" ON "toeic_speaking_sets" ("status")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "toeic_speaking_set_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_by" uuid,
        "set_id" uuid NOT NULL,
        "task_id" uuid NOT NULL,
        "task_type" "toeic_speaking_task_type" NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_toeic_speaking_set_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_toeic_speaking_set_items_set_task" UNIQUE ("set_id", "task_id"),
        CONSTRAINT "fk_toeic_speaking_set_items_set_id" FOREIGN KEY ("set_id") REFERENCES "toeic_speaking_sets"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_toeic_speaking_set_items_task_id" FOREIGN KEY ("task_id") REFERENCES "toeic_speaking_tasks"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_speaking_set_items_set_id" ON "toeic_speaking_set_items" ("set_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_toeic_speaking_set_items_task_type" ON "toeic_speaking_set_items" ("task_type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_speaking_set_items_task_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_speaking_set_items_set_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "toeic_speaking_set_items"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_speaking_sets_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_toeic_speaking_sets_level"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "toeic_speaking_sets"`);
  }
}

