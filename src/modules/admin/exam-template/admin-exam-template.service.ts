import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { CredentialRequest } from '@modules/admin/credential/entities/credential-request.entity';
import { paginate } from '@helpers/pagination.helper';
import {
  TemplateItemMode,
  TemplateMode,
  TemplateStatus,
} from '@common/constants/exam-template.enum';
import {
  QuestionGroupStatus,
  QuestionPart,
} from '@common/constants/question-bank.enum';
import { QuestionGroup } from '../question-bank/entities/question-group.entity';
import { ExamTemplate } from './entities/exam-template.entity';
import { ExamTemplateSection } from './entities/exam-template-section.entity';
import { ExamTemplateRule } from './entities/exam-template-rule.entity';
import { ExamTemplateItem } from './entities/exam-template-item.entity';
import { ExamAttempt } from '@modules/assessment/exam-attempt/entities/exam-attempt.entity';
import {
  AddManualExamTemplateItemsDto,
  AutoFillExamTemplateItemsDto,
  CreateExamTemplateDto,
  ExamTemplateQueryDto,
  PutExamTemplateRulesDto,
  PutExamTemplateSectionsDto,
  ReorderExamTemplateItemsDto,
  UpdateExamTemplateDto,
} from './dto/exam-template.dto';

@Injectable()
export class AdminExamTemplateService {
  constructor(
    @InjectRepository(ExamTemplate)
    private readonly examTemplateRepository: Repository<ExamTemplate>,
    @InjectRepository(ExamTemplateSection)
    private readonly examTemplateSectionRepository: Repository<ExamTemplateSection>,
    @InjectRepository(ExamTemplateRule)
    private readonly examTemplateRuleRepository: Repository<ExamTemplateRule>,
    @InjectRepository(ExamTemplateItem)
    private readonly examTemplateItemRepository: Repository<ExamTemplateItem>,
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
    @InjectRepository(ExamAttempt)
    private readonly examAttemptRepository: Repository<ExamAttempt>,
    private readonly dataSource: DataSource,
  ) {}

  async getTemplateStats() {
    const [total, published, draft, archived, totalAttempts, modeCountsRaw] =
      await Promise.all([
        this.examTemplateRepository.count(),
        this.examTemplateRepository.count({
          where: { status: TemplateStatus.PUBLISHED },
        }),
        this.examTemplateRepository.count({
          where: { status: TemplateStatus.DRAFT },
        }),
        this.examTemplateRepository.count({
          where: { status: TemplateStatus.ARCHIVED },
        }),
        this.examAttemptRepository.count(),
        this.examTemplateRepository
          .createQueryBuilder('tpl')
          .select('tpl.mode', 'mode')
          .addSelect('COUNT(*)', 'count')
          .groupBy('tpl.mode')
          .getRawMany<{ mode: string; count: string }>(),
      ]);

    const modeCounts = {
      practice: 0,
      mock_test: 0,
      official_exam: 0,
    };
    for (const item of modeCountsRaw) {
      if (item.mode in modeCounts) {
        modeCounts[item.mode as keyof typeof modeCounts] = Number(item.count);
      }
    }

    return {
      total,
      published,
      draft,
      archived,
      totalAttempts,
      modes: modeCounts,
    };
  }

  async listTemplates(query: ExamTemplateQueryDto) {
    const qb = this.examTemplateRepository
      .createQueryBuilder('tpl')
      .where('1 = 1');

    if (query.mode) qb.andWhere('tpl.mode = :mode', { mode: query.mode });
    if (query.status)
      qb.andWhere('tpl.status = :status', { status: query.status });
    if (query.keyword) {
      qb.andWhere('(tpl.code ILIKE :keyword OR tpl.name ILIKE :keyword)', {
        keyword: `%${query.keyword.trim()}%`,
      });
    }

    const allowedSorts = new Set([
      'createdAt',
      'updatedAt',
      'code',
      'name',
      'mode',
      'status',
    ]);
    const sort = allowedSorts.has(query.sort ?? '') ? query.sort : 'createdAt';

    return paginate(qb, {
      ...query,
      sort,
    });
  }

