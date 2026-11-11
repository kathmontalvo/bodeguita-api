import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1794411662086 implements MigrationInterface {
  name = 'CreateProducts1794411662086';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL, "sku" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "price_cents" integer NOT NULL, "stock" integer NOT NULL, CONSTRAINT "UQ_products_sku" UNIQUE ("sku"), CONSTRAINT "CHK_products_stock_non_negative" CHECK ("stock" >= 0), CONSTRAINT "CHK_products_price_cents_positive" CHECK ("price_cents" > 0), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "products"`);
  }
}
