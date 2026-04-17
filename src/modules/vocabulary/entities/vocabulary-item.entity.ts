import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../database/entities/base.entity';
import { VocabularyDeck } from './vocabulary-deck.entity';

@Entity('vocabulary_items')
export class VocabularyItem extends BaseEntity {
  @Index('idx_vocabulary_items_deck_id')
  @Column({ name: 'deck_id', type: 'uuid' })
  deckId: string;

  @ManyToOne(() => VocabularyDeck, (deck) => deck.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deck_id' })
  deck: VocabularyDeck;

  /** Từ / cụm từ (tiếng Anh) */
  @Column({ name: 'word', type: 'varchar', length: 200 })
  word: string;

  /** Loại từ: noun, verb, adjective, ... */
  @Column({ name: 'word_type', type: 'varchar', length: 50 })
  wordType: string;

  /** Nghĩa (ưu tiên tiếng Việt) */
  @Column({ name: 'meaning', type: 'text' })
  meaning: string;

  /** Phiên âm IPA (quốc tế), ví dụ /ˈwɔːtər/ */
  @Column({ name: 'pronunciation', type: 'varchar', length: 200, nullable: true })
  pronunciation: string | null;

  /** Ví dụ câu có ngữ cảnh */
  @Column({ name: 'example_sentence', type: 'text' })
  exampleSentence: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt: Date | null;
}
