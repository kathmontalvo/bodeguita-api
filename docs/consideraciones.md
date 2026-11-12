# Consideraciones y deuda técnica

Lo que el proyecto **no** resuelve a propósito, por alcance, y cómo se
resolvería.

## Posible sobreventa
La verificación de stock (al registrar el pedido) y el descuento (en el
listener) **no ocurren en la misma transacción**.

- **Escenario:** stock 5. Llegan a la vez dos pedidos de 3. Ambos consultan,
  ven 5 y se registran. El primer descuento deja 2; el segundo intentaría dejar
  −1.
- **Qué pasa hoy:** RN-003 impide el stock negativo, así que el segundo
  descuento no se aplica y queda registrado en el log. Pero el segundo pedido
  **ya está guardado**.
- **Cómo se resolvería:** reservar el stock en la misma transacción que el
  pedido (`SELECT … FOR UPDATE` o un `UPDATE … WHERE stock >= n`), o un flujo
  de reserva con estados (`PENDING` → `CONFIRMED`/`REJECTED`).

## El evento no es durable
`OrderPlaced` se publica en memoria (`EventBus` de `@nestjs/cqrs`).

- Si la aplicación se cae entre `save()` y el descuento, el pedido existe pero
  el stock no baja.
- **Cómo se resolvería:** patrón *outbox* (guardar el evento en una tabla en la
  misma transacción que el pedido y publicarlo después) o una cola de mensajes.

## El descuento es asíncrono
`POST /orders` responde 201 antes de que el listener termine. Un
`GET /products` inmediatamente después podría mostrar el stock anterior por
unos milisegundos. Los e2e esperan a que el listener termine antes de
comprobar.

## Cambiar el stock a mano mientras llegan pedidos
`PATCH /products/:id` con `stock` **reemplaza** el valor (no suma ni resta).
Si justo en ese momento el listener está descontando un pedido, uno de los dos
cambios puede pisar al otro ("última escritura gana"). Se resolvería con
bloqueo optimista (columna `version`) o con operaciones de ajuste
(`+n` / `−n`) en lugar de fijar el valor.

## Orden de los ítems
`order_items` no guarda la posición de cada línea, así que
`GET /orders/:id` no garantiza devolver los ítems en el orden en que se
enviaron. Se resolvería con una columna `position`.

## Dos formatos de error 400
- Errores de negocio: `{ statusCode, code, message }`.
- Errores de forma del body (`ValidationPipe`):
  `{ statusCode, message: string[], error }`, sin `code`.

Se unificaría con un `exceptionFactory` en el `ValidationPipe`.

## Alcance del curso
- No hay autenticación ni usuarios.
- No se pueden borrar productos ni cambiar su SKU.
- Los pedidos no se editan ni se cancelan una vez registrados.
- No hay paginación en `GET /products` ni en `GET /orders`.

## Pendientes menores del código
- Algunos archivos no siguen el formato de Prettier (espacios al final de línea,
  falta de salto de línea final). `npm run lint` los corrige.
