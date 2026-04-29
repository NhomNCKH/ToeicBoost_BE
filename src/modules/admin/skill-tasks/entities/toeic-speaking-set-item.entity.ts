import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { ToeicSpeakingSet } from './toeic-speaking-set.entity';
import { ToeicSpeakingTask } from './toeic-speaking-task.entity';
import { ToeicSpeakingTaskType } from '@common/constants/skill-task.enum';

@Entity('toeic_speaking_set_items')
@Index('uq_toeic_speaking_set_items_set_task', ['setId', 'taskId'], { unique: true })
@Index('idx_toeic_speaking_set_items_set_id', ['setId'])
@Index('idx_toeic_speaking_set_items_task_type', ['taskType'])
export class ToeicSpeakingSetItem extends BaseEntity {
  @Column({ name: 'set_id', type: 'uuid' })
  setId: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @Column({
    name: 'task_type',
    type: 'enum',
    enum: ToeicSpeakingTaskType,
    enumName: 'toeic_speaking_task_type',
  })
  taskType: ToeicSpeakingTaskType;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => ToeicSpeakingSet, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'set_id' })
  set: ToeicSpeakingSet;

  @ManyToOne(() => ToeicSpeakingTask, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'task_id' })
  task: ToeicSpeakingTask;
}

