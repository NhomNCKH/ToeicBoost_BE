import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ShadowingSegment } from './shadowing-segment.entity';

export type ShadowingStatus = 'draft' | 'published' | 'archived';

@Entity({ name: 'shadowing_contents' })
export class ShadowingContent {
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
  status!: ShadowingStatus;

  @OneToMany(() => ShadowingSegment, (seg) => seg.content, { cascade: false })
  segments!: ShadowingSegment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

