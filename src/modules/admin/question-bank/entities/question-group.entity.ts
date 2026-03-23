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
  QuestionGroupStatus,
  QuestionLevel,
  QuestionPart,
} from '@common/constants/question-bank.enum';
import { QuestionGroupAsset } from './question-group-asset.entity';
import { Question } from './question.entity';
import { QuestionGroupTag } from './question-group-tag.entity';
import { QuestionGroupReview } from './question-group-review.entity';

@Entity('question_groups')
export class QuestionGroup extends BaseEntity {
  @Index('uq_question_groups_code', { unique: true })
  @Column({ name: 'code', type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Index('idx_question_groups_part')
  @Column({
    name: 'part',
    type: 'enum',
    enum: QuestionPart,
    enumName: 'question_part',
  })
  part: QuestionPart;

  @Index('idx_question_groups_level')
  @Column({
    name: 'level',
    type: 'enum',
    enum: QuestionLevel,
    enumName: 'question_level',
  })
  level: QuestionLevel;

  @Index('idx_question_groups_status')
  @Column({
    name: 'status',
    type: 'enum',
    enum: QuestionGroupStatus,
    enumName: 'question_group_status',
    default: QuestionGroupStatus.DRAFT,
  })
  status: QuestionGroupStatus;

  @Column({ name: 'stem', type: 'text', nullable: true })
  stem: string | null;

  @Column({ name: 'explanation', type: 'text', nullable: true })
  explanation: string | null;

  @Column({ name: 'source_type', type: 'varchar', length: 30 })
  sourceType: string;

  @Column({ name: 'source_ref', type: 'varchar', length: 255, nullable: true })
  sourceRef: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedById: string | null;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedById: string | null;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedBy: User | null;

  @OneToMany(() => QuestionGroupAsset, (asset) => asset.questionGroup)
  assets: QuestionGroupAsset[];

  @OneToMany(() => Question, (question) => question.questionGroup)
  questions: Question[];

  @OneToMany(
    () => QuestionGroupTag,
    (questionGroupTag) => questionGroupTag.questionGroup,
  )
  questionGroupTags: QuestionGroupTag[];

  @OneToMany(() => QuestionGroupReview, (review) => review.questionGroup)
  reviews: QuestionGroupReview[];
}
