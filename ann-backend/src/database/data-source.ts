import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { typeOrmEntities } from './entities/entities.registry';

config();

function trimmed(key: string, fallback: string): string {
  const v = process.env[key];
  const t = v?.trim();
  return t === undefined || t === '' ? fallback : t;
}

const url = process.env.DATABASE_URL?.trim();

/** Lets migrations use `transaction = false` (e.g. `CREATE INDEX CONCURRENTLY`). */
const migrationsTransactionMode = 'each' as const;

export default new DataSource(
  url
    ? {
        type: 'postgres',
        url,
        entities: typeOrmEntities,
        migrations: ['src/database/migrations/*.ts'],
        migrationsTableName: 'typeorm_migrations',
        migrationsTransactionMode,
      }
    : {
        type: 'postgres',
        host: trimmed('DATABASE_HOST', 'localhost'),
        port: parseInt(trimmed('DATABASE_PORT', '5432'), 10),
        username: trimmed('DATABASE_USER', 'postgres'),
        password: trimmed('DATABASE_PASSWORD', ''),
        database: trimmed('DATABASE_NAME', 'postgres'),
        entities: typeOrmEntities,
        migrations: ['src/database/migrations/*.ts'],
        migrationsTableName: 'typeorm_migrations',
        migrationsTransactionMode,
      },
);
