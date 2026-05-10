import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ShadowingContent } from './shadowing-content.entity';

@Entity({ name: 'shadowing_segments' })
export class ShadowingSegment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  contentId!: string;

  @ManyToOne(() => ShadowingContent, (c) => c.segments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contentId' })
  content!: ShadowingContent;

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

