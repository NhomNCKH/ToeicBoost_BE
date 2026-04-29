import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SkillTaskStatus } from '@common/constants/skill-task.enum';
import { paginate } from '@helpers/pagination.helper';
import { ToeicSpeakingTask } from './entities/toeic-speaking-task.entity';
import { ToeicWritingTask } from './entities/toeic-writing-task.entity';
import { ToeicSpeakingSet } from './entities/toeic-speaking-set.entity';
import { ToeicSpeakingSetItem } from './entities/toeic-speaking-set-item.entity';
import { ToeicWritingSet } from './entities/toeic-writing-set.entity';
import { ToeicWritingSetItem } from './entities/toeic-writing-set-item.entity';
import {
  CreateToeicSpeakingTaskDto,
  CreateToeicSpeakingSetDto,
  CreateToeicWritingTaskDto,
  SkillTaskQueryDto,
  UpdateToeicSpeakingSetDto,
  UpdateToeicSpeakingTaskDto,
  UpdateToeicWritingTaskDto,
  CreateToeicWritingSetDto,
  UpdateToeicWritingSetDto,
} from './dto/skill-tasks.dto';

@Injectable()
export class AdminSkillTasksService {
  private static readonly SPEAKING_SET_REQUIRED: Record<string, number> = {
    read_aloud: 2,
    describe_picture: 1,
    respond_to_questions: 3,
    respond_using_info: 3,
    express_opinion: 1,
    respond_to_question: 1,
  };

  private static readonly WRITING_SET_REQUIRED: Record<string, number> = {
    part1_sentence: 5,
    part2_email: 2,
    part3_essay: 1,
  };

  private async assertSpeakingSetPublishable(setId: string) {
    const set = await this.getSpeakingSet(setId);
    const items: any[] = set?.items ?? [];
    const counts: Record<string, number> = {};
    for (const it of items) {
      const type = it.taskType ?? it.task?.taskType;
      if (!type) continue;
      counts[type] = (counts[type] ?? 0) + 1;
    }

    const missing: string[] = [];
    for (const [type, required] of Object.entries(AdminSkillTasksService.SPEAKING_SET_REQUIRED)) {
      const actual = counts[type] ?? 0;
      if (actual !== required) missing.push(`${type}: ${actual}/${required}`);
    }

    if (missing.length) {
      throw new BadRequestException(
        `Bộ đề Speaking chưa đủ cấu trúc theo chuẩn thi thật. Thiếu/sai số lượng: ${missing.join(', ')}`,
      );
    }
  }

  private async assertWritingSetPublishable(setId: string) {
    const set = await this.getWritingSet(setId);
    const items: any[] = set?.items ?? [];
    const counts: Record<string, number> = {};
    for (const it of items) {
      const type = it.taskType ?? it.task?.taskType;
      if (!type) continue;
      counts[type] = (counts[type] ?? 0) + 1;
    }

    const missing: string[] = [];
    for (const [type, required] of Object.entries(AdminSkillTasksService.WRITING_SET_REQUIRED)) {
      const actual = counts[type] ?? 0;
      if (actual !== required) missing.push(`${type}: ${actual}/${required}`);
    }

    if (missing.length) {
      throw new BadRequestException(
        `Bộ đề Writing chưa đủ cấu trúc theo chuẩn thi thật. Thiếu/sai số lượng: ${missing.join(', ')}`,
      );
    }
  }

  constructor(
    @InjectRepository(ToeicWritingTask)
    private readonly writingRepo: Repository<ToeicWritingTask>,
    @InjectRepository(ToeicSpeakingTask)
    private readonly speakingRepo: Repository<ToeicSpeakingTask>,
    @InjectRepository(ToeicSpeakingSet)
    private readonly speakingSetRepo: Repository<ToeicSpeakingSet>,
    @InjectRepository(ToeicSpeakingSetItem)
    private readonly speakingSetItemRepo: Repository<ToeicSpeakingSetItem>,
    @InjectRepository(ToeicWritingSet)
    private readonly writingSetRepo: Repository<ToeicWritingSet>,
    @InjectRepository(ToeicWritingSetItem)
    private readonly writingSetItemRepo: Repository<ToeicWritingSetItem>,
  ) {}

  async listWriting(query: SkillTaskQueryDto) {
    const qb = this.writingRepo.createQueryBuilder('t');
    if (query.level) qb.andWhere('t.level = :level', { level: query.level });
    if (query.status) qb.andWhere('t.status = :status', { status: query.status });
    if (query.keyword?.trim()) {
      qb.andWhere('t.title ILIKE :kw', { kw: `%${query.keyword.trim()}%` });
    }
    return paginate(qb, query);
  }

