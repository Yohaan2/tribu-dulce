import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileLifecycle1785338356603 implements MigrationInterface {
  name = 'AddProfileLifecycle1785338356603';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "profiles" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true');
    await queryRunner.query('ALTER TABLE "profiles" ADD COLUMN "deleted_at" TIMESTAMP WITH TIME ZONE');
    await queryRunner.query('CREATE INDEX "IDX_profiles_role_active" ON "profiles" ("role", "is_active")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_profiles_role_active"');
    await queryRunner.query('ALTER TABLE "profiles" DROP COLUMN "deleted_at"');
    await queryRunner.query('ALTER TABLE "profiles" DROP COLUMN "is_active"');
  }
}
