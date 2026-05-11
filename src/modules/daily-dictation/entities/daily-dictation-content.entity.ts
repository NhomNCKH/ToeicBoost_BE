import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DailyDictationSegment } from './daily-dictation-segment.entity';

export type DailyDictationStatus = 'draft' | 'published' | 'archived';

@Entity({ name: 'daily_dictation_contents' })
export class DailyDictationContent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  youtubeId!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl!: string | null;

  @Column({ type: 'int', default: 0 })
  durationSec!: number;

  @Index()
  @Column({ type: 'varchar', length: 8, default: 'A1' })
  level!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  topics!: string[];

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'draft' })
  status!: DailyDictationStatus;

  @OneToMany(() => DailyDictationSegment, (seg) => seg.content, { cascade: false })
  segments!: DailyDictationSegment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
