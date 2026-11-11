import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ProductSkuAlreadyExistsError } from '../../domain/errors/product-sku-already-exists.error';
import { ProductRepository } from '../../domain/ports/product.repository';
import { Product } from '../../domain/product';
import { ProductId } from '../../domain/value-objects/product-id.vo';
import { Sku } from '../../domain/value-objects/sku.vo';
import { ProductMapper } from './product.mapper';
import { ProductOrmEntity } from './product.orm-entity';

/** Código de Postgres para "violación de UNIQUE". */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * Adaptador real del puerto ProductRepository: guarda y lee en Postgres con
 * TypeORM. Hacia fuera solo habla en Product; ProductOrmEntity no sale de aquí.
 */
@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async save(product: Product): Promise<void> {
    try {
      // save() inserta si el id no existe y actualiza si ya existe.
      await this.repository.save(ProductMapper.toOrm(product));
    } catch (error) {
      // RN-001 en carrera: dos POST con el mismo SKU a la vez pasan el
      // findBySku del handler, pero el UNIQUE de la BD frena al segundo.
      // Lo traducimos al error de dominio para responder 409 y no 500.
      if (isSkuUniqueViolation(error)) {
        throw new ProductSkuAlreadyExistsError(product.toPrimitives().sku);
      }
      throw error;
    }
  }

  async findById(id: ProductId): Promise<Product | null> {
    const row = await this.repository.findOneBy({ id: id.value });
    return row ? ProductMapper.toDomain(row) : null;
  }

  async findBySku(sku: Sku): Promise<Product | null> {
    const row = await this.repository.findOneBy({ sku: sku.value });
    return row ? ProductMapper.toDomain(row) : null;
  }

  async findAll(): Promise<Product[]> {
    const rows = await this.repository.find({ order: { name: 'ASC' } });
    return rows.map((row) => ProductMapper.toDomain(row));
  }
}

function isSkuUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as {
    code?: string;
    constraint?: string;
  };
  return (
    driverError.code === PG_UNIQUE_VIOLATION &&
    driverError.constraint === 'UQ_products_sku'
  );
}
