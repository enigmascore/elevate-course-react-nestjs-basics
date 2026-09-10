import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * The whole base schema in one migration. A new table added later ( for
 * example by the graded task ) gets its OWN migration - generate it with
 *   pnpm migration:generate src/database/migrations/<Name>
 * and run it with
 *   pnpm migration:run
 */
export class InitialSchema1757500000000 implements MigrationInterface {
  name = "InitialSchema1757500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('USER', 'ADMIN')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"            character varying NOT NULL,
        "password_hash"    character varying NOT NULL,
        "first_name"       character varying NOT NULL,
        "last_name"        character varying NOT NULL,
        "role"             "user_role" NOT NULL DEFAULT 'USER',
        "activated"        boolean NOT NULL DEFAULT false,
        "activation_token" uuid,
        "created_at"       timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "uq_users_activation_token" UNIQUE ("activation_token")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "interests" (
        "id"   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        CONSTRAINT "uq_interests_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_interests" (
        "user_id"     uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "interest_id" uuid NOT NULL REFERENCES "interests" ("id") ON DELETE CASCADE,
        CONSTRAINT "pk_user_interests" PRIMARY KEY ("user_id", "interest_id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_user_interests_interest" ON "user_interests" ("interest_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "posts" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title"      character varying(200) NOT NULL,
        "body"       text NOT NULL,
        "author_id"  uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "ix_posts_author" ON "posts" ("author_id")`);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "token"      uuid NOT NULL,
        "user_id"    uuid NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_refresh_tokens_token" UNIQUE ("token")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "posts"`);
    await queryRunner.query(`DROP TABLE "user_interests"`);
    await queryRunner.query(`DROP TABLE "interests"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
  }
}
