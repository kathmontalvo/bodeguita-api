# Decisiones de diseño

Cada decisión con su motivo y lo que se descartó.

## 1. Montos en céntimos enteros
- **Decisión:** el dominio y la BD guardan céntimos (`350`). La API recibe y
  devuelve soles (`3.5`), con máximo 2 decimales en la entrada.
- **Por qué:** `0.1 + 0.2 !== 0.3` en JavaScript. Con enteros, subtotales y
  totales son exactos.
- **Descartado:** `numeric`/`decimal` en la BD (llega como string a Node) y
  pedir céntimos al cliente (menos natural para quien usa la API).

## 2. El dominio genera los ids
- **Decisión:** `ProductId.generate()` / `OrderId.generate()` crean UUID antes
  de guardar.
- **Por qué:** el agregado está completo y válido desde que nace, sin esperar a
  la BD; el evento `OrderPlaced` ya lleva el id.

## 3. Entidad de dominio distinta de la entidad ORM
- **Decisión:** `Product` ≠ `ProductOrmEntity`, unidas por `ProductMapper`
  (igual en Pedidos).
- **Por qué:** el dominio no depende de TypeORM; se puede probar sin BD y la
  forma de la tabla puede cambiar sin tocar las reglas.

## 4. Validación en dos niveles
- **Decisión:** el DTO valida **forma y tipo** (`@IsString`, `@IsInt`,
  `@IsUUID`, campos de más). Las **reglas de negocio** las valida el dominio.
- **Por qué:** si el DTO tuviera `@Min(1)` o `@ArrayMinSize(1)`, el dominio
  nunca se ejecutaría y los tests no demostrarían las reglas.
- **Consecuencia:** hay dos formatos de error 400 (ver consideraciones).

## 5. Comunicación entre contextos: consulta + evento
- **Decisión:** consulta síncrona por `StockChecker` antes de registrar;
  evento `OrderPlaced` después de guardar para descontar stock.
- **Por qué:** para responder 409 en el momento hace falta preguntar antes. El
  descuento es una consecuencia de algo que ya pasó, así que va por evento y
  Pedidos no depende de cómo Catálogo maneja su stock.
- **Descartado:** descontar el stock desde `PlaceOrderHandler` (Pedidos
  modificaría datos de otro contexto) y un flujo 100 % por eventos tipo saga
  (`POST /orders` tendría que responder 202 y el cliente consultar después).

## 6. Sin FK de `order_items.product_id` a `products`
- **Por qué:** son contextos distintos. El pedido guarda su copia (producto,
  cantidad, precio) y no se rompe si Catálogo cambia.

## 7. El evento se publica después de guardar
- **Decisión:** el agregado registra `OrderPlaced` en `Order.place`; el handler
  lo saca con `pullDomainEvents()` y lo publica después de `save()`.
- **Por qué:** si `save()` falla, nadie se entera de un pedido que no existe.
  `pullDomainEvents()` vacía la lista para no publicar dos veces.

## 8. Reloj como puerto
- **Decisión:** la fecha del pedido sale de `Clock.now()`, no de `new Date()`.
- **Por qué:** en los tests se usa `FixedClock` y la fecha es predecible.

## 9. Líneas repetidas del mismo producto
- **Decisión:** se aceptan; RN-006 se valida contra la suma de las líneas.
- **Descartado:** rechazarlas o fusionarlas, para no agregar una regla que el
  planteamiento no pide.

## 10. Qué se puede actualizar
- **Productos:** `PATCH /products/:id` cambia nombre, precio y/o stock; solo
  los campos enviados. Cada cambio pasa por un método del agregado
  (`rename`, `changePrice`, `changeStock`), que valida con su value object.
- **El SKU no cambia:** es la identidad de negocio del producto (RN-001). Si el
  body trae `sku`, el `ValidationPipe` responde 400.
- **Los pedidos son inmutables:** una vez registrados no se editan. Cambiar el
  precio de un producto no los afecta (RN-008).
- **Descartado:** editar ítems de un pedido (habría que revalidar RN-004 a
  RN-008 y devolver o descontar stock por la diferencia) y cancelar pedidos.

## 11. Repositorios en memoria solo como dobles de prueba
- **Decisión:** los módulos conectan siempre los adaptadores TypeORM; los
  `InMemory*` solo existen para los tests unitarios.

## 12. Base de datos de pruebas separada
- **Decisión:** los e2e usan `bodeguita_test`, que se crea y migra sola en el
  `globalSetup` de Jest, y vacían las tablas antes de cada test.
- **Por qué:** los e2e nunca tocan los datos de desarrollo y no dependen del
  orden en que corren.

## 13. Swagger solo en infraestructura
- **Decisión:** los decoradores de `@nestjs/swagger` van en los controllers y
  DTOs de `infrastructure/http/`. Las respuestas se documentan con clases
  (`ProductResponseDto`, `OrderResponseDto`) que implementan las interfaces de
  `application/`.
- **Por qué:** `application/` y `domain/` no dependen de Swagger; la
  documentación es un detalle del adaptador HTTP.

## 14. Migraciones en lugar de `synchronize`
- **Por qué:** los cambios de esquema quedan versionados y revisables, como en
  producción.
