import { DataSource } from 'typeorm';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { getDatabaseConfig, DB_ENTITIES_PATH } from '../config/database.config';

dotenv.config();

const dbConfig = getDatabaseConfig();

const dataSource = new DataSource({
  ...dbConfig,
  entities: [DB_ENTITIES_PATH],
  migrations: [path.join(__dirname, 'migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
});

export default dataSource;
