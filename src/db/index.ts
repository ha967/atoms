import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.local first.');
}

const globalForDb = globalThis as unknown as {
  atomsSql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.atomsSql ??
  postgres(connectionString, {
    max: process.env.NODE_ENV === 'production' ? 3 : 10,
    idle_timeout: 20,
    prepare: false,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.atomsSql = sql;
}

export const db = drizzle(sql, { schema });