  async listSpeaking(query: SkillTaskQueryDto) {
    const qb = this.speakingRepo.createQueryBuilder('t');
    if (query.level) qb.andWhere('t.level = :level', { level: query.level });
    if (query.status) qb.andWhere('t.status = :status', { status: query.status });
    if (query.keyword?.trim()) {
      qb.andWhere('t.title ILIKE :kw', { kw: `%${query.keyword.trim()}%` });
    }
    return paginate(qb, query);
  }

  async createWriting(dto: CreateToeicWritingTaskDto, userId: string) {
    const existing = await this.writingRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Code đã tồn tại');
    const task = this.writingRepo.create({
      ...dto,
      status: dto.status ?? SkillTaskStatus.DRAFT,
      minWords: dto.minWords ?? null,
      maxWords: dto.maxWords ?? null,
      timeLimitSec: dto.timeLimitSec ?? null,
      tips: dto.tips ?? [],
      rubric: dto.rubric ?? {},
      metadata: dto.metadata ?? {},
      publishedAt: (dto.status ?? SkillTaskStatus.DRAFT) === SkillTaskStatus.PUBLISHED ? new Date() : null,
      createdById: userId,
      updatedById: null,
    });
    return this.writingRepo.save(task);
  }

  async createSpeaking(dto: CreateToeicSpeakingTaskDto, userId: string) {
    const existing = await this.speakingRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Code đã tồn tại');
    const task = this.speakingRepo.create({
      ...dto,
      status: dto.status ?? SkillTaskStatus.DRAFT,
      targetSeconds: dto.targetSeconds ?? null,
      timeLimitSec: dto.timeLimitSec ?? null,
      tips: dto.tips ?? [],
      rubric: dto.rubric ?? {},
      metadata: dto.metadata ?? {},
      publishedAt: (dto.status ?? SkillTaskStatus.DRAFT) === SkillTaskStatus.PUBLISHED ? new Date() : null,
      createdById: userId,
      updatedById: null,
    });
    return this.speakingRepo.save(task);
  }

  async updateWriting(id: string, dto: UpdateToeicWritingTaskDto, userId: string) {
    const task = await this.writingRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Không tìm thấy writing task');

    const nextStatus = dto.status ?? task.status;
    const publishedAt =
      nextStatus === SkillTaskStatus.PUBLISHED ? (task.publishedAt ?? new Date()) : nextStatus === SkillTaskStatus.DRAFT ? null : task.publishedAt;

    Object.assign(task, {
      ...dto,
      minWords: dto.minWords ?? task.minWords,
      maxWords: dto.maxWords ?? task.maxWords,
      timeLimitSec: dto.timeLimitSec ?? task.timeLimitSec,
      tips: dto.tips ?? task.tips,
      rubric: dto.rubric ?? task.rubric,
      metadata: dto.metadata ?? task.metadata,
      status: nextStatus,
      publishedAt,
      updatedById: userId,
    });
    return this.writingRepo.save(task);
  }

  async updateSpeaking(id: string, dto: UpdateToeicSpeakingTaskDto, userId: string) {
    const task = await this.speakingRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Không tìm thấy speaking task');

    const nextStatus = dto.status ?? task.status;
    const publishedAt =
      nextStatus === SkillTaskStatus.PUBLISHED ? (task.publishedAt ?? new Date()) : nextStatus === SkillTaskStatus.DRAFT ? null : task.publishedAt;

    Object.assign(task, {
      ...dto,
      targetSeconds: dto.targetSeconds ?? task.targetSeconds,
      timeLimitSec: dto.timeLimitSec ?? task.timeLimitSec,
      tips: dto.tips ?? task.tips,
      rubric: dto.rubric ?? task.rubric,
      metadata: dto.metadata ?? task.metadata,
      status: nextStatus,
      publishedAt,
      updatedById: userId,
    });
    return this.speakingRepo.save(task);
  }

  async deleteWriting(id: string) {
    const task = await this.writingRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Không tìm thấy writing task');
    await this.writingRepo.delete(id);
    return { deleted: true };
  }

  async deleteSpeaking(id: string) {
    const task = await this.speakingRepo.findOne({ where: { id } });
    if (!task) throw new NotFoundException('Không tìm thấy speaking task');
    await this.speakingRepo.delete(id);
    return { deleted: true };
  }

  // ---- Speaking Sets (Bộ đề) ----
  async listSpeakingSets(query: SkillTaskQueryDto) {
    const qb = this.speakingSetRepo.createQueryBuilder('s');
    qb.loadRelationCountAndMap('s.totalQuestions', 's.items');
    if (query.level) qb.andWhere('s.level = :level', { level: query.level });
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    if (query.keyword?.trim()) {
      qb.andWhere('s.title ILIKE :kw', { kw: `%${query.keyword.trim()}%` });
    }
    return paginate(qb, query);
  }

