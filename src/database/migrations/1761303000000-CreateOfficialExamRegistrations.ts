import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOfficialExamRegistrations1761303000000
  implements MigrationInterface
{
  name = 'CreateOfficialExamRegistrations1761303000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "official_exam_registrations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        "created_by_id" uuid,
        "updated_by_id" uuid,

        "user_id" uuid NOT NULL,
        "exam_template_id" uuid NOT NULL,
        "status" varchar(20) NOT NULL DEFAULT 'registered',
        "exam_date" timestamptz NOT NULL,
        "registered_at" timestamptz NOT NULL,
        "confirmation_sent_at" timestamptz,
        "reminder_sent_at" timestamptz,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,

        CONSTRAINT "pk_official_exam_registrations_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_official_exam_registrations_user_template" UNIQUE ("user_id","exam_template_id"),
        CONSTRAINT "fk_official_exam_registrations_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT "fk_official_exam_registrations_exam_template" FOREIGN KEY ("exam_template_id") REFERENCES "exam_templates"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_official_exam_registrations_user_id"
      ON "official_exam_registrations" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_official_exam_registrations_exam_template_id"
      ON "official_exam_registrations" ("exam_template_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_official_exam_registrations_exam_date"
      ON "official_exam_registrations" ("exam_date")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_official_exam_registrations_status"
      ON "official_exam_registrations" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "official_exam_registrations"`,
    );
  }
}

