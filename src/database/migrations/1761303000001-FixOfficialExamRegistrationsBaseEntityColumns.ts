import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixOfficialExamRegistrationsBaseEntityColumns1761303000001
  implements MigrationInterface
{
  name = 'FixOfficialExamRegistrationsBaseEntityColumns1761303000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "official_exam_registrations"
      ADD COLUMN IF NOT EXISTS "created_by" uuid
    `);

    // Backfill from old column if it exists (created_by_id was mistakenly used)
    await queryRunner.query(`
      UPDATE "official_exam_registrations"
      SET "created_by" = "created_by_id"
      WHERE "created_by" IS NULL
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'official_exam_registrations'
            AND column_name = 'created_by_id'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "official_exam_registrations"
      DROP COLUMN IF EXISTS "created_by"
    `);
  }
}

