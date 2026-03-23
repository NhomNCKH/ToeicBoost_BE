import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminQuestionBankAndExamTemplateTables1742810000000 implements MigrationInterface {
  name = 'CreateAdminQuestionBankAndExamTemplateTables1742810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_part') THEN
          CREATE TYPE "question_part" AS ENUM ('P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_level') THEN
          CREATE TYPE "question_level" AS ENUM ('easy', 'medium', 'hard', 'expert');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_group_status') THEN
          CREATE TYPE "question_group_status" AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_kind') THEN
          CREATE TYPE "asset_kind" AS ENUM ('image', 'audio', 'passage', 'transcript');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_mode') THEN
          CREATE TYPE "template_mode" AS ENUM ('practice', 'mock_test', 'official_exam');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_status') THEN
          CREATE TYPE "template_status" AS ENUM ('draft', 'published', 'archived');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_item_mode') THEN
          CREATE TYPE "template_item_mode" AS ENUM ('manual', 'rule_based');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tags" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "category" character varying(50) NOT NULL,
        "code" character varying(100) NOT NULL,
        "label" character varying(255) NOT NULL,
        "description" text,
        CONSTRAINT "PK_tags_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_tags_code" UNIQUE ("code")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_tags_category" ON "tags" ("category")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "code" character varying(50) NOT NULL,
        "title" character varying(255) NOT NULL,
        "part" "question_part" NOT NULL,
        "level" "question_level" NOT NULL,
        "status" "question_group_status" NOT NULL DEFAULT 'draft',
        "stem" text,
        "explanation" text,
        "source_type" character varying(30) NOT NULL DEFAULT 'manual',
        "source_ref" character varying(255),
        "published_at" TIMESTAMPTZ,
        "deleted_at" TIMESTAMPTZ,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_by" uuid NOT NULL,
        "updated_by" uuid,
        "reviewed_by" uuid,
        CONSTRAINT "PK_question_groups_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_question_groups_code" UNIQUE ("code"),
        CONSTRAINT "fk_question_groups_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_question_groups_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_question_groups_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_groups_part" ON "question_groups" ("part")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_groups_level" ON "question_groups" ("level")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_groups_status" ON "question_groups" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_groups_created_by" ON "question_groups" ("created_by")`,
    );
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_question_groups_metadata" ON "question_groups" USING GIN ("metadata")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_group_assets" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "question_group_id" uuid NOT NULL,
        "kind" "asset_kind" NOT NULL,
        "storage_key" character varying(500) NOT NULL,
        "public_url" character varying(1000),
        "mime_type" character varying(100),
        "duration_sec" integer,
        "sort_order" integer NOT NULL DEFAULT 0,
        "content_text" text,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_question_group_assets_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_question_group_assets_group_id" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_group_assets_group_id" ON "question_group_assets" ("question_group_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_group_assets_kind" ON "question_group_assets" ("kind")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "questions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "question_group_id" uuid NOT NULL,
        "question_no" integer NOT NULL,
        "prompt" text NOT NULL,
        "answer_key" character varying(10) NOT NULL,
        "rationale" text,
        "time_limit_sec" integer,
        "score_weight" numeric(6,2) NOT NULL DEFAULT 1,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_questions_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_questions_group_question_no" UNIQUE ("question_group_id", "question_no"),
        CONSTRAINT "fk_questions_group_id" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_questions_group_id" ON "questions" ("question_group_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_options" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "question_id" uuid NOT NULL,
        "option_key" character varying(10) NOT NULL,
        "content" text NOT NULL,
        "is_correct" boolean NOT NULL DEFAULT false,
        "sort_order" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_question_options_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_question_options_question_option_key" UNIQUE ("question_id", "option_key"),
        CONSTRAINT "fk_question_options_question_id" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_options_question_id" ON "question_options" ("question_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_group_tags" (
        "question_group_id" uuid NOT NULL,
        "tag_id" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_question_group_tags" PRIMARY KEY ("question_group_id", "tag_id"),
        CONSTRAINT "fk_question_group_tags_group_id" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_question_group_tags_tag_id" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "question_group_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "question_group_id" uuid NOT NULL,
        "action" character varying(30) NOT NULL,
        "comment" text,
        "performed_by" uuid NOT NULL,
        CONSTRAINT "PK_question_group_reviews_id" PRIMARY KEY ("id"),
        CONSTRAINT "fk_question_group_reviews_group_id" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_question_group_reviews_performed_by" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_question_group_reviews_group_id" ON "question_group_reviews" ("question_group_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_templates" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "mode" "template_mode" NOT NULL,
        "status" "template_status" NOT NULL DEFAULT 'draft',
        "total_duration_sec" integer NOT NULL,
        "total_questions" integer NOT NULL,
        "instructions" text,
        "shuffle_question_order" boolean NOT NULL DEFAULT false,
        "shuffle_option_order" boolean NOT NULL DEFAULT false,
        "published_at" TIMESTAMPTZ,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_by" uuid NOT NULL,
        "updated_by" uuid,
        CONSTRAINT "PK_exam_templates_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_exam_templates_code" UNIQUE ("code"),
        CONSTRAINT "fk_exam_templates_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_exam_templates_updated_by" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_exam_templates_mode" ON "exam_templates" ("mode")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_exam_templates_status" ON "exam_templates" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_exam_templates_created_by" ON "exam_templates" ("created_by")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_template_sections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "exam_template_id" uuid NOT NULL,
        "part" "question_part" NOT NULL,
        "section_order" integer NOT NULL,
        "expected_group_count" integer NOT NULL,
        "expected_question_count" integer NOT NULL,
        "duration_sec" integer,
        "instructions" text,
        CONSTRAINT "PK_exam_template_sections_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_exam_template_sections_template_part" UNIQUE ("exam_template_id", "part"),
        CONSTRAINT "fk_exam_template_sections_template_id" FOREIGN KEY ("exam_template_id") REFERENCES "exam_templates"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_exam_template_sections_template_id" ON "exam_template_sections" ("exam_template_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_template_rules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "exam_template_id" uuid NOT NULL,
        "part" "question_part" NOT NULL,
        "level_distribution" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "required_tag_codes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "excluded_tag_codes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "question_count" integer NOT NULL,
        "group_count" integer,
        CONSTRAINT "PK_exam_template_rules_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_exam_template_rules_template_part" UNIQUE ("exam_template_id", "part"),
        CONSTRAINT "fk_exam_template_rules_template_id" FOREIGN KEY ("exam_template_id") REFERENCES "exam_templates"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_exam_template_rules_template_id" ON "exam_template_rules" ("exam_template_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exam_template_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "exam_template_id" uuid NOT NULL,
        "section_id" uuid NOT NULL,
        "question_group_id" uuid NOT NULL,
        "source_mode" "template_item_mode" NOT NULL,
        "display_order" integer NOT NULL,
        "locked" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_exam_template_items_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_exam_template_items_template_group" UNIQUE ("exam_template_id", "question_group_id"),
        CONSTRAINT "uq_exam_template_items_template_display_order" UNIQUE ("exam_template_id", "display_order"),
        CONSTRAINT "fk_exam_template_items_template_id" FOREIGN KEY ("exam_template_id") REFERENCES "exam_templates"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_exam_template_items_section_id" FOREIGN KEY ("section_id") REFERENCES "exam_template_sections"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_exam_template_items_group_id" FOREIGN KEY ("question_group_id") REFERENCES "question_groups"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_exam_template_items_template_id" ON "exam_template_items" ("exam_template_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_exam_template_items_section_id" ON "exam_template_items" ("section_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_exam_template_items_section_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_exam_template_items_template_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_template_items"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_exam_template_rules_template_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_template_rules"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_exam_template_sections_template_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_template_sections"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_exam_templates_created_by"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_exam_templates_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_exam_templates_mode"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "exam_templates"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_group_reviews_group_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "question_group_reviews"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "question_group_tags"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_options_question_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "question_options"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_questions_group_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "questions"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_group_assets_kind"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_group_assets_group_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "question_group_assets"`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_groups_metadata"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_groups_created_by"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_groups_status"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_question_groups_level"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_question_groups_part"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "question_groups"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_tags_category"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "template_item_mode"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "template_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "template_mode"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "asset_kind"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "question_group_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "question_level"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "question_part"`);
  }
}
