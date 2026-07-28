import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthToProfiles1782507006095 implements MigrationInterface {
    name = 'AddAuthToProfiles1782507006095'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Añadir columnas de email y password_hash si no existen en profiles
        await queryRunner.query(`
            ALTER TABLE "profiles" 
            ADD COLUMN IF NOT EXISTS "email" character varying,
            ADD COLUMN IF NOT EXISTS "password_hash" character varying
        `);

        // Si ya existen perfiles, se les puede dar valores por defecto temporales o nulos
        // Pero como se requiere NOT NULL, si ya hay registros, les pondremos valores vacíos antes de aplicar el NOT NULL
        // (Esto es una buena práctica para evitar que falle si ya hay usuarios creados)
        await queryRunner.query(`
            UPDATE "profiles" 
            SET "email" = "id"::text || '@placeholder.com' 
            WHERE "email" IS NULL
        `);

        await queryRunner.query(`
            UPDATE "profiles" 
            SET "password_hash" = '$2a$10$PlaceholderPasswordHashPlaceholderPasswordHashPlaceholder' 
            WHERE "password_hash" IS NULL
        `);

        // Ahora forzar NOT NULL y UNIQUE
        await queryRunner.query(`
            ALTER TABLE "profiles" 
            ALTER COLUMN "email" SET NOT NULL,
            ALTER COLUMN "password_hash" SET NOT NULL,
            ADD CONSTRAINT "UQ_profiles_email" UNIQUE ("email")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profiles" DROP CONSTRAINT "UQ_profiles_email"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "password_hash"`);
        await queryRunner.query(`ALTER TABLE "profiles" DROP COLUMN "email"`);
    }
}
