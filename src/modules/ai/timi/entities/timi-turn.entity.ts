import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { TimiSession } from './timi-session.entity';

export enum TimiTurnRole {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export interface TimiMicroCorrection {
  wrong: string;
  right: string;
  tip: string;
}

@Entity('timi_turns')
export class TimiTurn extends BaseEntity {
  @Index('IDX_timi_turns_session_id')
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'role', type: 'varchar', length: 16 })
  role: TimiTurnRole;

  @Column({ name: 'transcript', type: 'text', default: '' })
  transcript: string;

  @Column({ name: 'next_prompt', type: 'text', nullable: true })
  nextPrompt: string | null;

  @Column({ name: 'micro_correction', type: 'jsonb', nullable: true })
  microCorrection: TimiMicroCorrection | null;

  @Column({ name: 'model_id', type: 'varchar', length: 128, nullable: true })
  modelId: string | null;

  @Column({ name: 'voice_id', type: 'varchar', length: 64, nullable: true })
  voiceId: string | null;

  @Column({ name: 'latency_ms', type: 'int', default: 0 })
  latencyMs: number;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @ManyToOne(() => TimiSession, (session) => session.turns, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: TimiSession;
}
