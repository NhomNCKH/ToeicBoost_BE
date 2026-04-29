import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@database/entities/base.entity';
import { ToeicWritingSet } from './toeic-writing-set.entity';
import { ToeicWritingTask } from './toeic-writing-task.entity';
import { ToeicWritingTaskType } from '@common/constants/skill-task.enum';

@Entity('toeic_writing_set_items')
@Index('uq_toeic_writing_set_items_set_task', ['setId', 'taskId'], { unique: true })
@Index('idx_toeic_writing_set_items_set_id', ['setId'])
@Index('idx_toeic_writing_set_items_task_type', ['taskType'])
export class ToeicWritingSetItem extends BaseEntity {
  @Column({ name: 'set_id', type: 'uuid' })
  setId: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @Column({
    name: 'task_type',
    type: 'enum',
    enum: ToeicWritingTaskType,
    enumName: 'toeic_writing_task_type',
  })
  taskType: ToeicWritingTaskType;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToOne(() => ToeicWritingSet, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'set_id' })
  set: ToeicWritingSet;

  @ManyToOne(() => ToeicWritingTask, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'task_id' })
  task: ToeicWritingTask;
}

