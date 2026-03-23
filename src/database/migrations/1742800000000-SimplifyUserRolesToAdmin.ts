import { MigrationInterface, QueryRunner } from 'typeorm';

export class SimplifyUserRolesToAdmin1742800000000 implements MigrationInterface {
  name = 'SimplifyUserRolesToAdmin1742800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "user_role" RENAME TO "user_role_old"`);

    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('superadmin', 'admin', 'learner')
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "user_role"
      USING (
        CASE
          WHEN "role"::text = 'admin' THEN 'superadmin'
          WHEN "role"::text = 'learner' THEN 'learner'
          ELSE 'admin'
        END
      )::"user_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'learner'
    `);

    await queryRunner.query(`DROP TYPE "user_role_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "user_role" RENAME TO "user_role_new"`);

    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM (
        'admin',
        'org_admin',
        'instructor',
        'curator',
        'learner'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "user_role"
      USING (
        CASE
          WHEN "role"::text = 'superadmin' THEN 'admin'
          WHEN "role"::text = 'admin' THEN 'org_admin'
          ELSE 'learner'
        END
      )::"user_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'learner'
    `);

    await queryRunner.query(`DROP TYPE "user_role_new"`);
  }
}
