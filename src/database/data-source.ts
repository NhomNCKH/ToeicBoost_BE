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
import { CreateToeicSkillTaskTables1761860000000 } from './migrations/1761860000000-CreateToeicSkillTaskTables';
import { CreateToeicSpeakingSetTables1761860000001 } from './migrations/1761860000001-CreateToeicSpeakingSetTables';
import { ExpandToeicSpeakingTaskTypeEnum1761860000002 } from './migrations/1761860000002-ExpandToeicSpeakingTaskTypeEnum';
import { CreateToeicWritingSetTables1761860000003 } from './migrations/1761860000003-CreateToeicWritingSetTables';
import { AddSkillScopeToQuestionGroups1761860000004 } from './migrations/1761860000004-AddSkillScopeToQuestionGroups';
import { ReclassifyQuestionGroupsSkillScope1761860000005 } from './migrations/1761860000005-ReclassifyQuestionGroupsSkillScope';
import { CreateProctoringViolations1761303000002 } from './migrations/1761303000002-CreateProctoringViolations';
import { CreateShadowingTables1761860000006 } from './migrations/1761860000006-CreateShadowingTables';
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
    // FixOfficialExamRegistrationsBaseEntityColumns1761303000001,
    // CreateToeicSkillTaskTables1761860000000,
    // CreateToeicSpeakingSetTables1761860000001,
    // ExpandToeicSpeakingTaskTypeEnum1761860000002,
    // CreateToeicWritingSetTables1761860000003,
    // AddSkillScopeToQuestionGroups1761860000004,
    // ReclassifyQuestionGroupsSkillScope1761860000005,
    CreateShadowingTables1761860000006,
    // FixOfficialExamRegistrationsBaseEntityColumns1761303000001,
    // CreateProctoringViolations1761303000002,
  ],
  migrationsTableName: 'migrations',  
});

export default dataSource;
