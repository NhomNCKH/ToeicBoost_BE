import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimiTable1761860000007 implements MigrationInterface {
  name = 'CreateTimiTable1761860000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "timi_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid NULL,
        "user_id" uuid NOT NULL,
        "persona" character varying(32) NOT NULL DEFAULT 'casual',
        "title" character varying(255) NULL,
        "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "ended_at" TIMESTAMPTZ NULL,
        "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_timi_sessions_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_timi_sessions_user_id" ON "timi_sessions" ("user_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_timi_sessions_last_active_at" ON "timi_sessions" ("last_active_at");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "timi_turns" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid NULL,
        "session_id" uuid NOT NULL,
        "role" character varying(16) NOT NULL,
        "transcript" text NOT NULL DEFAULT '',
        "next_prompt" text NULL,
        "micro_correction" jsonb NULL,
        "model_id" character varying(128) NULL,
        "voice_id" character varying(64) NULL,
        "latency_ms" integer NOT NULL DEFAULT 0,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_timi_turns_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_timi_turns_session" FOREIGN KEY ("session_id") REFERENCES "timi_sessions"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_timi_turns_session_id" ON "timi_turns" ("session_id");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_timi_turns_created_at" ON "timi_turns" ("created_at");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "timi_turns";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "timi_sessions";`);
  }
}
