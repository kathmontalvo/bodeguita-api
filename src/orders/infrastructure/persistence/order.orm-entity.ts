import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { OrderItemOrmEntity } from './order-item.orm-entity';

/**
 * Forma de la tabla "orders".
 * OrderMapper traduce entre esta clase (con sus ítems) y order.
 */
@Entity({ name: 'orders' })
export class OrderOrmEntity {
  /** Lo genera el dominio, no la BD. */
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  /** timestamptz: guarda el instante exacto, sin depender de la zona horaria del servidor. */
  @Column({ name: 'placed_at', type: 'timestamptz' })
  placedAt: Date;

  /**
   * cascade: cuando se guarda el pedido, se insertan también sus items
   * en la misma transacción. El agregado se guarda completo o no se guarda.
   */
  @OneToMany(() => OrderItemOrmEntity, (item) => item.order, {
    cascade: true,
  })
  items: OrderItemOrmEntity[];
}
