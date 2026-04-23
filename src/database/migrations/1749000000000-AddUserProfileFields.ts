import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1749000000000 implements MigrationInterface {
  name = 'AddUserProfileFields1749000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "phone" character varying(30),
      ADD COLUMN IF NOT EXISTS "birthday" date,
      ADD COLUMN IF NOT EXISTS "address" character varying(255),
      ADD COLUMN IF NOT EXISTS "bio" text,
      ADD COLUMN IF NOT EXISTS "linkedin" character varying(255),
      ADD COLUMN IF NOT EXISTS "github" character varying(255),
      ADD COLUMN IF NOT EXISTS "twitter" character varying(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "twitter",
      DROP COLUMN IF EXISTS "github",
      DROP COLUMN IF EXISTS "linkedin",
      DROP COLUMN IF EXISTS "bio",
      DROP COLUMN IF EXISTS "address",
      DROP COLUMN IF EXISTS "birthday",
      DROP COLUMN IF EXISTS "phone"
    `);
  }
}

