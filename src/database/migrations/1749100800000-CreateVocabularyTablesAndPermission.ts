import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVocabularyTablesAndPermission1749100800000 implements MigrationInterface {
  name = 'CreateVocabularyTablesAndPermission1749100800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vocabulary_decks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" character varying(200) NOT NULL,
        "cefr_level" character varying(10) NOT NULL,
        "description" text,
        "published" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_vocabulary_decks_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vocabulary_decks_cefr_level" ON "vocabulary_decks" ("cefr_level")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vocabulary_decks_published" ON "vocabulary_decks" ("published")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vocabulary_decks_deleted_at" ON "vocabulary_decks" ("deleted_at")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vocabulary_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deck_id" uuid NOT NULL,
        "word" character varying(200) NOT NULL,
        "word_type" character varying(50) NOT NULL,
        "meaning" text NOT NULL,
        "example_sentence" text NOT NULL,
        "sort_order" integer NOT NULL DEFAULT 0,
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_vocabulary_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_vocabulary_items_deck_id" FOREIGN KEY ("deck_id") REFERENCES "vocabulary_decks"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vocabulary_items_deck_id" ON "vocabulary_items" ("deck_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_vocabulary_items_deleted_at" ON "vocabulary_items" ("deleted_at")
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "module", "description")
      VALUES
        ('vocabulary.manage', 'Quản lý bộ từ vựng (admin)', 'vocabulary', 'Tạo/sửa/xuất bản bộ từ theo cấp độ CEFR')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("created_by", "role_id", "permission_id")
      SELECT NULL, r."id", p."id"
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE p."code" = 'vocabulary.manage'
        AND r."code" IN ('superadmin', 'admin')
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (SELECT "id" FROM "permissions" WHERE "code" = 'vocabulary.manage')
    `);
    await queryRunner.query(`
      DELETE FROM "permissions" WHERE "code" = 'vocabulary.manage'
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vocabulary_items_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vocabulary_items_deck_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vocabulary_items"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vocabulary_decks_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vocabulary_decks_published"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_vocabulary_decks_cefr_level"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vocabulary_decks"`);
  }
}