  async createTemplate(dto: CreateExamTemplateDto, userId: string) {
    await this.ensureTemplateCodeUnique(dto.code);

    if (dto.mode === TemplateMode.OFFICIAL_EXAM && !dto.examDate) {
      throw new BadRequestException('examDate is required for official_exam');
    }

    const template = this.examTemplateRepository.create({
      code: dto.code.trim(),
      name: dto.name.trim(),
      mode: dto.mode,
      totalDurationSec: dto.totalDurationSec,
      totalQuestions: dto.totalQuestions,
      examDate: dto.examDate ? new Date(dto.examDate) : null,
      instructions: dto.instructions?.trim() ?? null,
      shuffleQuestionOrder: dto.shuffleQuestionOrder ?? false,
      shuffleOptionOrder: dto.shuffleOptionOrder ?? false,
      metadata: dto.metadata ?? {},
      createdById: userId,
      updatedById: userId,
    });

    const saved = await this.examTemplateRepository.save(template);
    return this.getTemplateDetail(saved.id);
  }

  async getTemplateDetail(id: string) {
    const template = await this.examTemplateRepository.findOne({
      where: { id },
      relations: {
        sections: true,
        rules: true,
        items: {
          section: true,
          questionGroup: {
            assets: true,
            questions: { options: true },
            questionGroupTags: { tag: true },
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Exam template not found');
    }

    this.sortTemplateRelations(template);
    return template;
  }

  async updateTemplate(id: string, dto: UpdateExamTemplateDto, userId: string) {
    const template = await this.examTemplateRepository.findOne({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException('Exam template not found');
    }

    this.ensureTemplateEditable(template);

    if (dto.code && dto.code !== template.code) {
      await this.ensureTemplateCodeUnique(dto.code, id);
    }

    Object.assign(template, {
      code: dto.code?.trim() ?? template.code,
      name: dto.name?.trim() ?? template.name,
      mode: dto.mode ?? template.mode,
      totalDurationSec: dto.totalDurationSec ?? template.totalDurationSec,
      totalQuestions: dto.totalQuestions ?? template.totalQuestions,
      examDate:
        dto.examDate !== undefined ? (dto.examDate ? new Date(dto.examDate) : null) : template.examDate,
      instructions:
        dto.instructions !== undefined
          ? (dto.instructions?.trim() ?? null)
          : template.instructions,
      shuffleQuestionOrder:
        dto.shuffleQuestionOrder ?? template.shuffleQuestionOrder,
      shuffleOptionOrder: dto.shuffleOptionOrder ?? template.shuffleOptionOrder,
      metadata: dto.metadata ?? template.metadata,
      updatedById: userId,
    });

    if (template.mode === TemplateMode.OFFICIAL_EXAM && !template.examDate) {
      throw new BadRequestException('examDate is required for official_exam');
    }

    await this.examTemplateRepository.save(template);
    return this.getTemplateDetail(id);
  }

  /**
   * Xóa mẫu đề thi mọi trạng thái (nháp / đã xuất bản / lưu trữ).
   * Gỡ liên kết credential → xóa exam_attempts (CASCADE xóa answers, part_scores) → xóa template (CASCADE sections, items, rules, snapshots).
   */
  async deleteTemplate(id: string) {
    const template = await this.examTemplateRepository.findOne({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException('Exam template not found');
    }

    await this.dataSource.transaction(async (manager) => {
      const attempts = await manager.getRepository(ExamAttempt).find({
        where: { examTemplateId: id },
        select: { id: true },
      });
      const attemptIds = attempts.map((a) => a.id);
      if (attemptIds.length > 0) {
        await manager
          .getRepository(CredentialRequest)
          .update({ examAttemptId: In(attemptIds) }, { examAttemptId: null });
        await manager.getRepository(ExamAttempt).delete({
          examTemplateId: id,
        });
      }

      await manager.getRepository(ExamTemplate).delete(id);
    });

    return { deleted: true };
  }

  async replaceSections(
    templateId: string,
    dto: PutExamTemplateSectionsDto,
    userId: string,
  ) {
    const template = await this.examTemplateRepository.findOne({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Exam template not found');
    }
    this.ensureTemplateEditable(template);
    this.validateSections(dto.sections);

    const savedTemplateId = await this.dataSource.transaction(
      async (manager) => {
        await manager
          .getRepository(ExamTemplateSection)
          .delete({ examTemplateId: templateId });

        const sections = dto.sections.map((section) =>
          manager.getRepository(ExamTemplateSection).create({
            createdById: userId,
            examTemplateId: templateId,
            part: section.part,
            sectionOrder: section.sectionOrder,
            expectedGroupCount: section.expectedGroupCount,
            expectedQuestionCount: section.expectedQuestionCount,
            durationSec: section.durationSec ?? null,
            instructions: section.instructions?.trim() ?? null,
          }),
        );
        await manager.getRepository(ExamTemplateSection).save(sections);

        template.updatedById = userId;
        await manager.getRepository(ExamTemplate).save(template);

        return templateId;
      },
    );

    return this.getTemplateDetail(savedTemplateId);
  }

  async replaceRules(
    templateId: string,
    dto: PutExamTemplateRulesDto,
    userId: string,
  ) {
    const template = await this.examTemplateRepository.findOne({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Exam template not found');
    }
    this.ensureTemplateEditable(template);
    this.validateRules(dto.rules);

    const savedTemplateId = await this.dataSource.transaction(
      async (manager) => {
        await manager
          .getRepository(ExamTemplateRule)
          .delete({ examTemplateId: templateId });

        const rules = dto.rules.map((rule) =>
          manager.getRepository(ExamTemplateRule).create({
            createdById: userId,
            examTemplateId: templateId,
            part: rule.part,
            levelDistribution: rule.levelDistribution ?? {},
            requiredTagCodes: rule.requiredTagCodes ?? [],
            excludedTagCodes: rule.excludedTagCodes ?? [],
            questionCount: rule.questionCount,
            groupCount: rule.groupCount ?? null,
          }),
        );
        await manager.getRepository(ExamTemplateRule).save(rules);

        template.updatedById = userId;
        await manager.getRepository(ExamTemplate).save(template);

        return templateId;
      },
    );

    return this.getTemplateDetail(savedTemplateId);
  }

  async addManualItems(
    templateId: string,
    dto: AddManualExamTemplateItemsDto,
    userId: string,
  ) {
    const template = await this.getTemplateDetail(templateId);
    this.ensureTemplateEditable(template);

    const sectionIds = dto.items.map((item) => item.sectionId);
    const groupIds = dto.items.map((item) => item.questionGroupId);

    const sections = template.sections.filter((section) =>
      sectionIds.includes(section.id),
    );
    if (sections.length !== sectionIds.length) {
      throw new BadRequestException(
        'One or more sections do not belong to template',
      );
    }

    const groups = await this.questionGroupRepository.find({
      where: {
        id: In(groupIds),
        status: QuestionGroupStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
      relations: {
        questions: true,
        assets: true,
      },
    });
    if (groups.length !== groupIds.length) {
      throw new BadRequestException(
        'One or more question groups are missing or not published',
      );
    }

    const existingGroupIds = new Set(
      template.items.map((item) => item.questionGroupId),
    );
    for (const groupId of groupIds) {
      if (existingGroupIds.has(groupId)) {
        throw new BadRequestException(
          `Question group already exists in template: ${groupId}`,
        );
      }
    }

    const savedTemplateId = await this.dataSource.transaction(
      async (manager) => {
        const itemRepository = manager.getRepository(ExamTemplateItem);
        let nextDisplayOrder =
          template.items.reduce(
            (max, item) => Math.max(max, item.displayOrder),
            0,
          ) + 1;

        const itemsToSave = dto.items.map((item) =>
          itemRepository.create({
            createdById: userId,
            examTemplateId: templateId,
            sectionId: item.sectionId,
            questionGroupId: item.questionGroupId,
            sourceMode: TemplateItemMode.MANUAL,
            displayOrder: item.displayOrder ?? nextDisplayOrder++,
            locked: item.locked ?? true,
          }),
        );

        await itemRepository.save(itemsToSave);
        await manager.getRepository(ExamTemplate).update(templateId, {
          updatedById: userId,
        });

        return templateId;
      },
    );

    return this.getTemplateDetail(savedTemplateId);
  }

  async reorderItems(
    templateId: string,
    dto: ReorderExamTemplateItemsDto,
    userId: string,
  ) {
    const template = await this.getTemplateDetail(templateId);
    this.ensureTemplateEditable(template);

    const itemIds = dto.items.map((item) => item.itemId);
    const items = template.items.filter((item) => itemIds.includes(item.id));
    if (items.length !== itemIds.length) {
      throw new BadRequestException('One or more template items do not exist');
    }

    const savedTemplateId = await this.dataSource.transaction(
      async (manager) => {
        for (const reorder of dto.items) {
          await manager.getRepository(ExamTemplateItem).update(reorder.itemId, {
            displayOrder: reorder.displayOrder,
          });
        }
        await manager.getRepository(ExamTemplate).update(templateId, {
          updatedById: userId,
        });

        return templateId;
      },
    );

    return this.getTemplateDetail(savedTemplateId);
  }

  async deleteItem(templateId: string, itemId: string, userId: string) {
    const template = await this.getTemplateDetail(templateId);
    this.ensureTemplateEditable(template);

    const item = template.items.find((candidate) => candidate.id === itemId);
    if (!item) {
      throw new NotFoundException('Template item not found');
    }

    await this.examTemplateItemRepository.delete(itemId);
    await this.examTemplateRepository.update(templateId, {
      updatedById: userId,
    });

    return { deleted: true };
  }

  async autoFillItems(
    templateId: string,
    dto: AutoFillExamTemplateItemsDto,
    userId: string,
  ) {
    const template = await this.getTemplateDetail(templateId);
    this.ensureTemplateEditable(template);

    const targetParts =
      dto.parts ?? template.sections.map((section) => section.part);

    if (dto.replaceUnlocked) {
      const unlockedItemIds = template.items
        .filter(
          (item) => !item.locked && targetParts.includes(item.section.part),
        )
        .map((item) => item.id);

      if (unlockedItemIds.length > 0) {
        await this.examTemplateItemRepository.delete(unlockedItemIds);
      }
    }

    const refreshedTemplate = await this.getTemplateDetail(templateId);
    let nextDisplayOrder =
      refreshedTemplate.items.reduce(
        (max, item) => Math.max(max, item.displayOrder),
        0,
      ) + 1;

    const existingGroupIds = new Set(
      refreshedTemplate.items.map((item) => item.questionGroupId),
    );

    for (const section of refreshedTemplate.sections.filter((candidate) =>
      targetParts.includes(candidate.part),
    )) {
      const sectionRules = refreshedTemplate.rules.filter(
        (candidate) => candidate.part === section.part,
      );

      // Nếu không có rule nào, lấy rule mặc định dựa trên cấu trúc section
      if (sectionRules.length === 0) {
        const candidates = await this.findAutoFillCandidates(
          section.part,
          existingGroupIds,
          [],
          [],
        );

        // Mục tiêu chính của auto-fill là đạt đủ số CÂU HỎI cho section.
        // `expectedGroupCount` được giữ như một "gợi ý" ban đầu (đặc biệt hữu ích cho P3/P4/P6/P7),
        // nhưng không được phép khiến hệ thống chỉ resolve thiếu câu (ví dụ P2 mỗi group = 1 câu).
        const targetQuestionCount = section.expectedQuestionCount;
        let currentQuestionCount = 0;

        const preferred = this.selectCandidatesByLevelDistribution(
          candidates,
          Math.max(0, section.expectedGroupCount),
          {},
        );
        const preferredIds = new Set(preferred.map((g) => g.id));
        const remaining = candidates.filter((g) => !preferredIds.has(g.id));

        const ordered = [...preferred, ...remaining];

        for (const candidate of ordered) {
          if (currentQuestionCount >= targetQuestionCount) break;

          const qCount = candidate.questions?.length ?? 0;
          if (qCount <= 0) continue;

          // Không được vượt quá target vì validate yêu cầu đúng bằng expectedQuestionCount
          if (currentQuestionCount + qCount > targetQuestionCount) continue;

          await this.examTemplateItemRepository.save(
            this.examTemplateItemRepository.create({
              createdById: userId,
              examTemplateId: templateId,
              sectionId: section.id,
              questionGroupId: candidate.id,
              sourceMode: TemplateItemMode.RULE_BASED,
              displayOrder: nextDisplayOrder++,
              locked: false,
            }),
          );
          existingGroupIds.add(candidate.id);
          currentQuestionCount += qCount;
        }
        continue;
      }

      // Xử lý từng rule của section
      for (const rule of sectionRules) {
        const currentSectionItems = (
          await this.getTemplateDetail(templateId)
        ).items.filter((item) => item.sectionId === section.id);

        // Với mỗi rule, ta cần lấy đủ số lượng CÂU HỎI (questionCount)
        // chứ không phải số lượng NHÓM (groupCount)
        // Hệ thống sẽ lấy các nhóm cho đến khi tổng số câu hỏi đạt mức yêu cầu
        let currentRuleQuestionCount = 0;
        const targetQuestionCount = rule.questionCount;

        const candidates = await this.findAutoFillCandidates(
          section.part,
          existingGroupIds,
          rule.requiredTagCodes ?? [],
          rule.excludedTagCodes ?? [],
        );

        // Lọc theo level nếu có distribution
        const levelMatches = this.selectCandidatesByLevelDistribution(
          candidates,
          candidates.length, // Lấy hết candidates để ta tự đếm số câu
          rule.levelDistribution ?? {},
        );

        for (const candidate of levelMatches) {
          if (currentRuleQuestionCount >= targetQuestionCount) break;

          const qCount = candidate.questions?.length ?? 0;
          if (qCount <= 0) continue;

          // Tránh overshoot để không fail validate
          if (currentRuleQuestionCount + qCount > targetQuestionCount) continue;
          await this.examTemplateItemRepository.save(
            this.examTemplateItemRepository.create({
              createdById: userId,
              examTemplateId: templateId,
              sectionId: section.id,
              questionGroupId: candidate.id,
              sourceMode: TemplateItemMode.RULE_BASED,
              displayOrder: nextDisplayOrder++,
              locked: false,
            }),
          );
          existingGroupIds.add(candidate.id);
          currentRuleQuestionCount += qCount;
        }
      }
    }

    await this.examTemplateRepository.update(templateId, {
      updatedById: userId,
    });

    return this.getTemplateDetail(templateId);
  }

  async validateTemplate(templateId: string) {
    const template = await this.getTemplateDetail(templateId);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (template.sections.length === 0) {
      errors.push('Template has no sections');
    }

    const expectedQuestionCount = template.sections.reduce(
      (sum, section) => sum + section.expectedQuestionCount,
      0,
    );
    if (expectedQuestionCount !== template.totalQuestions) {
      errors.push(
        `Template totalQuestions=${template.totalQuestions} but sections expect ${expectedQuestionCount}`,
      );
    }

    for (const section of template.sections) {
      const sectionItems = template.items.filter(
        (item) => item.sectionId === section.id,
      );
      const actualGroupCount = sectionItems.length;
      const actualQuestionCount = sectionItems.reduce(
        (sum, item) => sum + (item.questionGroup.questions?.length ?? 0),
        0,
      );

      if (actualGroupCount !== section.expectedGroupCount) {
        warnings.push(
          `Section ${section.part} expects ${section.expectedGroupCount} groups but has ${actualGroupCount}`,
        );
      }

      if (actualQuestionCount !== section.expectedQuestionCount) {
        errors.push(
          `Section ${section.part} expects ${section.expectedQuestionCount} questions but resolved ${actualQuestionCount}`,
        );
      }
    }

    const seenOrders = new Set<number>();
    for (const item of template.items) {
      if (seenOrders.has(item.displayOrder)) {
        errors.push(`Duplicate displayOrder detected: ${item.displayOrder}`);
        break;
      }
      seenOrders.add(item.displayOrder);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        sections: template.sections.length,
        items: template.items.length,
        expectedQuestionCount,
        actualQuestionCount: template.items.reduce(
          (sum, item) => sum + (item.questionGroup.questions?.length ?? 0),
          0,
        ),
      },
    };
  }

  async previewTemplate(templateId: string) {
    const template = await this.getTemplateDetail(templateId);
    const validation = await this.validateTemplate(templateId);

    return {
      template,
      validation,
    };
  }

  async publishTemplate(templateId: string, userId: string) {
    const validation = await this.validateTemplate(templateId);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Template validation failed',
        details: validation,
      });
    }

    const template = await this.examTemplateRepository.findOne({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Exam template not found');
    }

    template.status = TemplateStatus.PUBLISHED;
    template.publishedAt = new Date();
    template.updatedById = userId;
    await this.examTemplateRepository.save(template);

    return this.getTemplateDetail(templateId);
  }

  async archiveTemplate(templateId: string, userId: string) {
    const template = await this.examTemplateRepository.findOne({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('Exam template not found');
    }

    template.status = TemplateStatus.ARCHIVED;
    template.updatedById = userId;
    await this.examTemplateRepository.save(template);

    return this.getTemplateDetail(templateId);
  }

  async duplicateTemplate(templateId: string, userId: string) {
    const template = await this.getTemplateDetail(templateId);

    const duplicatedCode = await this.generateDuplicateCode(template.code);

    const clonedTemplateId = await this.dataSource.transaction(
      async (manager) => {
        const clonedTemplate = await manager.getRepository(ExamTemplate).save(
          manager.getRepository(ExamTemplate).create({
            code: duplicatedCode,
            name: `${template.name} (Copy)`,
            mode: template.mode,
            status: TemplateStatus.DRAFT,
            totalDurationSec: template.totalDurationSec,
            totalQuestions: template.totalQuestions,
            examDate: template.examDate,
            instructions: template.instructions,
            shuffleQuestionOrder: template.shuffleQuestionOrder,
            shuffleOptionOrder: template.shuffleOptionOrder,
            metadata: template.metadata,
            createdById: userId,
            updatedById: userId,
            publishedAt: null,
          }),
        );

        const sectionIdMap = new Map<string, string>();

        for (const section of template.sections) {
          const savedSection = await manager
            .getRepository(ExamTemplateSection)
            .save(
              manager.getRepository(ExamTemplateSection).create({
                createdById: userId,
                examTemplateId: clonedTemplate.id,
                part: section.part,
                sectionOrder: section.sectionOrder,
                expectedGroupCount: section.expectedGroupCount,
                expectedQuestionCount: section.expectedQuestionCount,
                durationSec: section.durationSec,
                instructions: section.instructions,
              }),
            );
          sectionIdMap.set(section.id, savedSection.id);
        }

        for (const rule of template.rules) {
          await manager.getRepository(ExamTemplateRule).save(
            manager.getRepository(ExamTemplateRule).create({
              createdById: userId,
              examTemplateId: clonedTemplate.id,
              part: rule.part,
              levelDistribution: rule.levelDistribution,
              requiredTagCodes: rule.requiredTagCodes,
              excludedTagCodes: rule.excludedTagCodes,
              questionCount: rule.questionCount,
              groupCount: rule.groupCount,
            }),
          );
        }

        for (const item of template.items) {
          const newSectionId = sectionIdMap.get(item.sectionId);
          if (!newSectionId) continue;

          await manager.getRepository(ExamTemplateItem).save(
            manager.getRepository(ExamTemplateItem).create({
              createdById: userId,
              examTemplateId: clonedTemplate.id,
              sectionId: newSectionId,
              questionGroupId: item.questionGroupId,
              sourceMode: item.sourceMode,
              displayOrder: item.displayOrder,
              locked: item.locked,
            }),
          );
        }

        return clonedTemplate.id;
      },
    );

    return this.getTemplateDetail(clonedTemplateId);
  }

  private async ensureTemplateCodeUnique(code: string, existingId?: string) {
    const existing = await this.examTemplateRepository.findOne({
      where: { code: code.trim() },
      select: { id: true },
    });
    if (existing && existing.id !== existingId) {
      throw new BadRequestException(
        `Exam template code already exists: ${code}`,
      );
    }
  }

  private validateSections(sections: PutExamTemplateSectionsDto['sections']) {
    const seenParts = new Set<QuestionPart>();
    const seenOrders = new Set<number>();

    for (const section of sections) {
      if (seenParts.has(section.part)) {
        throw new BadRequestException(
          `Duplicate section part: ${section.part}`,
        );
      }
      if (seenOrders.has(section.sectionOrder)) {
        throw new BadRequestException(
          `Duplicate sectionOrder: ${section.sectionOrder}`,
        );
      }
      seenParts.add(section.part);
      seenOrders.add(section.sectionOrder);
    }
  }

  private validateRules(rules: PutExamTemplateRulesDto['rules']) {
    // Cho phép nhiều rule cho cùng 1 Part để hỗ trợ cấu trúc phức tạp (ví dụ 10 câu Grammar, 10 câu Vocab cho Part 5)
    // Chỉ cần đảm bảo mỗi rule có số lượng câu hỏi hợp lệ
    for (const rule of rules) {
      if (rule.questionCount <= 0) {
        throw new BadRequestException(
          `Invalid questionCount for part ${rule.part}`,
        );
      }
    }
  }

  private ensureTemplateEditable(template: Pick<ExamTemplate, 'status'>) {
    if (template.status === TemplateStatus.PUBLISHED) {
      throw new ForbiddenException('Published template is immutable');
    }
    if (template.status === TemplateStatus.ARCHIVED) {
      throw new ForbiddenException('Archived template cannot be modified');
    }
  }

  private sortTemplateRelations(template: ExamTemplate) {
    template.sections?.sort((a, b) => a.sectionOrder - b.sectionOrder);
    template.rules?.sort((a, b) => a.part.localeCompare(b.part));
    template.items?.sort((a, b) => a.displayOrder - b.displayOrder);
    template.items?.forEach((item) => {
      item.questionGroup.assets?.sort((a, b) => a.sortOrder - b.sortOrder);
      item.questionGroup.questions?.sort((a, b) => a.questionNo - b.questionNo);
      item.questionGroup.questions?.forEach((question) => {
        question.options?.sort((a, b) => a.sortOrder - b.sortOrder);
      });
      item.questionGroup.questionGroupTags?.sort((a, b) =>
        a.tag.code.localeCompare(b.tag.code),
      );
    });
  }

  private async findAutoFillCandidates(
    part: QuestionPart,
    existingGroupIds: Set<string>,
    requiredTagCodes: string[],
    excludedTagCodes: string[],
  ) {
    const candidates = await this.questionGroupRepository.find({
      where: {
        part,
        status: QuestionGroupStatus.PUBLISHED,
        deletedAt: IsNull(),
      },
      relations: {
        questions: true,
        assets: true,
        questionGroupTags: { tag: true },
      },
      order: { createdAt: 'DESC' },
    });

    return candidates.filter((candidate) => {
      if (existingGroupIds.has(candidate.id)) return false;

      const tagCodes = candidate.questionGroupTags.map((item) => item.tag.code);

      const hasRequired = requiredTagCodes.every((code) =>
        tagCodes.includes(code),
      );
      if (!hasRequired) return false;

      const hasExcluded = excludedTagCodes.some((code) =>
        tagCodes.includes(code),
      );
      if (hasExcluded) return false;

      return true;
    });
  }

  private selectCandidatesByLevelDistribution(
    candidates: QuestionGroup[],
    limit: number,
    levelDistribution: Record<string, number>,
  ) {
    if (Object.keys(levelDistribution).length === 0) {
      return candidates.slice(0, limit);
    }

    const selected: QuestionGroup[] = [];
    const remaining = [...candidates];

    for (const [level, quantity] of Object.entries(levelDistribution)) {
      const matches = remaining
        .filter(
          (candidate) => candidate.level === (level as QuestionGroup['level']),
        )
        .slice(0, quantity);
      selected.push(...matches);
      for (const match of matches) {
        const index = remaining.findIndex(
          (candidate) => candidate.id === match.id,
        );
        if (index >= 0) remaining.splice(index, 1);
      }
    }

    if (selected.length < limit) {
      selected.push(...remaining.slice(0, limit - selected.length));
    }

    return selected.slice(0, limit);
  }

  private async generateDuplicateCode(sourceCode: string) {
    const base = `${sourceCode}-COPY`;
    let counter = 1;
    let candidate = `${base}-${counter}`;

    while (
      await this.examTemplateRepository.findOne({
        where: { code: candidate },
        select: { id: true },
      })
    ) {
      counter += 1;
      candidate = `${base}-${counter}`;
    }

    return candidate.slice(0, 50);
  }
}
