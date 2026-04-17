import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { VocabularyItem } from './vocabulary-item.entity';

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

@Entity('vocabulary_decks')
export class VocabularyDeck extends BaseEntity {
  @Column({ name: 'title', type: 'varchar', length: 200 })
  title: string;

  @Index('idx_vocabulary_decks_cefr_level')
  @Column({ name: 'cefr_level', type: 'varchar', length: 10 })
  cefrLevel: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Index('idx_vocabulary_decks_published')
  @Column({ name: 'published', type: 'boolean', default: false })
  published: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => VocabularyItem, (item) => item.deck)
  items: VocabularyItem[];
}
