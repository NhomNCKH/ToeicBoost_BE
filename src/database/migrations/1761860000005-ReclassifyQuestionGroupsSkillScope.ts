import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReclassifyQuestionGroupsSkillScope1761860000005
  implements MigrationInterface
{
  name = 'ReclassifyQuestionGroupsSkillScope1761860000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "question_groups" qg
      SET "skill_scope" = CASE
        WHEN (
          lower(COALESCE(qg."source_ref", '')) ~ '(speaking|writing)'
          OR lower(COALESCE(qg."source_type", '')) ~ '(speaking|writing)'
          OR lower(COALESCE(qg."metadata"::text, '')) ~ '(toeic-speaking|toeic-writing)'
          OR lower(COALESCE(qg."metadata"::text, '')) ~ '\"skill\"\\s*:\\s*\"speaking\"'
          OR lower(COALESCE(qg."metadata"::text, '')) ~ '\"skill\"\\s*:\\s*\"writing\"'
        ) THEN 'other_skills'
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
        THEN 'listening_reading'
        ELSE 'other_skills'
      END
      WHERE qg."deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "question_groups"
      SET "skill_scope" = 'listening_reading'
      WHERE "deleted_at" IS NULL
    `);
  }
}

