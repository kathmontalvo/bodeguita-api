# Reglas de negocio

Bodeguita tiene 8 reglas. Cada una vive en **un solo lugar** del dominio (o del
caso de uso que la necesita) y tiene un error con un `code` estable que la API
devuelve tal cual.

- RN-001 a RN-006 vienen del planteamiento del proyecto.
- RN-007 y RN-008 aparecieron al implementar el registro de pedidos.

## Resumen

| Regla | Enunciado | Contexto | Dónde vive | Error | HTTP |
|---|---|---|---|---|---|
| RN-001 | El SKU de un producto es único | Products | `CreateProductHandler` + `UNIQUE` en BD | `PRODUCT_SKU_ALREADY_EXISTS` | 409 |
| RN-002 | El precio es mayor que 0 | Products | VO `Money` (al crear y al actualizar) | `INVALID_PRICE` | 400 |
| RN-003 | El stock nunca es negativo | Products | VO `Stock` (al crear, actualizar y descontar) | `INVALID_STOCK` / `INSUFFICIENT_STOCK` | 400 / — |
| RN-004 | Un pedido tiene al menos un ítem | Orders | `Order.place` | `ORDER_WITHOUT_ITEMS` | 400 |
| RN-005 | La cantidad de cada ítem es un entero positivo | Orders | VO `Quantity` | `INVALID_QUANTITY` | 400 |
| RN-006 | No se puede pedir más que el stock disponible | Orders | `PlaceOrderHandler` | `INSUFFICIENT_STOCK` | 409 |
| RN-007 | Solo se pueden pedir productos que existen | Orders | `PlaceOrderHandler` | `PRODUCT_NOT_FOUND` | 404 |
| RN-008 | El pedido guarda el precio del momento en que se registró | Orders | `PlaceOrderHandler` + `OrderItem` | — | — |

## Detalle

### RN-001 · El SKU es único
- Antes de crear, `CreateProductHandler` busca por SKU (`findBySku`).
- El SKU se normaliza antes de comparar: se quitan espacios y se pasa a
  mayúsculas. `inca-500`, `INCA-500` e ` Inca-500 ` son el mismo SKU.
- **Respaldo en la BD:** la restricción `UQ_products_sku`. Si dos peticiones con
  el mismo SKU llegan a la vez y ambas pasan la búsqueda, la BD frena a la
  segunda y `TypeOrmProductRepository` traduce el error de Postgres (`23505`) a
  `PRODUCT_SKU_ALREADY_EXISTS`, para responder 409 y no 500.
- Formato del SKU (`INVALID_SKU`, 400): solo `A-Z`, `0-9` y `-`, máximo 50
  caracteres.
- **El SKU no se puede cambiar** después de crear el producto: `PATCH
  /products/:id` no lo acepta (400). Así la unicidad solo se valida al crear.

### RN-002 · El precio es mayor que 0
- La API recibe el precio en soles (`3.5`) con máximo 2 decimales; el handler lo
  convierte a céntimos enteros (`350`).
- `Money.create` rechaza 0, negativos y no enteros → `INVALID_PRICE`.
- Aplica igual al crear (`Product.create`) y al actualizar
  (`Product.changePrice`, desde `PATCH /products/:id`).
- Respaldo en BD: `CHK_products_price_cents_positive`.

### RN-003 · El stock nunca es negativo
- Al crear o al fijar el stock con `PATCH /products/:id` (`Product.changeStock`):
  `Stock.create` rechaza negativos y decimales → `INVALID_STOCK` (400).
- Al descontar: `Stock.decrease` lanza `INSUFFICIENT_STOCK` antes de dejarlo
  negativo. Esto solo puede pasar en el listener si dos pedidos simultáneos
  pasaron la verificación con el mismo stock (ver
  [consideraciones](consideraciones.md#posible-sobreventa)); no llega al cliente.
- Respaldo en BD: `CHK_products_stock_non_negative`.

### RN-004 · Un pedido tiene al menos un ítem
- `Order.place` lanza `ORDER_WITHOUT_ITEMS` si la lista viene vacía.
- El handler lo revisa también **antes** de consultar Catálogo, para responder
  400 sin hacer consultas de más.
- El DTO **no** tiene `@ArrayMinSize(1)` a propósito: si lo tuviera, esta regla
  la respondería Nest con su formato genérico y el dominio nunca se ejecutaría.

### RN-005 · La cantidad es un entero positivo
- `Quantity.create` rechaza 0, negativos y decimales → `INVALID_QUANTITY`.
- Se valida **antes** de consultar Catálogo: un pedido con cantidad 0 de un
  producto que no existe responde 400, no 404.
- Respaldo en BD: `CHK_order_items_quantity_positive`.

### RN-006 · No se pide más que el stock
- `PlaceOrderHandler` consulta el stock de cada producto con el puerto
  `StockChecker`.
- Compara contra la **suma** de las líneas del mismo producto: dos líneas de 3
  con stock 5 se rechazan.
- Se puede pedir exactamente el stock disponible (queda en 0).
- El stock se descuenta **después**, cuando Catálogo recibe el evento
  `OrderPlaced`.

### RN-007 · Solo se piden productos que existen
- Si `StockChecker` devuelve `null`, el handler lanza `PRODUCT_NOT_FOUND` (404).
- Si un solo producto del pedido no existe, no se guarda nada.

### RN-008 · El precio se copia al pedido
- El cliente **no** manda precios; el DTO rechaza un campo `unitPrice`.
- `PlaceOrderHandler` copia el precio actual de Catálogo en cada `OrderItem`
  (`unit_price_cents`).
- Si después cambia el precio del producto (`PATCH /products/:id`), el pedido
  no cambia: `GET /orders` y `GET /orders/:id` siguen mostrando el precio
  original.
- Subtotal = precio unitario × cantidad; total = suma de subtotales.

## Dónde se prueba cada regla

| Regla | Unitarias | e2e |
|---|---|---|
| RN-001 | `create-product.handler.spec.ts`, `sku.vo.spec.ts`, `product.spec.ts` (el SKU no cambia) | `products.e2e-spec.ts` |
| RN-002 | `money.vo.spec.ts` (products), `product.spec.ts`, `update-product.handler.spec.ts` | `products.e2e-spec.ts` |
| RN-003 | `stock.vo.spec.ts`, `product.spec.ts`, `update-product.handler.spec.ts`, `decrease-stock-on-order-placed.listener.spec.ts` | `products.e2e-spec.ts` |
| RN-004 | `order.spec.ts`, `place-order.handler.spec.ts` | `orders.e2e-spec.ts` |
| RN-005 | `quantity.vo.spec.ts`, `place-order.handler.spec.ts` | `orders.e2e-spec.ts` |
| RN-006 | `place-order.handler.spec.ts` | `orders.e2e-spec.ts`, `stock-on-order-placed.e2e-spec.ts` |
| RN-007 | `place-order.handler.spec.ts` | `orders.e2e-spec.ts` |
| RN-008 | `place-order.handler.spec.ts`, `order-item.spec.ts` | `orders.e2e-spec.ts` (incluye cambio de precio con `PATCH`) |
