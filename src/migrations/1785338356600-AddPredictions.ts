import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPredictions1785338356600 implements MigrationInterface {
    name = 'AddPredictions1785338356600'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "predictions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "status" character varying NOT NULL DEFAULT 'ACTIVE',
                "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "finished_at" TIMESTAMP WITH TIME ZONE,
                "notes" text,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_predictions_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "prediction_items" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "prediction_id" uuid NOT NULL,
                "product_id" uuid NOT NULL,
                "estimated_quantity" integer NOT NULL,
                "unit_price" numeric(10,2) NOT NULL DEFAULT '0',
                "unit_cost" numeric(10,2) NOT NULL DEFAULT '0',
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_prediction_items_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "prediction_items" 
            ADD CONSTRAINT "FK_prediction_items_prediction" 
            FOREIGN KEY ("prediction_id") REFERENCES "predictions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "prediction_items" 
            ADD CONSTRAINT "FK_prediction_items_product" 
            FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_predictions_status" ON "predictions"("status")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_prediction_items_prediction_id" ON "prediction_items"("prediction_id")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_prediction_items_product_id" ON "prediction_items"("product_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "prediction_items" DROP CONSTRAINT "FK_prediction_items_product"`);
        await queryRunner.query(`ALTER TABLE "prediction_items" DROP CONSTRAINT "FK_prediction_items_prediction"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "prediction_items"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "predictions"`);
    }
}
