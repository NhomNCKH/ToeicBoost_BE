import { Module } from '@nestjs/common';
import { AdminQuestionBankModule } from './question-bank/admin-question-bank.module';
import { AdminExamTemplateModule } from './exam-template/admin-exam-template.module';
import { AdminRbacModule } from './rbac/admin-rbac.module';
import { AdminCredentialModule } from './credential/admin-credential.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminSettingsModule } from './settings/admin-settings.module';
import { AdminAuditModule } from './audit/admin-audit.module';

@Module({
  imports: [
    AdminQuestionBankModule,
    AdminExamTemplateModule,
    AdminRbacModule,
    AdminCredentialModule,
    AdminDashboardModule,
    AdminSettingsModule,
    AdminAuditModule,
  ],
})
export class AdminModule {}
