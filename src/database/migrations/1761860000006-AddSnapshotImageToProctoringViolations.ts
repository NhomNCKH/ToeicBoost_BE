import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSnapshotImageToProctoringViolations1761860000006
  implements MigrationInterface
{
  name = 'AddSnapshotImageToProctoringViolations1761860000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "proctoring_violations"
      ADD COLUMN IF NOT EXISTS "screenshot_url" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "proctoring_violations"
      DROP COLUMN IF EXISTS "screenshot_url"
    `);
  }
}
