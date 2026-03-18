import * as path from 'node:path';

export const DB_ENTITIES_PATH = path.join(
  __dirname,
  '../modules/**/*.entity.{ts,js}',
);

export const getDatabaseConfig = () => ({
  type: 'postgres' as const,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
