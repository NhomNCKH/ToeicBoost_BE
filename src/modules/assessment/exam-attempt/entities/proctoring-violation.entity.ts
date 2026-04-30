// entities/proctoring-violation.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('proctoring_violations')
export class ProctoringViolation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'exam_id' })
  examId: string;

  @Column({ name: 'exam_attempt_id', type: 'uuid', nullable: true })
  examAttemptId: string | null;

  @Column({ name: 'violation_type' })
  violationType: string;

  @Column({ nullable: true })
  message: string;

  @Column({ default: 1 })
  severity: number;

  @Column({ type: 'float', default: 0 })
  confidence: number;

  @Column({ name: 'screenshot_url', type: 'text', nullable: true })
  screenshotUrl: string | null;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;
}
