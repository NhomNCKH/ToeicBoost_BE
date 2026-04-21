import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExamDateToExamTemplates1749101100000
  implements MigrationInterface
{
  name = 'AddExamDateToExamTemplates1749101100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "exam_templates"
      ADD COLUMN IF NOT EXISTS "exam_date" TIMESTAMPTZ
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_exam_templates_exam_date"
      ON "exam_templates" ("exam_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_exam_templates_exam_date"`);
    await queryRunner.query(`
      ALTER TABLE "exam_templates"
      DROP COLUMN IF EXISTS "exam_date"
    `);
  }
}

