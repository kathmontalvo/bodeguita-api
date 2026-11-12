import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateProductHandler } from './application/create-product/create-product.handler';
import { ListProductsHandler } from './application/list-products/list-products.handler';
import { PRODUCT_REPOSITORY } from './domain/ports/product.repository';
import { ProductsController } from './infrastructure/http/products.controller';
import { DecreaseStockOnOrderPlaced } from './infrastructure/listeners/decrease-stock-on-order-placed.listener';
import { ProductOrmEntity } from './infrastructure/persistence/product.orm-entity';
import { TypeOrmProductRepository } from './infrastructure/persistence/typeorm-product.repository';

@Module({
  // Registra Repository<ProductOrmEntity> para @InjectRepository.
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  controllers: [ProductsController],
  providers: [
    CreateProductHandler,
    ListProductsHandler,
    // Escucha OrderPlaced y descuenta stock.
    DecreaseStockOnOrderPlaced,
    // Puerto - adaptador: quien pida PRODUCT_REPOSITORY recibe el de TypeORM.
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class ProductsModule {}
