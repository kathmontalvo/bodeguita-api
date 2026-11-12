import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from '../products/products.module';
import { GetOrderHandler } from './application/get-order/get-order.handler';
import { ListOrdersHandler } from './application/list-orders/list-orders.handler';
import { PlaceOrderHandler } from './application/place-order/place-order.handler';
import { CLOCK } from './domain/ports/clock';
import { ORDER_REPOSITORY } from './domain/ports/order.repository';
import { STOCK_CHECKER } from './domain/ports/stock-checker';
import { SystemClock } from './infrastructure/clock/system.clock';
import { OrdersController } from './infrastructure/http/orders.controller';
import { OrderItemOrmEntity } from './infrastructure/persistence/order-item.orm-entity';
import { OrderOrmEntity } from './infrastructure/persistence/order.orm-entity';
import { TypeOrmOrderRepository } from './infrastructure/persistence/typeorm-order.repository';
import { CatalogStockChecker } from './infrastructure/stock-checker/catalog-stock-checker';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity, OrderItemOrmEntity]),
    // Solo para CatalogStockChecker: trae el PRODUCT_REPOSITORY exportado.
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [
    PlaceOrderHandler,
    GetOrderHandler,
    ListOrdersHandler,
    // Puertos - adaptadores reales.
    { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
    { provide: STOCK_CHECKER, useClass: CatalogStockChecker },
    { provide: CLOCK, useClass: SystemClock },
  ],
})
export class OrdersModule {}
