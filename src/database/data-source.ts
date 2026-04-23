import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { getDatabaseConfig } from '../config/database.config';
import { CreateExamAttemptTables1742860000000 } from './migrations/1742860000000-CreateExamAttemptTables';
import { AddUserProfileFields1749000000000 } from './migrations/1749000000000-AddUserProfileFields';
import { AddUserAvatarS3Key1749000000001 } from './migrations/1749000000001-AddUserAvatarS3Key';
import { CreateFlashcardsTables1749000000002 } from './migrations/1749000000002-CreateFlashcardsTables';
import { CreateVocabularyTablesAndPermission1749100800000 } from './migrations/1749100800000-CreateVocabularyTablesAndPermission';
import { AddPronunciationToVocabularyItems1749100900000 } from './migrations/1749100900000-AddPronunciationToVocabularyItems';
import { AddExamDateToExamTemplates1749101100000 } from './migrations/1749101100000-AddExamDateToExamTemplates';
import { CreateOfficialExamRegistrations1761303000000 } from './migrations/1761303000000-CreateOfficialExamRegistrations';
import { FixOfficialExamRegistrationsBaseEntityColumns1761303000001 } from './migrations/1761303000001-FixOfficialExamRegistrationsBaseEntityColumns';
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
  migrations: [
    // CreateExamAttemptTables1742860000000,
    // AddUserProfileFields1749000000000,
    // AddUserAvatarS3Key1749000000001,
    // CreateFlashcardsTables1749000000002,
    // CreateVocabularyTablesAndPermission1749100800000,
    // AddPronunciationToVocabularyItems1749100900000,
    // AddExamDateToExamTemplates1749101100000,
    // CreateOfficialExamRegistrations1761303000000,
    FixOfficialExamRegistrationsBaseEntityColumns1761303000001,
  ],
  migrationsTableName: 'migrations',  
});

export default dataSource;
