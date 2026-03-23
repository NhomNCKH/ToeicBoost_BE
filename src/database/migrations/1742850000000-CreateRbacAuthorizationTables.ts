import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRbacAuthorizationTables1742850000000 implements MigrationInterface {
  name = 'CreateRbacAuthorizationTables1742850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "code" character varying(50) NOT NULL,
        "name" character varying(100) NOT NULL,
        "description" text,
        "is_system" boolean NOT NULL DEFAULT false,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_roles_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_roles_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "code" character varying(100) NOT NULL,
        "name" character varying(150) NOT NULL,
        "module" character varying(100),
        "description" text,
        "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT "PK_permissions_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_permissions_code" UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_roles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "role_id" uuid NOT NULL,
        CONSTRAINT "PK_user_roles_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_user_roles_user_role" UNIQUE ("user_id", "role_id"),
        CONSTRAINT "fk_user_roles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_roles_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_roles_user_id" ON "user_roles" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_roles_role_id" ON "user_roles" ("role_id")
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_by" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "role_id" uuid NOT NULL,
        "permission_id" uuid NOT NULL,
        CONSTRAINT "PK_role_permissions_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_role_permissions_role_permission" UNIQUE ("role_id", "permission_id"),
        CONSTRAINT "fk_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_role_permissions_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_role_permissions_role_id" ON "role_permissions" ("role_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_role_permissions_permission_id" ON "role_permissions" ("permission_id")
    `);

    await queryRunner.query(`
      INSERT INTO "roles" ("code", "name", "description", "is_system")
      VALUES
        ('superadmin', 'Super Admin', 'Toàn quyền hệ thống', true),
        ('admin', 'Admin', 'Quản trị vận hành', true),
        ('learner', 'Learner', 'Người học', true)
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("code", "name", "module")
      VALUES
        ('users.read', 'Xem người dùng', 'rbac'),
        ('users.manage', 'Quản lý người dùng', 'rbac'),
        ('roles.read', 'Xem vai trò', 'rbac'),
        ('roles.manage', 'Quản lý vai trò', 'rbac'),
        ('permissions.read', 'Xem quyền', 'rbac'),
        ('permissions.manage', 'Quản lý quyền', 'rbac'),
        ('questions.manage', 'Quản lý ngân hàng câu hỏi', 'question-bank'),
        ('questions.publish', 'Xuất bản câu hỏi', 'question-bank'),
        ('questions.import', 'Nhập câu hỏi', 'question-bank'),
        ('exam_templates.manage', 'Quản lý mẫu đề thi', 'exam-template'),
        ('credentials.manage', 'Quản lý chứng chỉ', 'credential'),
        ('dashboard.view', 'Xem dashboard', 'dashboard'),
        ('settings.manage', 'Quản lý cài đặt', 'settings'),
        ('audit.view', 'Xem audit log', 'audit')
      ON CONFLICT ("code") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "user_roles" ("created_by", "user_id", "role_id")
      SELECT
        u."created_by",
        u."id",
        r."id"
      FROM "users" u
      INNER JOIN "roles" r
        ON r."code" = CASE
          WHEN u."role"::text = 'superadmin' THEN 'superadmin'
          WHEN u."role"::text = 'admin' THEN 'admin'
          WHEN u."role"::text = 'learner' THEN 'learner'
          WHEN u."role"::text IN ('org_admin', 'instructor', 'curator') THEN 'admin'
          ELSE 'learner'
        END
      ON CONFLICT ("user_id", "role_id") DO NOTHING
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_invites"
      ADD COLUMN IF NOT EXISTS "role_id" uuid
    `);

    await queryRunner.query(`
      UPDATE "admin_invites" ai
      SET "role_id" = r."id"
      FROM "roles" r
      WHERE ai."role_id" IS NULL
        AND r."code" = CASE
          WHEN ai."role"::text = 'superadmin' THEN 'superadmin'
          WHEN ai."role"::text = 'admin' THEN 'admin'
          WHEN ai."role"::text = 'learner' THEN 'learner'
          WHEN ai."role"::text IN ('org_admin', 'instructor', 'curator') THEN 'admin'
          ELSE 'admin'
        END
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_invites"
      DROP CONSTRAINT IF EXISTS "FK_admin_invites_role_id"
    `);
    await queryRunner.query(`
      ALTER TABLE "admin_invites"
      ADD CONSTRAINT "fk_admin_invites_role_id"
      FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_admin_invites_role_id" ON "admin_invites" ("role_id")
    `);

    await queryRunner.query(
      `ALTER TABLE "admin_invites" DROP COLUMN IF EXISTS "role"`,
    );

    await queryRunner.query(`
      UPDATE "permissions"
      SET "description" = COALESCE("description", "name")
      WHERE "description" IS NULL
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("created_by", "role_id", "permission_id")
      SELECT NULL, r."id", p."id"
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r."code" = 'superadmin'
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("created_by", "role_id", "permission_id")
      SELECT NULL, r."id", p."id"
      FROM "roles" r
      INNER JOIN "permissions" p
        ON p."code" IN (
          'users.read',
          'users.manage',
          'questions.manage',
          'questions.publish',
          'questions.import',
          'exam_templates.manage',
          'credentials.manage',
          'dashboard.view',
          'audit.view'
        )
      WHERE r."code" = 'admin'
      ON CONFLICT ("role_id", "permission_id") DO NOTHING
    `);

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_role" AS ENUM ('superadmin', 'admin', 'learner')`,
    );

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "role" "user_role" NOT NULL DEFAULT 'learner'
    `);

    await queryRunner.query(`
      UPDATE "users" u
      SET "role" = COALESCE((
        SELECT r."code"::"user_role"
        FROM "user_roles" ur
        INNER JOIN "roles" r ON r."id" = ur."role_id"
        WHERE ur."user_id" = u."id"
        ORDER BY CASE r."code"
          WHEN 'superadmin' THEN 1
          WHEN 'admin' THEN 2
          ELSE 3
        END
        LIMIT 1
      ), 'learner')
    `);

    await queryRunner.query(`
      ALTER TABLE "admin_invites"
      ADD COLUMN IF NOT EXISTS "role" "user_role"
    `);

    await queryRunner.query(`
      UPDATE "admin_invites" ai
      SET "role" = COALESCE((
        SELECT r."code"::"user_role"
        FROM "roles" r
        WHERE r."id" = ai."role_id"
      ), 'admin')
    `);

    await queryRunner.query(
      `ALTER TABLE "admin_invites" DROP COLUMN IF EXISTS "role_id"`,
    );

    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
  }
}
