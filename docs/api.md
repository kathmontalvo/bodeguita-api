# API

Base: `http://localhost:3000` (o el `PORT` de `.env`).

Documentación interactiva (Swagger UI): `/docs` · OpenAPI en JSON: `/docs-json`.
Se configura en `src/config/swagger.config.ts` y solo se publica desde
`main.ts` (los e2e no la levantan).

Los montos viajan **en soles** (`3.5` = S/ 3.50). Los ids son UUID.

## Productos

### `POST /products`
Crea un producto.

```json
{ "sku": "inca-500", "name": "Inca Kola 500ml", "price": 3.5, "stock": 24 }
```

| Respuesta | Cuándo |
|---|---|
| 201 `{ "id": "…" }` | Se creó |
| 400 `INVALID_SKU` | SKU vacío, con caracteres fuera de `A-Z 0-9 -` o de más de 50 |
| 400 `INVALID_PRODUCT_NAME` | Nombre vacío o de más de 100 caracteres |
| 400 `INVALID_PRICE` | Precio 0 o negativo (RN-002) |
| 400 `INVALID_STOCK` | Stock negativo o con decimales (RN-003) |
| 400 (Nest) | Tipos incorrectos, precio con más de 2 decimales, campos de más |
| 409 `PRODUCT_SKU_ALREADY_EXISTS` | Ya existe ese SKU (RN-001) |

### `GET /products`
Lista todos los productos, ordenados por nombre.

```json
[
  { "id": "…", "sku": "INCA-500", "name": "Inca Kola 500ml", "price": 3.5, "stock": 24 }
]
```

### `GET /products/:id`

| Respuesta | Cuándo |
|---|---|
| 200 (mismo formato que en la lista) | Existe |
| 400 `INVALID_PRODUCT_ID` | El id no es un UUID |
| 404 `PRODUCT_NOT_FOUND` | No existe |

### `PATCH /products/:id`
Actualiza nombre, precio y/o stock. Solo cambia los campos enviados; `{}` no
cambia nada. El SKU **no** se puede cambiar. Los pedidos ya registrados
conservan su precio (RN-008). `stock` fija el valor nuevo (no suma ni resta).

```json
{ "price": 4.2, "stock": 50 }
```

| Respuesta | Cuándo |
|---|---|
| 200 producto actualizado | Se actualizó |
| 400 `INVALID_PRODUCT_ID` | El id no es un UUID |
| 400 `INVALID_PRODUCT_NAME` · `INVALID_PRICE` · `INVALID_STOCK` | Valor inválido (no se guarda nada) |
| 400 (Nest) | Tipos incorrectos, campos de más, o se envió `sku` |
| 404 `PRODUCT_NOT_FOUND` | No existe |

## Pedidos

### `POST /orders`
Registra un pedido. El precio **no** se envía: se copia del catálogo (RN-008).

```json
{ "items": [ { "productId": "…", "quantity": 3 } ] }
```

| Respuesta | Cuándo |
|---|---|
| 201 `{ "id": "…" }` | Se registró. El stock se descuenta enseguida, por evento |
| 400 `ORDER_WITHOUT_ITEMS` | `items` vacío (RN-004) |
| 400 `INVALID_QUANTITY` | Cantidad 0 o negativa (RN-005) |
| 400 (Nest) | Falta `items`, `productId` no es UUID, cantidad no entera, campos de más |
| 404 `PRODUCT_NOT_FOUND` | Algún producto no existe (RN-007) |
| 409 `INSUFFICIENT_STOCK` | Se pide más que el stock, sumando líneas repetidas (RN-006) |

### `GET /orders`
Lista todos los pedidos, del más reciente al más antiguo, con el mismo formato
que `GET /orders/:id`.

### `GET /orders/:id`

```json
{
  "id": "…",
  "placedAt": "2026-11-11T21:32:40.164Z",
  "items": [
    { "productId": "…", "quantity": 3, "unitPrice": 3.5, "subtotal": 10.5 },
    { "productId": "…", "quantity": 2, "unitPrice": 5.2, "subtotal": 10.4 }
  ],
  "total": 20.9
}
```

| Respuesta | Cuándo |
|---|---|
| 200 | Existe |
| 400 `INVALID_ORDER_ID` | El id no es un UUID |
| 404 `ORDER_NOT_FOUND` | No existe |

## Formato de error

Errores de negocio:

```json
{ "statusCode": 409, "code": "INSUFFICIENT_STOCK", "message": "Stock insuficiente para el producto …: se pidieron 6 y solo hay 5" }
```

Errores de forma del body (`ValidationPipe` de Nest):

```json
{ "statusCode": 400, "message": ["items.0.productId must be a UUID"], "error": "Bad Request" }
```
