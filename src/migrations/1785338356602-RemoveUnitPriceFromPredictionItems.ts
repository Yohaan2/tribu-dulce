import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUnitPriceFromPredictionItems1785338356602 implements MigrationInterface {
    name = 'RemoveUnitPriceFromPredictionItems1785338356602'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "prediction_items"
            DROP COLUMN IF EXISTS "unit_price"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "prediction_items"
            ADD COLUMN IF NOT EXISTS "unit_price" numeric(10,2) NOT NULL DEFAULT '0'
        `);
    }
}
