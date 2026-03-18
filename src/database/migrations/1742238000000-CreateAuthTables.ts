import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTables1742238000000 implements MigrationInterface {
  name = 'CreateAuthTables1742238000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
          CREATE TYPE "user_role" AS ENUM ('admin', 'org_admin', 'instructor', 'curator', 'learner');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
          CREATE TYPE "user_status" AS ENUM ('pending_verification', 'active', 'suspended', 'deleted');
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255),
        "name" character varying(100) NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'learner',
        "status" "user_status" NOT NULL DEFAULT 'pending_verification',
        "avatar_url" character varying(500),
        "google_id" character varying(255),
        "mfa_enabled" boolean NOT NULL DEFAULT false,
        "failed_login_attempts" integer NOT NULL DEFAULT 0,
        "locked_until" TIMESTAMPTZ,
        "last_login_at" TIMESTAMPTZ,
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_users_google_id"
      ON "users" ("google_id")
      WHERE "google_id" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_status" ON "users" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users" ("role")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "ip_address" character varying(64),
        "user_agent" character varying(512),
        CONSTRAINT "PK_refresh_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "fk_refresh_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_refresh_tokens_expires_at"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_refresh_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_users_google_id"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "user_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }
}
