# Pruebas

```bash
npm test            # unitarias
npm run test:e2e    # e2e (necesita el contenedor de Postgres levantado)
```

## Unitarias (`src/**/*.spec.ts`)
Sin base de datos ni Nest. Prueban el dominio y los casos de uso con los
adaptadores de prueba.

| Qué | Archivos |
|---|---|
| Value objects | `*.vo.spec.ts` de cada contexto |
| Agregados | `product.spec.ts`, `order.spec.ts`, `order-item.spec.ts` |
| Casos de uso | `create-product`, `update-product`, `list-products`, `get-product`, `place-order`, `list-orders`, `get-order` (`*.handler.spec.ts`) |
| Evento | `place-order.events.spec.ts`: se publica `OrderPlaced` solo después de guardar, y nunca si el pedido falla |
| Listener | `decrease-stock-on-order-placed.listener.spec.ts` |

Dobles de prueba: `InMemoryProductRepository`, `InMemoryOrderRepository`,
`FakeStockChecker` y `FixedClock`.

## e2e (`test/*.e2e-spec.ts`)
Levantan la aplicación completa (`AppModule` + `setupApp`) y hacen peticiones
HTTP reales contra Postgres.

- Usan la base **`bodeguita_test`**. `test/global-setup.ts` la crea si no existe
  y le aplica las migraciones; `test/use-test-db.ts` cambia `DB_NAME` antes de
  que arranque la app. Nunca tocan la base de desarrollo.
- Vacían las tablas en `beforeEach`: ningún test depende de otro.
- Corren en serie (`maxWorkers: 1`) porque comparten la base.
- Como el descuento de stock es asíncrono, los e2e que registran pedidos
  esperan a que el listener termine antes de pasar al siguiente test.

| Archivo | Qué cubre |
|---|---|
| `products.e2e-spec.ts` | `POST`, `GET`, `GET /:id` y `PATCH /:id` de `/products`; RN-001 a RN-003 |
| `orders.e2e-spec.ts` | `POST`, `GET` y `GET /:id` de `/orders`; RN-004 a RN-008 |
| `stock-on-order-placed.e2e-spec.ts` | Stock 10, pedir 3, `GET /products` muestra 7 |
