import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { User } from '@modules/security/entities/user.entity';
import {
  TemplateMode,
  TemplateStatus,
} from '@common/constants/exam-template.enum';
import { ExamTemplateItem } from './exam-template-item.entity';
import { ExamTemplateRule } from './exam-template-rule.entity';
import { ExamTemplateSection } from './exam-template-section.entity';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';

@Entity('exam_templates')
export class ExamTemplate extends BaseEntity {
  @Index('uq_exam_templates_code', { unique: true })
  @Column({ name: 'code', type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Index('idx_exam_templates_mode')
  @Column({
    name: 'mode',
    type: 'enum',
    enum: TemplateMode,
    enumName: 'template_mode',
  })
  mode: TemplateMode;

  @Index('idx_exam_templates_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: TemplateStatus,
    enumName: 'template_status',
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatus;

  @Column({ name: 'total_duration_sec', type: 'int' })
  totalDurationSec: number;

  @Column({ name: 'total_questions', type: 'int' })
  totalQuestions: number;

  @Column({ name: 'instructions', type: 'text', nullable: true })
  instructions: string | null;

  @Column({
    name: 'shuffle_question_order',
    type: 'boolean',
    default: false,
  })
  shuffleQuestionOrder: boolean;

  @Column({
    name: 'shuffle_option_order',
    type: 'boolean',
    default: false,
  })
  shuffleOptionOrder: boolean;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'exam_date', type: 'timestamptz', nullable: true })
  examDate: Date | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @OneToMany(() => ExamTemplateSection, (section) => section.examTemplate)
  sections: ExamTemplateSection[];

  @OneToMany(() => ExamTemplateRule, (rule) => rule.examTemplate)
  rules: ExamTemplateRule[];

  @OneToMany(() => ExamTemplateItem, (item) => item.examTemplate)
  items: ExamTemplateItem[];

  @OneToMany(() => ExamAttempt, (examAttempt) => examAttempt.examTemplate)
  examAttempts: ExamAttempt[];
}
