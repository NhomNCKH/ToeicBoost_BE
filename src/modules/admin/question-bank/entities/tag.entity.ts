import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { QuestionGroupTag } from './question-group-tag.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  @Index('idx_tags_category')
  @Column({ name: 'category', type: 'varchar', length: 50 })
  category: string;

  @Index('uq_tags_code', { unique: true })
  @Column({ name: 'code', type: 'varchar', length: 100 })
  code: string;

  @Column({ name: 'label', type: 'varchar', length: 255 })
  label: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => QuestionGroupTag, (questionGroupTag) => questionGroupTag.tag)
  questionGroupTags: QuestionGroupTag[];
}
