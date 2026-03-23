import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { QuestionGroup } from './question-group.entity';
import { Tag } from './tag.entity';

@Entity('question_group_tags')
export class QuestionGroupTag {
  @PrimaryColumn({ name: 'question_group_id', type: 'uuid' })
  questionGroupId: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId: string;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdById: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(
    () => QuestionGroup,
    (questionGroup) => questionGroup.questionGroupTags,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'question_group_id' })
  questionGroup: QuestionGroup;

  @ManyToOne(() => Tag, (tag) => tag.questionGroupTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
