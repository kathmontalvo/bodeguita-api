import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../domain/order';
import { OrderRepository } from '../../domain/ports/order.repository';
import { OrderId } from '../../domain/value-objects/order-id.vo';
import { OrderMapper } from './order.mapper';
import { OrderOrmEntity } from './order.orm-entity';

/**
 * Adaptador real del puerto OrderRepository: guarda y lee pedidos en
 * Postgres con TypeORM. Hacia fuera solo habla en Order.
 */
@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repository: Repository<OrderOrmEntity>,
  ) {}

  async save(order: Order): Promise<void> {
    // save() abre una transacción: inserta orders y, por el cascade,
    // todas sus filas de order_items. Si una falla, no queda nada guardado.
    await this.repository.save(OrderMapper.toOrm(order));
  }

  async findById(id: OrderId): Promise<Order | null> {
    const row = await this.repository.findOne({
      where: { id: id.value },
      relations: { items: true },
    });
    return row ? OrderMapper.toDomain(row) : null;
  }

  async findAll(): Promise<Order[]> {
    const rows = await this.repository.find({
      relations: { items: true },
      order: { placedAt: 'DESC' },
    });
    return rows.map((row) => OrderMapper.toDomain(row));
  }
}