  // ---- Learner APIs (Published only) ----
  async learnerListSpeakingSets(query: SkillTaskQueryDto) {
    const qb = this.speakingSetRepo.createQueryBuilder('s');
    qb.loadRelationCountAndMap('s.totalQuestions', 's.items');
    qb.andWhere('s.status = :status', { status: SkillTaskStatus.PUBLISHED });
    if (query.level) qb.andWhere('s.level = :level', { level: query.level });
    if (query.keyword?.trim()) {
      qb.andWhere('s.title ILIKE :kw', { kw: `%${query.keyword.trim()}%` });
    }
    return paginate(qb, query);
  }

  async createSpeakingSet(dto: CreateToeicSpeakingSetDto, userId: string) {
    const existing = await this.speakingSetRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Code đã tồn tại');
    const nextStatus = dto.status ?? SkillTaskStatus.DRAFT;
    const set = this.speakingSetRepo.create({
      ...dto,
      status: nextStatus,
      timeLimitSec: dto.timeLimitSec ?? null,
      metadata: dto.metadata ?? {},
      publishedAt: nextStatus === SkillTaskStatus.PUBLISHED ? new Date() : null,
      createdById: userId,
      updatedById: null,
    });
    return this.speakingSetRepo.save(set);
  }

  async getSpeakingSet(id: string) {
    const set = await this.speakingSetRepo.findOne({
      where: { id },
      relations: {
        items: { task: true } as any,
      } as any,
      order: {
        items: { sortOrder: 'ASC' as any } as any,
      } as any,
    } as any);
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề Speaking');
    return set;
  }

  async learnerGetSpeakingSet(id: string) {
    const set = await this.getSpeakingSet(id);
    if (set.status !== SkillTaskStatus.PUBLISHED) {
      throw new NotFoundException('Không tìm thấy bộ đề Speaking');
    }
    return set;
  }

  async updateSpeakingSet(id: string, dto: UpdateToeicSpeakingSetDto, userId: string) {
    const set = await this.speakingSetRepo.findOne({ where: { id } });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề Speaking');

    const nextStatus = dto.status ?? set.status;
    if (nextStatus === SkillTaskStatus.PUBLISHED) {
      await this.assertSpeakingSetPublishable(id);
    }
    const publishedAt =
      nextStatus === SkillTaskStatus.PUBLISHED
        ? set.publishedAt ?? new Date()
        : nextStatus === SkillTaskStatus.DRAFT
          ? null
          : set.publishedAt;

    Object.assign(set, {
      ...dto,
      timeLimitSec: dto.timeLimitSec ?? set.timeLimitSec,
      metadata: dto.metadata ?? set.metadata,
      status: nextStatus,
      publishedAt,
      updatedById: userId,
    });
    return this.speakingSetRepo.save(set);
  }

  async deleteSpeakingSet(id: string) {
    const set = await this.speakingSetRepo.findOne({ where: { id } });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề Speaking');
    await this.speakingSetRepo.delete(id);
    return { deleted: true };
  }

  async addSpeakingSetItems(setId: string, taskIds: string[], userId: string) {
    const set = await this.speakingSetRepo.findOne({ where: { id: setId } });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề Speaking');

    const tasks = await this.speakingRepo.find({ where: { id: In(taskIds) } });
    if (tasks.length === 0) throw new BadRequestException('Không có task hợp lệ để thêm');

    const existing = await this.speakingSetItemRepo.find({ where: { setId } });
    const existingTaskId = new Set(existing.map((x) => x.taskId));
    let maxOrder = existing.reduce((m, x) => Math.max(m, x.sortOrder ?? 0), 0);

    const toInsert: ToeicSpeakingSetItem[] = [];
    for (const t of tasks) {
      if (existingTaskId.has(t.id)) continue;
      maxOrder += 1;
      toInsert.push(
        this.speakingSetItemRepo.create({
          setId,
          taskId: t.id,
          taskType: t.taskType,
          sortOrder: maxOrder,
          createdById: userId,
        } as any) as any,
      );
    }

    if (toInsert.length === 0) return { added: 0 };
    await this.speakingSetItemRepo.save(toInsert);
    return { added: toInsert.length };
  }

  async removeSpeakingSetItem(setId: string, itemId: string) {
    const item = await this.speakingSetItemRepo.findOne({ where: { id: itemId, setId } });
    if (!item) throw new NotFoundException('Không tìm thấy item trong bộ đề');
    await this.speakingSetItemRepo.delete(itemId);
    return { deleted: true };
  }

