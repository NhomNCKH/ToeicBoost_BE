import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPronunciationToVocabularyItems1749100900000 implements MigrationInterface {
  name = 'AddPronunciationToVocabularyItems1749100900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vocabulary_items"
      ADD COLUMN IF NOT EXISTS "pronunciation" character varying(200)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vocabulary_items" DROP COLUMN IF EXISTS "pronunciation"
    `);
  }
}
