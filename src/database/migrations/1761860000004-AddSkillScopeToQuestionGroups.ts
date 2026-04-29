import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkillScopeToQuestionGroups1761860000004
  implements MigrationInterface
{
  name = 'AddSkillScopeToQuestionGroups1761860000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "question_groups"
      ADD COLUMN IF NOT EXISTS "skill_scope" character varying(30) NOT NULL DEFAULT 'listening_reading'
    `);

    await queryRunner.query(`
      UPDATE "question_groups" qg
      SET "skill_scope" = CASE
        WHEN
          EXISTS (
            SELECT 1
            FROM "questions" q
            WHERE q."question_group_id" = qg."id"
          )
          AND NOT EXISTS (
            SELECT 1
            FROM "questions" q_bad
            WHERE q_bad."question_group_id" = qg."id"
              AND (
                SELECT COUNT(1)
                FROM "question_options" qo
                WHERE qo."question_id" = q_bad."id"
              ) < 2
          )
          AND (
            qg."part" NOT IN ('P1','P2','P3','P4')
            OR EXISTS (
              SELECT 1
              FROM "question_group_assets" qga
              WHERE qga."question_group_id" = qg."id"
                AND qga."kind" IN ('audio','transcript')
            )
          )
        THEN 'listening_reading'
        ELSE 'other_skills'
      END
      WHERE qg."deleted_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_question_groups_skill_scope"
      ON "question_groups" ("skill_scope")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_question_groups_skill_scope"`,
    );
    await queryRunner.query(`
      ALTER TABLE "question_groups"
      DROP COLUMN IF EXISTS "skill_scope"
    `);
  }
}

