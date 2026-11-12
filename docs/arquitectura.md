# Arquitectura

Bodeguita es un monolito NestJS organizado con **arquitectura hexagonal**
(puertos y adaptadores), **DDD** y **CQRS**. Tiene dos contextos acotados que
no comparten modelo.

| Contexto | Carpeta | Agregado | Escritura | Lectura |
|---|---|---|---|---|
| Catálogo | `src/products/` | `Product` | `CreateProductCommand`, `UpdateProductCommand` | `ListProductsQuery`, `GetProductQuery` |
| Pedidos | `src/orders/` | `Order` (con `OrderItem`) | `PlaceOrderCommand` | `ListOrdersQuery`, `GetOrderQuery` |

## Capas y regla de dependencias

```
infrastructure  ──▶  application  ──▶  domain
(Nest, TypeORM,       (handlers,         (entidades, value objects,
 HTTP, listeners)      commands,          errores, eventos, puertos)
                       queries)
```

Las flechas apuntan hacia adentro: cada capa solo conoce a la de su derecha.

- **domain/**: TypeScript puro. No importa nada de `@nestjs/*` ni de
  `typeorm`. Define los **puertos** (interfaces + token `Symbol`) que necesita.
- **application/**: un caso de uso por carpeta (`create-product/`,
  `place-order/`…). Los handlers reciben los puertos por inyección y nunca
  conocen una implementación concreta.
- **infrastructure/**: los **adaptadores**. HTTP (controllers y DTOs),
  persistencia (TypeORM), reloj, consulta a otro contexto y listeners.
- **shared/**: `DomainException` (cada error tiene `code` y `kind`) y el filtro
  que la traduce a HTTP (`VALIDATION`→400, `NOT_FOUND`→404, `CONFLICT`→409).

## Puertos y adaptadores

| Puerto (token) | Contexto | Adaptador real | Adaptador de prueba |
|---|---|---|---|
| `ProductRepository` (`PRODUCT_REPOSITORY`) | Catálogo | `TypeOrmProductRepository` | `InMemoryProductRepository` |
| `OrderRepository` (`ORDER_REPOSITORY`) | Pedidos | `TypeOrmOrderRepository` | `InMemoryOrderRepository` |
| `StockChecker` (`STOCK_CHECKER`) | Pedidos | `CatalogStockChecker` | `FakeStockChecker` |
| `Clock` (`CLOCK`) | Pedidos | `SystemClock` | `FixedClock` |

Cada módulo conecta puerto y adaptador con
`{ provide: TOKEN, useClass: Adaptador }`. Los adaptadores de prueba solo se
usan en los tests unitarios.

## Cómo se comunican los contextos

```
POST /orders
   │
   ▼
PlaceOrderHandler ──(1) consulta síncrona──▶ StockChecker ─▶ CatalogStockChecker ─▶ PRODUCT_REPOSITORY
   │                     ¿existe? ¿hay stock? ¿precio?
   │
   ├──(2) orders.save(order)
   │
   └──(3) eventBus.publishAll(order.pullDomainEvents())
                │
                ▼  OrderPlaced { orderId, items, occurredAt }
        DecreaseStockOnOrderPlaced (Catálogo) ─▶ product.decreaseStock() ─▶ save
```

1. **Consulta (antes de decidir).** Pedidos necesita saber si acepta el pedido,
   así que *pregunta* por el puerto `StockChecker`. `CatalogStockChecker` es el
   **único archivo de Pedidos que importa algo de Catálogo**, y traduce un
   `Product` a lo único que Pedidos necesita: `{ stock, priceCents }`.
2. **Guardar.** El agregado se guarda completo (pedido + ítems) en una
   transacción.
3. **Evento (después de que pasó).** El agregado registró `OrderPlaced` al
   crearse; el handler lo publica **solo después** de guardar. Catálogo lo
   escucha y descuenta el stock. Pedidos no sabe que ese listener existe.

El stock de un producto cambia solo por dos caminos, ambos dentro de Catálogo:
el listener (al registrarse un pedido) y `PATCH /products/:id` (reposición o
ajuste de inventario, con `Product.changeStock`). Pedidos nunca lo modifica.

## Persistencia

- La entidad de dominio y la entidad ORM son **clases distintas**. Un mapper por
  agregado traduce entre las dos (`ProductMapper`, `OrderMapper`).
- Los decoradores `@Entity`, `@Column` solo aparecen en
  `infrastructure/persistence/`.
- Las tablas se crean con **migraciones** (`synchronize: false`).

| Tabla | Columnas | Restricciones |
|---|---|---|
| `products` | `id uuid`, `sku varchar(50)`, `name varchar(100)`, `price_cents integer`, `stock integer` | PK, `UQ_products_sku`, `CHK_products_price_cents_positive`, `CHK_products_stock_non_negative` |
| `orders` | `id uuid`, `placed_at timestamptz` | PK |
| `order_items` | `id uuid`, `order_id uuid`, `product_id uuid`, `quantity integer`, `unit_price_cents integer` | PK, `FK_order_items_order_id` (ON DELETE CASCADE), `CHK_order_items_quantity_positive` |

`order_items.product_id` **no** tiene FK a `products`: son contextos distintos y
el pedido guarda su propia copia de lo que necesita.

## Estructura de carpetas

```
src/
  main.ts · app.module.ts · app.setup.ts
  config/            env.validation.ts, typeorm.config.ts, data-source.ts
  database/migrations/
  shared/            domain/domain.exception.ts, infrastructure/domain-exception.filter.ts
  products/
    products.module.ts
    domain/          product.ts, value-objects/, errors/, ports/
    application/     create-product/, update-product/, list-products/, get-product/, product.response.ts
    infrastructure/  http/, persistence/, listeners/
  orders/
    orders.module.ts
    domain/          order.ts, order-item.ts, value-objects/, errors/, events/, ports/
    application/     place-order/, list-orders/, get-order/, order.response.ts
    infrastructure/  http/, persistence/, clock/, stock-checker/, testing/
test/                e2e + configuración de la base de pruebas
```
