import { DataSource } from 'typeorm';
import { DEV_DB_NAME, TEST_DB_NAME } from './use-test-db';
import dataSource from '../src/config/data-source';

/**
 * Corre una sola vez antes de todos los e2e:
 * 1. Crea la base bodeguita_test si no existe (en el mismo Postgres de Docker).
 * 2. Le aplica las migraciones, igual que `npm run migration:run`.
 */
export default async function globalSetup(): Promise<void> {
  const admin = new DataSource({
    ...dataSource.options,
    database: DEV_DB_NAME,
    entities: [],
    migrations: [],
  } as typeof dataSource.options);
  await admin.initialize();
  const rows: unknown[] = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [TEST_DB_NAME],
  );
  if (rows.length === 0) {
    await admin.query(`CREATE DATABASE "${TEST_DB_NAME}"`);
  }
  await admin.destroy();

  // dataSource ya apunta a TEST_DB_NAME (use-test-db se importó primero).
  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();
}
