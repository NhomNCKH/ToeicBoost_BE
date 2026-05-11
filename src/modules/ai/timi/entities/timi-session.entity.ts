import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { TimiTurn } from './timi-turn.entity';

export enum TimiPersona {
  CASUAL = 'casual',
  INTERVIEW = 'interview',
  TRAVEL = 'travel',
  TOEIC_PART2 = 'toeic_part2',
}

@Entity('timi_sessions')
export class TimiSession extends BaseEntity {
  @Index('IDX_timi_sessions_user_id')
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    name: 'persona',
    type: 'varchar',
    length: 32,
    default: TimiPersona.CASUAL,
  })
  persona: TimiPersona;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Index('IDX_timi_sessions_last_active_at')
  @Column({ name: 'last_active_at', type: 'timestamptz' })
  lastActiveAt: Date;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @OneToMany(() => TimiTurn, (turn) => turn.session)
  turns: TimiTurn[];
}