  // ---- Writing Sets (Bộ đề) ----
  async listWritingSets(query: SkillTaskQueryDto) {
    const qb = this.writingSetRepo.createQueryBuilder('s');
    qb.loadRelationCountAndMap('s.totalQuestions', 's.items');
    if (query.level) qb.andWhere('s.level = :level', { level: query.level });
    if (query.status) qb.andWhere('s.status = :status', { status: query.status });
    if (query.keyword?.trim()) {
      qb.andWhere('s.title ILIKE :kw', { kw: `%${query.keyword.trim()}%` });
    }
    return paginate(qb, query);
  }

  async learnerListWritingSets(query: SkillTaskQueryDto) {
    const qb = this.writingSetRepo.createQueryBuilder('s');
    qb.loadRelationCountAndMap('s.totalQuestions', 's.items');
    qb.andWhere('s.status = :status', { status: SkillTaskStatus.PUBLISHED });
    if (query.level) qb.andWhere('s.level = :level', { level: query.level });
    if (query.keyword?.trim()) {
      qb.andWhere('s.title ILIKE :kw', { kw: `%${query.keyword.trim()}%` });
    }
    return paginate(qb, query);
  }

  async createWritingSet(dto: CreateToeicWritingSetDto, userId: string) {
    const existing = await this.writingSetRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('Code đã tồn tại');
    const nextStatus = dto.status ?? SkillTaskStatus.DRAFT;
    const set = this.writingSetRepo.create({
      ...dto,
      status: nextStatus,
      timeLimitSec: dto.timeLimitSec ?? null,
      metadata: dto.metadata ?? {},
      publishedAt: nextStatus === SkillTaskStatus.PUBLISHED ? new Date() : null,
      createdById: userId,
      updatedById: null,
    });
    return this.writingSetRepo.save(set);
  }

  async getWritingSet(id: string) {
    const set = await this.writingSetRepo.findOne({
      where: { id },
      relations: {
        items: { task: true } as any,
      } as any,
      order: {
        items: { sortOrder: 'ASC' as any } as any,
      } as any,
    } as any);
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề Writing');
    return set;
  }

  async learnerGetWritingSet(id: string) {
    const set = await this.getWritingSet(id);
    if (set.status !== SkillTaskStatus.PUBLISHED) {
      throw new NotFoundException('Không tìm thấy bộ đề Writing');
    }
    return set;
  }

  async updateWritingSet(id: string, dto: UpdateToeicWritingSetDto, userId: string) {
    const set = await this.writingSetRepo.findOne({ where: { id } });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề Writing');

    const nextStatus = dto.status ?? set.status;
    if (nextStatus === SkillTaskStatus.PUBLISHED) {
      await this.assertWritingSetPublishable(id);
    }
    const publishedAt =
      nextStatus === SkillTaskStatus.PUBLISHED
        ? set.publishedAt ?? new Date()
        : nextStatus === SkillTaskStatus.DRAFT
          ? null
          : set.publishedAt;

    Object.assign(set, {
      ...dto,
      timeLimitSec: dto.timeLimitSec ?? set.timeLimitSec,
      metadata: dto.metadata ?? set.metadata,
      status: nextStatus,
      publishedAt,
      updatedById: userId,
    });
    return this.writingSetRepo.save(set);
  }

  async deleteWritingSet(id: string) {
    const set = await this.writingSetRepo.findOne({ where: { id } });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề Writing');
    await this.writingSetRepo.delete(id);
    return { deleted: true };
  }

  async addWritingSetItems(setId: string, taskIds: string[], userId: string) {
    const set = await this.writingSetRepo.findOne({ where: { id: setId } });
    if (!set) throw new NotFoundException('Không tìm thấy bộ đề Writing');

    const tasks = await this.writingRepo.find({ where: { id: In(taskIds) } });
    if (tasks.length === 0) throw new BadRequestException('Không có task hợp lệ để thêm');

    const existing = await this.writingSetItemRepo.find({ where: { setId } });
    const existingTaskId = new Set(existing.map((x) => x.taskId));
    let maxOrder = existing.reduce((m, x) => Math.max(m, x.sortOrder ?? 0), 0);

    const toInsert: ToeicWritingSetItem[] = [];
    for (const t of tasks) {
      if (existingTaskId.has(t.id)) continue;
      maxOrder += 1;
      toInsert.push(
        this.writingSetItemRepo.create({
          setId,
          taskId: t.id,
          taskType: t.taskType,
          sortOrder: maxOrder,
          createdById: userId,
        } as any) as any,
      );
    }

    if (toInsert.length === 0) return { added: 0 };
    await this.writingSetItemRepo.save(toInsert);
    return { added: toInsert.length };
  }

  async removeWritingSetItem(setId: string, itemId: string) {
    const item = await this.writingSetItemRepo.findOne({ where: { id: itemId, setId } });
    if (!item) throw new NotFoundException('Không tìm thấy item trong bộ đề');
    await this.writingSetItemRepo.delete(itemId);
    return { deleted: true };
  }
}

