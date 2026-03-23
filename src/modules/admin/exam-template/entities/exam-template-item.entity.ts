import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { TemplateItemMode } from '@common/constants/exam-template.enum';
import { ExamTemplate } from './exam-template.entity';
import { ExamTemplateSection } from './exam-template-section.entity';
import { QuestionGroup } from '../../question-bank/entities/question-group.entity';

@Entity('exam_template_items')
export class ExamTemplateItem extends BaseEntity {
  @Column({ name: 'exam_template_id', type: 'uuid' })
  examTemplateId: string;

  @Column({ name: 'section_id', type: 'uuid' })
  sectionId: string;

  @Column({ name: 'question_group_id', type: 'uuid' })
  questionGroupId: string;

  @Column({
    name: 'source_mode',
    type: 'enum',
    enum: TemplateItemMode,
    enumName: 'template_item_mode',
  })
  sourceMode: TemplateItemMode;

  @Column({ name: 'display_order', type: 'int' })
  displayOrder: number;

  @Column({ name: 'locked', type: 'boolean', default: false })
  locked: boolean;

  @ManyToOne(() => ExamTemplate, (examTemplate) => examTemplate.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_template_id' })
  examTemplate: ExamTemplate;

  @ManyToOne(() => ExamTemplateSection, (section) => section.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: ExamTemplateSection;

  @ManyToOne(() => QuestionGroup, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'question_group_id' })
  questionGroup: QuestionGroup;
}
