import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { QuestionPart } from '@common/constants/question-bank.enum';
import { ExamTemplate } from './exam-template.entity';

@Entity('exam_template_rules')
export class ExamTemplateRule extends BaseEntity {
  @Column({ name: 'exam_template_id', type: 'uuid' })
  examTemplateId: string;

  @Column({
    name: 'part',
    type: 'enum',
    enum: QuestionPart,
    enumName: 'question_part',
  })
  part: QuestionPart;

  @Column({
    name: 'level_distribution',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  levelDistribution: Record<string, number>;

  @Column({
    name: 'required_tag_codes',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  requiredTagCodes: string[];

  @Column({
    name: 'excluded_tag_codes',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  excludedTagCodes: string[];

  @Column({ name: 'question_count', type: 'int' })
  questionCount: number;

  @Column({ name: 'group_count', type: 'int', nullable: true })
  groupCount: number | null;

  @ManyToOne(() => ExamTemplate, (examTemplate) => examTemplate.rules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_template_id' })
  examTemplate: ExamTemplate;
}
