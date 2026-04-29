import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandToeicSpeakingTaskTypeEnum1761860000002
  implements MigrationInterface
{
  name = 'ExpandToeicSpeakingTaskTypeEnum1761860000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Postgres: add enum values (order doesn't matter for our usage)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'toeic_speaking_task_type') THEN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'toeic_speaking_task_type' AND e.enumlabel = 'respond_using_info'
          ) THEN
            ALTER TYPE "toeic_speaking_task_type" ADD VALUE 'respond_using_info';
          END IF;

          IF NOT EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'toeic_speaking_task_type' AND e.enumlabel = 'respond_to_question'
          ) THEN
            ALTER TYPE "toeic_speaking_task_type" ADD VALUE 'respond_to_question';
          END IF;
        END IF;
      END$$;
    `);
  }

  public async down(): Promise<void> {
    // Enum value removal is not safely supported in Postgres without recreating type.
  }
}

