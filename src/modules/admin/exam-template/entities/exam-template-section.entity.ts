import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { QuestionPart } from '@common/constants/question-bank.enum';
import { ExamTemplate } from './exam-template.entity';
import { ExamTemplateItem } from './exam-template-item.entity';

@Entity('exam_template_sections')
export class ExamTemplateSection extends BaseEntity {
  @Column({ name: 'exam_template_id', type: 'uuid' })
  examTemplateId: string;

  @Column({
    name: 'part',
    type: 'enum',
    enum: QuestionPart,
    enumName: 'question_part',
  })
  part: QuestionPart;

  @Column({ name: 'section_order', type: 'int' })
  sectionOrder: number;

  @Column({ name: 'expected_group_count', type: 'int' })
  expectedGroupCount: number;

  @Column({ name: 'expected_question_count', type: 'int' })
  expectedQuestionCount: number;

  @Column({ name: 'duration_sec', type: 'int', nullable: true })
  durationSec: number | null;

  @Column({ name: 'instructions', type: 'text', nullable: true })
  instructions: string | null;

  @ManyToOne(() => ExamTemplate, (examTemplate) => examTemplate.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_template_id' })
  examTemplate: ExamTemplate;

  @OneToMany(() => ExamTemplateItem, (item) => item.section)
  items: ExamTemplateItem[];
}
