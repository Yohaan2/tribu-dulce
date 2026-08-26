import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTotalCostToPredictionItems1785338356601 implements MigrationInterface {
    name = 'AddTotalCostToPredictionItems1785338356601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "prediction_items" 
            ADD COLUMN IF NOT EXISTS "total_cost" numeric(10,2) NOT NULL DEFAULT '0'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "prediction_items" 
            DROP COLUMN IF EXISTS "total_cost"
        `);
    }
}
