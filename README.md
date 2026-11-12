# Bodeguita API

API de una bodega: un catálogo de productos con stock y un registro de pedidos.
Hecha con NestJS siguiendo arquitectura hexagonal, DDD y CQRS, con dos
contextos acotados: **Products** (Catálogo) y **Orders** (Pedidos).

## Requisitos

- Node.js 22 o superior y npm
- Docker y Docker Compose (para Postgres 17)

## Cómo levantar

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno (edita la clave y, si hace falta, el puerto)
cp .env.example .env

# 3. Base de datos en Docker
docker compose up -d

# 4. Tablas
npm run migration:run

# 5. API en http://localhost:3000
npm run start:dev
```

Si el paso 4 falla con `password authentication failed`, es probable que otro
Postgres instalado en tu máquina ya use ese puerto: cambia `DB_PORT` en `.env`
(por ejemplo a `5433`) y repite desde el paso 3.

## Variables de entorno

Se validan con Joi al arrancar (`src/config/env.validation.ts`): si falta una
obligatoria, la API no levanta.

| Variable | Obligatoria | Por defecto | Para qué |
|---|---|---|---|
| `PORT` | No | `3000` | Puerto HTTP de la API |
| `DB_HOST` | Sí | — | Host de Postgres |
| `DB_PORT` | No | `5432` | Puerto de Postgres (también lo publica Docker) |
| `DB_USER` | Sí | — | Usuario de Postgres |
| `DB_PASSWORD` | Sí | — | Clave de Postgres |
| `DB_NAME` | Sí | — | Base de desarrollo |
| `DB_NAME_TEST` | No | `bodeguita_test` | Base que usan los e2e |

## Pruebas

```bash
npm test            # unitarias: dominio y casos de uso, sin base de datos
npm run test:e2e    # HTTP + Postgres real, en una base aparte
```

Los e2e necesitan el contenedor levantado. Usan la base `bodeguita_test`, que
se crea y se migra sola antes de correr, y vacían las tablas antes de cada
test, así que nunca tocan la base de desarrollo.

## Endpoints

Con la API levantada, la documentación interactiva (Swagger) está en
**http://localhost:3000/docs** y el JSON de OpenAPI en
`http://localhost:3000/docs-json`.

Los montos viajan **en soles** (`3.5` = S/ 3.50). Por dentro se guardan en
céntimos enteros para no perder precisión.

| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| POST | `/products` | `{ sku, name, price, stock }` | 201 `{ id }` | 400 `INVALID_SKU`, `INVALID_PRODUCT_NAME`, `INVALID_PRICE`, `INVALID_STOCK` · 409 `PRODUCT_SKU_ALREADY_EXISTS` |
| GET | `/products` | — | 200 lista de productos | — |
| GET | `/products/:id` | — | 200 producto | 400 `INVALID_PRODUCT_ID` · 404 `PRODUCT_NOT_FOUND` |
| PATCH | `/products/:id` | `{ name?, price?, stock? }` | 200 producto actualizado | 400 `INVALID_PRODUCT_ID`, `INVALID_PRODUCT_NAME`, `INVALID_PRICE`, `INVALID_STOCK` · 404 `PRODUCT_NOT_FOUND` |
| POST | `/orders` | `{ items: [{ productId, quantity }] }` | 201 `{ id }` | 400 `ORDER_WITHOUT_ITEMS`, `INVALID_QUANTITY` · 404 `PRODUCT_NOT_FOUND` · 409 `INSUFFICIENT_STOCK` |
| GET | `/orders` | — | 200 lista de pedidos, del más reciente al más antiguo | — |
| GET | `/orders/:id` | — | 200 pedido con subtotales y total | 400 `INVALID_ORDER_ID` · 404 `ORDER_NOT_FOUND` |

Ejemplo:

```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"sku":"INCA-500","name":"Inca Kola 500ml","price":3.5,"stock":10}'

curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<id del producto>","quantity":3}]}'

# Reponer stock o cambiar el precio (solo los campos enviados)
curl -X PATCH http://localhost:3000/products/<id del producto> \
  -H "Content-Type: application/json" \
  -d '{"price":3.8,"stock":20}'
```

```json
// GET /orders/:id
{
  "id": "b7a2a2e1-9b43-4d1c-aa6a-24da0e831c30",
  "placedAt": "2026-11-11T21:32:40.164Z",
  "items": [
    { "productId": "081c399d-…", "quantity": 3, "unitPrice": 3.5, "subtotal": 10.5 }
  ],
  "total": 10.5
}
```

Los errores de negocio responden siempre con la misma forma:

```json
{ "statusCode": 409, "code": "INSUFFICIENT_STOCK", "message": "Stock insuficiente…" }
```

Los errores de forma del body (tipo incorrecto, campo de más, UUID inválido)
los responde el `ValidationPipe` de Nest con su formato por defecto (400).

## Documentación

| Documento | Contenido |
|---|---|
| [docs/reglas-de-negocio.md](docs/reglas-de-negocio.md) | RN-001 a RN-008: dónde vive cada una, su error y dónde se prueba |
| [docs/arquitectura.md](docs/arquitectura.md) | Capas, puertos y adaptadores, comunicación entre contextos, tablas |
| [docs/decisiones.md](docs/decisiones.md) | Decisiones de diseño, con su motivo y lo descartado |
| [docs/consideraciones.md](docs/consideraciones.md) | Deuda técnica y límites del alcance |
| [docs/api.md](docs/api.md) | Endpoints con ejemplos y todos los códigos de error |
| [docs/pruebas.md](docs/pruebas.md) | Estrategia de pruebas unitarias y e2e |
