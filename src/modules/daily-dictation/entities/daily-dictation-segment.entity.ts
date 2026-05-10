import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DailyDictationContent } from './daily-dictation-content.entity';

@Entity({ name: 'daily_dictation_segments' })
export class DailyDictationSegment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  contentId!: string;

  @ManyToOne(() => DailyDictationContent, (c) => c.segments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content!: DailyDictationContent;

  @Index()
  @Column({ type: 'int' })
  order!: number;

  @Column({ type: 'int' })
  startSec!: number;

  @Column({ type: 'int' })
  endSec!: number;

  @Column({ type: 'text' })
  textEn!: string;

  @Column({ type: 'text', nullable: true })
  textVi!: string | null;

  @Column({ type: 'text', nullable: true })
  ipa!: string | null;
}
