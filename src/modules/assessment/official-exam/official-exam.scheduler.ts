import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OfficialExamService } from './official-exam.service';

@Injectable()
export class OfficialExamReminderScheduler {
  private readonly logger = new Logger(OfficialExamReminderScheduler.name);

  constructor(private readonly officialExamService: OfficialExamService) {}

  // 07:00:00 mỗi ngày (theo timezone của server)
  @Cron('0 0 7 * * *')
  async sendRemindersAtSevenAM() {
    try {
      const res = await this.officialExamService.sendTodayReminders(new Date());
      this.logger.log(`OfficialExam reminders processed=${res.processed}`);
    } catch (e) {
      this.logger.error(
        'Failed to send OfficialExam reminders',
        e instanceof Error ? e.stack : String(e),
      );
    }
  }
}

