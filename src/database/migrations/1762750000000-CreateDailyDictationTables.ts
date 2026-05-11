import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDailyDictationTables1762750000000 implements MigrationInterface {
  name = 'CreateDailyDictationTables1762750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "daily_dictation_contents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "youtubeId" character varying(32) NOT NULL,
        "thumbnailUrl" character varying(500),
        "durationSec" integer NOT NULL DEFAULT 0,
        "level" character varying(8) NOT NULL DEFAULT 'A1',
        "topics" jsonb NOT NULL DEFAULT '[]',
        "status" character varying(16) NOT NULL DEFAULT 'draft',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_daily_dictation_contents_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_daily_dictation_contents_youtubeId" UNIQUE ("youtubeId")
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_daily_dictation_contents_title" ON "daily_dictation_contents" ("title");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_daily_dictation_contents_level" ON "daily_dictation_contents" ("level");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_daily_dictation_contents_status" ON "daily_dictation_contents" ("status");`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "daily_dictation_segments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contentId" uuid NOT NULL,
        "order" integer NOT NULL,
        "startSec" integer NOT NULL,
        "endSec" integer NOT NULL,
        "textEn" text NOT NULL,
        "textVi" text,
        "ipa" text,
        CONSTRAINT "PK_daily_dictation_segments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_daily_dictation_segments_content" FOREIGN KEY ("contentId") REFERENCES "daily_dictation_contents"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_daily_dictation_segments_contentId" ON "daily_dictation_segments" ("contentId");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_daily_dictation_segments_order" ON "daily_dictation_segments" ("order");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_dictation_segments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "daily_dictation_contents";`);
  }
}
