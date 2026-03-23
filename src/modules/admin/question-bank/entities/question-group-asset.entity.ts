import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { AssetKind } from '@common/constants/question-bank.enum';
import { QuestionGroup } from './question-group.entity';

@Entity('question_group_assets')
export class QuestionGroupAsset extends BaseEntity {
  @Index('idx_question_group_assets_group_id')
  @Column({ name: 'question_group_id', type: 'uuid' })
  questionGroupId: string;

  @Index('idx_question_group_assets_kind')
  @Column({
    name: 'kind',
    type: 'enum',
    enum: AssetKind,
    enumName: 'asset_kind',
  })
  kind: AssetKind;

  @Column({ name: 'storage_key', type: 'varchar', length: 500 })
  storageKey: string;

  @Column({ name: 'public_url', type: 'varchar', length: 1000, nullable: true })
  publicUrl: string | null;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  @Column({ name: 'duration_sec', type: 'int', nullable: true })
  durationSec: number | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'content_text', type: 'text', nullable: true })
  contentText: string | null;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => QuestionGroup, (questionGroup) => questionGroup.assets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_group_id' })
  questionGroup: QuestionGroup;
}
