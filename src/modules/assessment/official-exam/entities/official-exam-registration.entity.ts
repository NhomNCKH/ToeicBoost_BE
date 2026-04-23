import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import { ExamTemplate } from '@modules/admin/exam-template/entities/exam-template.entity';

export enum OfficialExamRegistrationStatus {
  REGISTERED = 'registered',
  CANCELLED = 'cancelled',
}

@Entity('official_exam_registrations')
@Index('uq_official_exam_registrations_user_template', ['userId', 'examTemplateId'], {
  unique: true,
})
@Index('idx_official_exam_registrations_exam_date', ['examDate'])
export class OfficialExamRegistration extends BaseEntity {
  @Index('idx_official_exam_registrations_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Index('idx_official_exam_registrations_exam_template_id')
  @Column({ name: 'exam_template_id', type: 'uuid' })
  examTemplateId: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: OfficialExamRegistrationStatus.REGISTERED,
  })
  status: OfficialExamRegistrationStatus;

  @Column({ name: 'exam_date', type: 'timestamptz' })
  examDate: Date;

  @Column({ name: 'registered_at', type: 'timestamptz' })
  registeredAt: Date;

  @Column({ name: 'confirmation_sent_at', type: 'timestamptz', nullable: true })
  confirmationSentAt: Date | null;

  @Column({ name: 'reminder_sent_at', type: 'timestamptz', nullable: true })
  reminderSentAt: Date | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ExamTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'exam_template_id' })
  examTemplate: ExamTemplate;
}

