import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { OrderOrmEntity } from './order.orm-entity';

/**
 * Forma de la tabla "order_items".
 * product_id NO tiene FK a products y el pedido
 * guarda su propia copia de lo que necesita (producto, cantidad y precio).
 */
@Entity({ name: 'order_items' })
@Check('CHK_order_items_quantity_positive', '"quantity" > 0')
export class OrderItemOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  /** FK order_id → orders.id. Si se borra el pedido, se borran sus ítems. */
  @ManyToOne(() => OrderOrmEntity, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'order_id',
    foreignKeyConstraintName: 'FK_order_items_order_id',
  })
  order: OrderOrmEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'integer' })
  quantity: number;

  /** RN-008: precio copiado de Catálogo al momento del pedido. */
  @Column({ name: 'unit_price_cents', type: 'integer' })
  unitPriceCents: number;
}
