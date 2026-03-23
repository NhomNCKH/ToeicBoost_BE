import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLearnerRoleToExistingUserRole1742840000000 implements MigrationInterface {
  name = 'AddLearnerRoleToExistingUserRole1742840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "user_role" RENAME TO "user_role_old"`);

    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('superadmin', 'admin', 'learner')
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_invites"
      ALTER COLUMN "role" TYPE "user_role"
      USING ("role"::text::"user_role")
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "user_role"
      USING ("role"::text::"user_role")
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'learner'
    `);

    await queryRunner.query(`DROP TYPE "user_role_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" DROP DEFAULT
    `);

    await queryRunner.query(`ALTER TYPE "user_role" RENAME TO "user_role_old"`);

    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('superadmin', 'admin')
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" TYPE "user_role"
      USING (
        CASE
          WHEN "role"::text = 'learner' THEN 'admin'
          ELSE "role"::text
        END
      )::"user_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_invites"
      ALTER COLUMN "role" TYPE "user_role"
      USING (
        CASE
          WHEN "role"::text = 'learner' THEN 'admin'
          ELSE "role"::text
        END
      )::"user_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "role" SET DEFAULT 'admin'
    `);

    await queryRunner.query(`DROP TYPE "user_role_old"`);
  }
}
