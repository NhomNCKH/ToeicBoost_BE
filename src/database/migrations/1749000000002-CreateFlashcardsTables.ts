import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFlashcardsTables1749000000002 implements MigrationInterface {
  name = 'CreateFlashcardsTables1749000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flashcard_decks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" character varying(1000),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_flashcard_decks_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_flashcard_decks_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_decks_user_id" ON "flashcard_decks" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_decks_title" ON "flashcard_decks" ("title")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_decks_deleted_at" ON "flashcard_decks" ("deleted_at")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flashcards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deck_id" uuid NOT NULL,
        "front" text NOT NULL,
        "back" text NOT NULL,
        "note" text,
        "tags" text[],
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_flashcards_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_flashcards_deck_id" FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcards_deck_id" ON "flashcards" ("deck_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcards_deleted_at" ON "flashcards" ("deleted_at")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flashcard_progress" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "flashcard_id" uuid NOT NULL,
        "due_at" TIMESTAMPTZ,
        "state" character varying(20) NOT NULL DEFAULT 'new',
        "interval_days" integer NOT NULL DEFAULT 0,
        "ease_factor" numeric(6,2) NOT NULL DEFAULT 2.5,
        "reps" integer NOT NULL DEFAULT 0,
        "lapses" integer NOT NULL DEFAULT 0,
        "last_reviewed_at" TIMESTAMPTZ,
        "stability" numeric(10,4),
        "difficulty" numeric(10,4),
        "suspended" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_flashcard_progress_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_flashcard_progress_user_flashcard" UNIQUE ("user_id", "flashcard_id"),
        CONSTRAINT "fk_flashcard_progress_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_flashcard_progress_flashcard_id" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_progress_user_id" ON "flashcard_progress" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_progress_flashcard_id" ON "flashcard_progress" ("flashcard_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_progress_due_at" ON "flashcard_progress" ("due_at")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "flashcard_review_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "flashcard_id" uuid NOT NULL,
        "rating" character varying(10) NOT NULL,
        "previous_due_at" TIMESTAMPTZ,
        "next_due_at" TIMESTAMPTZ,
        "time_ms" integer,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_flashcard_review_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_flashcard_review_logs_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_flashcard_review_logs_flashcard_id" FOREIGN KEY ("flashcard_id") REFERENCES "flashcards"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_review_logs_user_id" ON "flashcard_review_logs" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_review_logs_flashcard_id" ON "flashcard_review_logs" ("flashcard_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_flashcard_review_logs_created_at" ON "flashcard_review_logs" ("created_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_review_logs_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_review_logs_flashcard_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_review_logs_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flashcard_review_logs"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_progress_due_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_progress_flashcard_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_progress_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flashcard_progress"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcards_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcards_deck_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flashcards"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_decks_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_decks_title"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_flashcard_decks_user_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "flashcard_decks"`);
  }
}

