import 'dotenv/config';

/**
 * Hace que los e2e usen una base aparte (bodeguita_test) y nunca toquen la
 * base de desarrollo. Se carga antes que AppModule (setupFiles de Jest):
 * ConfigModule y dotenv no pisan una variable que ya existe en process.env.
 */
export const DEV_DB_NAME = process.env.DB_NAME;
export const TEST_DB_NAME = process.env.DB_NAME_TEST ?? 'bodeguita_test';

process.env.DB_NAME = TEST_DB_NAME;
