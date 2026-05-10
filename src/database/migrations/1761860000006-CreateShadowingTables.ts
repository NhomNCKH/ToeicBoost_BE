import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShadowingTables1761860000006 implements MigrationInterface {
  name = 'CreateShadowingTables1761860000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shadowing_contents" (
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
        CONSTRAINT "PK_shadowing_contents_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_shadowing_contents_youtubeId" UNIQUE ("youtubeId")
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shadowing_contents_title" ON "shadowing_contents" ("title");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shadowing_contents_level" ON "shadowing_contents" ("level");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shadowing_contents_status" ON "shadowing_contents" ("status");`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "shadowing_segments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "contentId" uuid NOT NULL,
        "order" integer NOT NULL,
        "startSec" integer NOT NULL,
        "endSec" integer NOT NULL,
        "textEn" text NOT NULL,
        "textVi" text,
        "ipa" text,
        CONSTRAINT "PK_shadowing_segments_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_shadowing_segments_content" FOREIGN KEY ("contentId") REFERENCES "shadowing_contents"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shadowing_segments_contentId" ON "shadowing_segments" ("contentId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_shadowing_segments_order" ON "shadowing_segments" ("order");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "shadowing_segments";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "shadowing_contents";`);
  }
}

