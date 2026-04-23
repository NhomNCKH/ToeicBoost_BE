import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatarS3Key1749000000001 implements MigrationInterface {
  name = 'AddUserAvatarS3Key1749000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "avatar_s3_key" character varying(600)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "avatar_s3_key"
    `);
  }
}

