import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { getDatabaseConfig } from '../config/database.config';
import { CreateExamAttemptTables1742860000000 } from './migrations/1742860000000-CreateExamAttemptTables';

dotenv.config();

const dbConfig = getDatabaseConfig();

if (!dbConfig.password || typeof dbConfig.password !== 'string') {
  throw new Error(
    'DB_PASSWORD is missing or invalid in environment variables.',
  );
}

const dataSource = new DataSource({
  ...dbConfig,
  entities: [path.join(__dirname, '../**/*.entity.{ts,js}')],
  synchronize: false,
  migrations: [CreateExamAttemptTables1742860000000],
  migrationsTableName: 'migrations',
});

export default dataSource;
