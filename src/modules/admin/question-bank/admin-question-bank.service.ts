import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { extname } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { paginate } from '@helpers/pagination.helper';
import {
  AssetKind,
  QuestionGroupStatus,
  QuestionPart,
} from '@common/constants/question-bank.enum';
import { S3StorageService } from '@modules/s3/s3-storage.service';
import { Tag } from './entities/tag.entity';
import { QuestionGroup } from './entities/question-group.entity';
import { QuestionGroupAsset } from './entities/question-group-asset.entity';
import { Question } from './entities/question.entity';
import { QuestionOption } from './entities/question-option.entity';
import { QuestionGroupTag } from './entities/question-group-tag.entity';
import { QuestionGroupReview } from './entities/question-group-review.entity';
import {
  AttachQuestionGroupAssetDto,
  BulkStatusQuestionGroupsDto,
  BulkTagQuestionGroupsDto,
  CreateQuestionGroupDto,
  ImportQuestionGroupsDto,
  PresignQuestionGroupAssetDto,
  PresignQuestionGroupImportDto,
  QuestionGroupQueryDto,
  ReviewQuestionGroupDto,
  TagDto,
  UpdateQuestionGroupDto,
  UpdateTagDto,
} from './dto/question-bank.dto';

@Injectable()
export class AdminQuestionBankService {
  private static readonly ALLOWED_STATUS_TRANSITIONS: Record<
    QuestionGroupStatus,
    QuestionGroupStatus[]
  > = {
    [QuestionGroupStatus.DRAFT]: [
      QuestionGroupStatus.IN_REVIEW,
      QuestionGroupStatus.ARCHIVED,
    ],
    [QuestionGroupStatus.IN_REVIEW]: [
      QuestionGroupStatus.APPROVED,
      QuestionGroupStatus.DRAFT,
      QuestionGroupStatus.ARCHIVED,
    ],
    [QuestionGroupStatus.APPROVED]: [
      QuestionGroupStatus.PUBLISHED,
      QuestionGroupStatus.ARCHIVED,
    ],
    [QuestionGroupStatus.PUBLISHED]: [QuestionGroupStatus.ARCHIVED],
    [QuestionGroupStatus.ARCHIVED]: [QuestionGroupStatus.DRAFT],
  };

  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(QuestionGroup)
    private readonly questionGroupRepository: Repository<QuestionGroup>,
    @InjectRepository(QuestionGroupAsset)
    private readonly questionGroupAssetRepository: Repository<QuestionGroupAsset>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly questionOptionRepository: Repository<QuestionOption>,
    @InjectRepository(QuestionGroupTag)
    private readonly questionGroupTagRepository: Repository<QuestionGroupTag>,
    @InjectRepository(QuestionGroupReview)
    private readonly questionGroupReviewRepository: Repository<QuestionGroupReview>,
    private readonly dataSource: DataSource,
    private readonly s3StorageService: S3StorageService,
  ) {}

  async listTags() {
    return this.tagRepository.find({
      order: { category: 'ASC', code: 'ASC' },
    });
  }

  async createTag(dto: TagDto, userId: string) {
    const existing = await this.tagRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new BadRequestException(`Tag code already exists: ${dto.code}`);
    }

    const tag = this.tagRepository.create({
      category: dto.category.trim(),
      code: dto.code.trim(),
      label: dto.label.trim(),
      description: dto.description?.trim() ?? null,
      createdById: userId,
    });

    return this.tagRepository.save(tag);
  }

  async updateTag(id: string, dto: UpdateTagDto) {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (dto.code && dto.code !== tag.code) {
      const existing = await this.tagRepository.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException(`Tag code already exists: ${dto.code}`);
      }
    }

    Object.assign(tag, {
      category: dto.category?.trim() ?? tag.category,
      code: dto.code?.trim() ?? tag.code,
      label: dto.label?.trim() ?? tag.label,
      description:
        dto.description !== undefined
          ? dto.description.trim()
          : tag.description,
    });

    return this.tagRepository.save(tag);
  }

  async deleteTag(id: string) {
    const tag = await this.tagRepository.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.tagRepository.delete(id);
    return { deleted: true };
  }

  async listQuestionGroups(query: QuestionGroupQueryDto) {
    const qb = this.questionGroupRepository
      .createQueryBuilder('qg')
      .leftJoinAndSelect('qg.questionGroupTags', 'qgt')
      .leftJoinAndSelect('qgt.tag', 'tag')
      .loadRelationCountAndMap('qg.questionCount', 'qg.questions')
      .where('qg.deletedAt IS NULL')
      .andWhere(`qg.skillScope = 'listening_reading'`);

    if (query.part) qb.andWhere('qg.part = :part', { part: query.part });
    if (query.level) qb.andWhere('qg.level = :level', { level: query.level });
    if (query.status)
      qb.andWhere('qg.status = :status', { status: query.status });
    if (query.createdBy) {
      qb.andWhere('qg.createdById = :createdBy', {
        createdBy: query.createdBy,
      });
    }
    if (query.tag) {
      qb.andWhere('tag.code = :tag', { tag: query.tag });
    }
    if (query.keyword) {
      qb.leftJoin('qg.questions', 'q');
      qb.andWhere(
        '(qg.code ILIKE :keyword OR qg.title ILIKE :keyword OR qg.stem ILIKE :keyword OR q.prompt ILIKE :keyword)',
        { keyword: `%${query.keyword.trim()}%` },
      );
    }

    const objectiveOnly = query.objectiveOnly !== false;
    if (objectiveOnly) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM questions q_exist WHERE q_exist.question_group_id = qg.id)',
      );
      qb.andWhere(
        `NOT EXISTS (
          SELECT 1
          FROM questions q_bad
          WHERE q_bad.question_group_id = qg.id
            AND (
              SELECT COUNT(1)
              FROM question_options qo
              WHERE qo.question_id = q_bad.id
            ) < 2
        )`,
      );
    }

    qb.distinct(true);

    const allowedSorts = new Set([
      'createdAt',
      'updatedAt',
      'code',
      'title',
      'part',
      'level',
      'status',
    ]);
    const sort = allowedSorts.has(query.sort ?? '') ? query.sort : 'createdAt';

    return paginate(qb, {
      ...query,
      sort,
    });
  }

  async createQuestionGroup(dto: CreateQuestionGroupDto, userId: string) {
    await this.validateQuestionGroupPayload(dto);

    const questionGroupId = await this.dataSource.transaction(
      async (manager) => {
        const skillScope = this.resolveSkillScopeFromPayload(dto);
        const questionGroup = manager.getRepository(QuestionGroup).create({
          code: dto.code.trim(),
          title: dto.title.trim(),
          part: dto.part,
          level: dto.level,
          status: dto.status ?? QuestionGroupStatus.DRAFT,
          stem: dto.stem?.trim() ?? null,
          explanation: dto.explanation?.trim() ?? null,
          sourceType: dto.sourceType?.trim() ?? 'manual',
          skillScope,
          sourceRef: dto.sourceRef?.trim() ?? null,
          metadata: dto.metadata ?? {},
          createdById: userId,
          updatedById: userId,
        });

        const savedGroup = await manager
          .getRepository(QuestionGroup)
          .save(questionGroup);
        await this.replaceQuestionGroupChildren(
          manager,
          savedGroup.id,
          dto,
          userId,
        );

        return savedGroup.id;
      },
    );

    return this.getQuestionGroupDetail(questionGroupId);
  }

  async getQuestionGroupDetail(id: string) {
    const questionGroup = await this.questionGroupRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: {
        assets: true,
        questions: { options: true },
        questionGroupTags: { tag: true },
        reviews: true,
      },
    });

    if (!questionGroup) {
      throw new NotFoundException('Question group not found');
    }

    this.sortQuestionGroupRelations(questionGroup);
    return questionGroup;
  }

  async updateQuestionGroup(
    id: string,
    dto: UpdateQuestionGroupDto,
    userId: string,
  ) {
    const existing = await this.questionGroupRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!existing) {
      throw new NotFoundException('Question group not found');
    }

    if (existing.status === QuestionGroupStatus.PUBLISHED) {
      throw new ForbiddenException(
        'Published question group cannot be edited directly',
      );
    }

    if (dto.status && dto.status !== existing.status) {
      throw new BadRequestException(
        'Status updates must use workflow endpoints (submit-review/approve/reject/publish/archive)',
      );
    }

    await this.validateQuestionGroupPayload(dto, id, true);

    const questionGroupId = await this.dataSource.transaction(
      async (manager) => {
        Object.assign(existing, {
          code: dto.code?.trim() ?? existing.code,
          title: dto.title?.trim() ?? existing.title,
          part: dto.part ?? existing.part,
          level: dto.level ?? existing.level,
          status: existing.status,
          stem:
            dto.stem !== undefined ? (dto.stem?.trim() ?? null) : existing.stem,
          explanation:
            dto.explanation !== undefined
              ? (dto.explanation?.trim() ?? null)
              : existing.explanation,
          sourceType:
            dto.sourceType !== undefined
              ? dto.sourceType.trim()
              : existing.sourceType,
          sourceRef:
            dto.sourceRef !== undefined
              ? (dto.sourceRef?.trim() ?? null)
              : existing.sourceRef,
          metadata: dto.metadata ?? existing.metadata,
          updatedById: userId,
        });

        if (
          dto.questions !== undefined ||
          dto.sourceType !== undefined ||
          dto.sourceRef !== undefined ||
          dto.metadata !== undefined
        ) {
          if (dto.questions !== undefined) {
            existing.skillScope = this.resolveSkillScopeFromPayload({
              questions: dto.questions as any,
              sourceType: existing.sourceType,
              sourceRef: existing.sourceRef ?? undefined,
              metadata: existing.metadata ?? {},
            });
          } else if (
            this.hasSpeakingWritingHint(
              existing.sourceType,
              existing.sourceRef ?? undefined,
              existing.metadata ?? {},
            )
          ) {
            existing.skillScope = 'other_skills';
          } else {
            // Keep previous scope if no question payload update.
            existing.skillScope = existing.skillScope ?? 'listening_reading';
          }
        }

        await manager.getRepository(QuestionGroup).save(existing);

        if (
          dto.assets !== undefined ||
          dto.questions !== undefined ||
          dto.tagCodes !== undefined
        ) {
          const replaceDto = {
            ...(dto.assets !== undefined ? { assets: dto.assets } : {}),
            ...(dto.questions !== undefined
              ? { questions: dto.questions }
              : {}),
            ...(dto.tagCodes !== undefined ? { tagCodes: dto.tagCodes } : {}),
          } as CreateQuestionGroupDto;

          await this.replaceQuestionGroupChildren(
            manager,
            existing.id,
            replaceDto,
            userId,
            true,
          );
        }

        return existing.id;
      },
    );

    return this.getQuestionGroupDetail(questionGroupId);
  }

  async deleteQuestionGroup(id: string, userId: string) {
    const questionGroup = await this.questionGroupRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!questionGroup) {
      throw new NotFoundException('Question group not found');
    }

    questionGroup.deletedAt = new Date();
    questionGroup.updatedById = userId;
    if (questionGroup.status !== QuestionGroupStatus.ARCHIVED) {
      questionGroup.status = QuestionGroupStatus.ARCHIVED;
    }
    await this.questionGroupRepository.save(questionGroup);

    return { deleted: true };
  }

  async submitReview(id: string, userId: string, dto: ReviewQuestionGroupDto) {
    return this.transitionQuestionGroupStatus(
      id,
      QuestionGroupStatus.IN_REVIEW,
      'submit_review',
      userId,
      dto.comment,
    );
  }

  async approve(id: string, userId: string, dto: ReviewQuestionGroupDto) {
    return this.transitionQuestionGroupStatus(
      id,
      QuestionGroupStatus.APPROVED,
      'approve',
      userId,
      dto.comment,
    );
  }

  async reject(id: string, userId: string, dto: ReviewQuestionGroupDto) {
    return this.transitionQuestionGroupStatus(
      id,
      QuestionGroupStatus.DRAFT,
      'reject',
      userId,
      dto.comment,
    );
  }

  async publish(id: string, userId: string, dto: ReviewQuestionGroupDto) {
    const questionGroup = await this.getQuestionGroupDetail(id);
    this.ensurePublishable(questionGroup);

    return this.transitionQuestionGroupStatus(
      id,
      QuestionGroupStatus.PUBLISHED,
      'publish',
      userId,
      dto.comment,
    );
  }

  async archive(id: string, userId: string, dto: ReviewQuestionGroupDto) {
    return this.transitionQuestionGroupStatus(
      id,
      QuestionGroupStatus.ARCHIVED,
      'archive',
      userId,
      dto.comment,
    );
  }

  async bulkTag(dto: BulkTagQuestionGroupsDto, userId: string) {
    const groups = await this.questionGroupRepository.find({
      where: { id: In(dto.questionGroupIds), deletedAt: IsNull() },
      select: { id: true },
    });
    if (groups.length !== dto.questionGroupIds.length) {
      throw new NotFoundException('One or more question groups not found');
    }

    const tags = await this.tagRepository.find({
      where: { code: In(dto.tagCodes) },
    });
    if (tags.length !== dto.tagCodes.length) {
      throw new BadRequestException('One or more tag codes do not exist');
    }

    return this.dataSource.transaction(async (manager) => {
      for (const groupId of dto.questionGroupIds) {
        for (const tag of tags) {
          const exists = await manager.getRepository(QuestionGroupTag).findOne({
            where: { questionGroupId: groupId, tagId: tag.id },
          });
          if (!exists) {
            await manager.getRepository(QuestionGroupTag).save(
              manager.getRepository(QuestionGroupTag).create({
                createdById: userId,
                questionGroupId: groupId,
                tagId: tag.id,
              }),
            );
          }
        }
      }

      return {
        updated: dto.questionGroupIds.length,
        tagsApplied: tags.map((tag) => tag.code),
      };
    });
  }

  async bulkStatus(dto: BulkStatusQuestionGroupsDto, userId: string) {
    const groups = await this.questionGroupRepository.find({
      where: { id: In(dto.questionGroupIds), deletedAt: IsNull() },
    });
    if (groups.length !== dto.questionGroupIds.length) {
      throw new NotFoundException('One or more question groups not found');
    }

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(QuestionGroup);
      const reviewRepository = manager.getRepository(QuestionGroupReview);
      const now = new Date();

      for (const group of groups) {
        this.assertValidStatusTransition(group.status, dto.status);
        if (dto.status === QuestionGroupStatus.PUBLISHED) {
          const details = await repository.findOne({
            where: { id: group.id, deletedAt: IsNull() },
            relations: { assets: true, questions: { options: true } },
          });
          if (!details) throw new NotFoundException('Question group not found');
          this.ensurePublishable(details);
        }
        group.status = dto.status;
        group.updatedById = userId;
        group.reviewedById = userId;
        group.publishedAt =
          dto.status === QuestionGroupStatus.PUBLISHED
            ? now
            : group.publishedAt;
      }

      await repository.save(groups);
      await reviewRepository.save(
        groups.map((group) =>
          reviewRepository.create({
            createdById: userId,
            questionGroupId: group.id,
            action: `bulk_${dto.status}`,
            comment: null,
            performedById: userId,
          }),
        ),
      );
    });

    return { updated: groups.length, status: dto.status };
  }

  async presignAsset(
    questionGroupId: string,
    dto: PresignQuestionGroupAssetDto,
  ) {
    await this.assertQuestionGroupExists(questionGroupId);

    const extension =
      this.getExtensionFromMime(dto.contentType) ??
      extname(dto.fileName ?? '').trim();
    if (!extension) {
      throw new BadRequestException(
        'Cannot determine file extension from contentType/fileName',
      );
    }

    const safeExt = extension.startsWith('.')
      ? extension.toLowerCase()
      : `.${extension.toLowerCase()}`;
    const objectKey = `question-bank/${questionGroupId}/${dto.kind}/${uuidv4()}${safeExt}`;

    const { signedPutUrl, objectUrl } =
      await this.s3StorageService.getSignedPutUrl({
        objectKey,
        contentType: dto.contentType,
        expiresInSeconds: dto.expiresInSeconds,
      });

    return {
      signedPutUrl,
      url: objectUrl,
      s3Key: objectKey,
      contentType: dto.contentType,
      kind: dto.kind,
    };
  }

  async attachAsset(
    questionGroupId: string,
    dto: AttachQuestionGroupAssetDto,
    userId: string,
  ) {
    await this.assertQuestionGroupExists(questionGroupId);

    const asset = this.questionGroupAssetRepository.create({
      createdById: userId,
      questionGroupId,
      kind: dto.kind,
      storageKey: dto.storageKey,
      publicUrl:
        dto.publicUrl ?? this.s3StorageService.buildPublicUrl(dto.storageKey),
      mimeType: dto.mimeType ?? null,
      durationSec: dto.durationSec ?? null,
      sortOrder: dto.sortOrder ?? 0,
      contentText: dto.contentText ?? null,
      metadata: dto.metadata ?? {},
    });

    return this.questionGroupAssetRepository.save(asset);
  }

  async deleteAsset(questionGroupId: string, assetId: string) {
    const asset = await this.questionGroupAssetRepository.findOne({
      where: { id: assetId, questionGroupId },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    await this.questionGroupAssetRepository.delete(asset.id);
    return { deleted: true };
  }

  async presignImport(userId: string, dto: PresignQuestionGroupImportDto) {
    this.assertImportContentType(dto.contentType);

    const extension =
      this.getExtensionFromMime(dto.contentType) ??
      extname(dto.fileName ?? '').trim();
    const safeExt = extension
      ? extension.startsWith('.')
        ? extension
        : `.${extension}`
      : '.json';

    const objectKey = `imports/question-bank/${userId}/${uuidv4()}${safeExt.toLowerCase()}`;

    const { signedPutUrl, objectUrl } =
      await this.s3StorageService.getSignedPutUrl({
        objectKey,
        contentType: dto.contentType,
        expiresInSeconds: dto.expiresInSeconds,
      });

    return {
      signedPutUrl,
      url: objectUrl,
      s3Key: objectKey,
      contentType: dto.contentType,
    };
  }

  async previewImport(dto: ImportQuestionGroupsDto) {
    const errors: Array<Record<string, unknown>> = [];
    const seenCodes = new Set<string>();

    for (let index = 0; index < dto.groups.length; index += 1) {
      const group = dto.groups[index];
      if (seenCodes.has(group.code)) {
        errors.push({
          index,
          code: group.code,
          messages: ['Duplicate code within import payload'],
        });
        continue;
      }
      seenCodes.add(group.code);

      try {
        await this.validateQuestionGroupPayload(group);
      } catch (error) {
        errors.push({
          index,
          code: group.code,
          messages: [error instanceof Error ? error.message : String(error)],
        });
      }
    }

    return {
      sourceFileName: dto.sourceFileName ?? null,
      totalGroups: dto.groups.length,
      validGroups: dto.groups.length - errors.length,
      invalidGroups: errors.length,
      errors,
    };
  }

  async commitImport(dto: ImportQuestionGroupsDto, userId: string) {
    const preview = await this.previewImport(dto);
    if (preview.invalidGroups > 0) {
      throw new BadRequestException({
        message: 'Import payload contains invalid question groups',
        details: preview.errors,
      });
    }

    const createdIds: string[] = [];
    for (const group of dto.groups) {
      const created = await this.createQuestionGroup(
        {
          ...group,
          sourceType: group.sourceType ?? 'import',
          sourceRef: group.sourceRef ?? dto.sourceFileName,
        },
        userId,
      );
      createdIds.push(created.id);
    }

    return {
      created: createdIds.length,
      questionGroupIds: createdIds,
    };
  }

  private async transitionQuestionGroupStatus(
    id: string,
    status: QuestionGroupStatus,
    action: string,
    userId: string,
    comment?: string,
  ) {
    const questionGroupId = await this.dataSource.transaction(
      async (manager) => {
        const repository = manager.getRepository(QuestionGroup);
        const reviewRepository = manager.getRepository(QuestionGroupReview);

        const questionGroup = await repository.findOne({
          where: { id, deletedAt: IsNull() },
          relations: { assets: true, questions: { options: true } },
        });

        if (!questionGroup) {
          throw new NotFoundException('Question group not found');
        }

        this.assertValidStatusTransition(questionGroup.status, status);

        if (status === QuestionGroupStatus.PUBLISHED) {
          this.ensurePublishable(questionGroup);
        }

        questionGroup.status = status;
        questionGroup.updatedById = userId;
        questionGroup.reviewedById = userId;
        if (status === QuestionGroupStatus.PUBLISHED) {
          questionGroup.publishedAt = new Date();
        }

        await repository.save(questionGroup);

        const review = reviewRepository.create({
          createdById: userId,
          questionGroupId: id,
          action,
          comment: comment?.trim() ?? null,
          performedById: userId,
        });
        await reviewRepository.save(review);

        return id;
      },
    );

    return this.getQuestionGroupDetail(questionGroupId);
  }

  private async replaceQuestionGroupChildren(
    manager: EntityManager,
    questionGroupId: string,
    dto: CreateQuestionGroupDto,
    userId?: string,
    keepExistingWhenMissing = false,
  ) {
    const assetRepository = manager.getRepository(QuestionGroupAsset);
    const questionRepository = manager.getRepository(Question);
    const optionRepository = manager.getRepository(QuestionOption);
    const questionGroupTagRepository = manager.getRepository(QuestionGroupTag);

    if (!keepExistingWhenMissing || dto.assets !== undefined) {
      await assetRepository.delete({ questionGroupId });
      const assets = (dto.assets ?? []).map((asset) =>
        assetRepository.create({
          createdById: userId ?? null,
          questionGroupId,
          kind: asset.kind,
          storageKey: asset.storageKey,
          publicUrl:
            asset.publicUrl ??
            this.s3StorageService.buildPublicUrl(asset.storageKey),
          mimeType: asset.mimeType ?? null,
          durationSec: asset.durationSec ?? null,
          sortOrder: asset.sortOrder ?? 0,
          contentText: asset.contentText ?? null,
          metadata: asset.metadata ?? {},
        }),
      );
      if (assets.length > 0) {
        await assetRepository.save(assets);
      }
    }

    if (!keepExistingWhenMissing || dto.questions !== undefined) {
      const existingQuestions = await questionRepository.find({
        where: { questionGroupId },
        select: { id: true },
      });
      if (existingQuestions.length > 0) {
        await optionRepository.delete({
          questionId: In(existingQuestions.map((question) => question.id)),
        });
        await questionRepository.delete({ questionGroupId });
      }

      for (const questionItem of dto.questions ?? []) {
        const savedQuestion = await questionRepository.save(
          questionRepository.create({
            createdById: userId ?? null,
            questionGroupId,
            questionNo: questionItem.questionNo,
            prompt: questionItem.prompt.trim(),
            answerKey: questionItem.answerKey.trim(),
            rationale: questionItem.rationale?.trim() ?? null,
            timeLimitSec: questionItem.timeLimitSec ?? null,
            scoreWeight: String(questionItem.scoreWeight ?? 1),
            metadata: questionItem.metadata ?? {},
          }),
        );

        const options = questionItem.options.map((option, index) =>
          optionRepository.create({
            createdById: userId ?? null,
            questionId: savedQuestion.id,
            optionKey: option.optionKey.trim(),
            content: option.content.trim(),
            isCorrect: option.isCorrect,
            sortOrder: option.sortOrder ?? index + 1,
          }),
        );
        await optionRepository.save(options);
      }
    }

    if (!keepExistingWhenMissing || dto.tagCodes !== undefined) {
      await questionGroupTagRepository.delete({ questionGroupId });
      const tagCodes = dto.tagCodes ?? [];
      if (tagCodes.length > 0) {
        const tags = await manager.getRepository(Tag).find({
          where: { code: In(tagCodes) },
        });
        for (const tagCode of tagCodes) {
          const tag = tags.find((item) => item.code === tagCode);
          if (!tag) {
            throw new BadRequestException(
              `Tag code does not exist: ${tagCode}`,
            );
          }
          await questionGroupTagRepository.save(
            questionGroupTagRepository.create({
              createdById: userId ?? null,
              questionGroupId,
              tagId: tag.id,
            }),
          );
        }
      }
    }
  }

  private async validateQuestionGroupPayload(
    dto: Partial<CreateQuestionGroupDto>,
    existingId?: string,
    allowPartial = true,
  ) {
    const targetPart =
      dto.part ??
      (dto.questions && existingId
        ? (
            await this.questionGroupRepository.findOne({
              where: { id: existingId, deletedAt: IsNull() },
              select: { part: true },
            })
          )?.part
        : undefined);

    if (!allowPartial || dto.code) {
      if (!dto.code) throw new BadRequestException('Code is required');
      const existing = await this.questionGroupRepository.findOne({
        where: { code: dto.code.trim(), deletedAt: IsNull() },
        select: { id: true },
      });
      if (existing && existing.id !== existingId) {
        throw new BadRequestException(
          `Question group code already exists: ${dto.code}`,
        );
      }
    }

    if (!allowPartial || dto.questions) {
      if (!dto.questions || dto.questions.length === 0) {
        throw new BadRequestException('At least one question is required');
      }

      if (targetPart) {
        this.validateQuestionCountByPart(targetPart, dto.questions.length);
      }

      const seenQuestionNos = new Set<number>();
      for (const question of dto.questions) {
        if (seenQuestionNos.has(question.questionNo)) {
          throw new BadRequestException(
            `Duplicate questionNo detected: ${question.questionNo}`,
          );
        }
        seenQuestionNos.add(question.questionNo);

        const requiredOptionCount =
          targetPart === QuestionPart.P2 ? 3 : 4;
        if (question.options.length !== requiredOptionCount) {
          throw new BadRequestException(
            `Question ${question.questionNo} in part ${targetPart ?? 'unknown'} must have exactly ${requiredOptionCount} options`,
          );
        }

        const seenOptionKeys = new Set<string>();
        for (const option of question.options) {
          if (seenOptionKeys.has(option.optionKey)) {
            throw new BadRequestException(
              `Duplicate optionKey "${option.optionKey}" in question ${question.questionNo}`,
            );
          }
          seenOptionKeys.add(option.optionKey);
        }

        if (!seenOptionKeys.has(question.answerKey)) {
          throw new BadRequestException(
            `answerKey "${question.answerKey}" does not match any option in question ${question.questionNo}`,
          );
        }

        const correctOptions = question.options.filter(
          (option) => option.isCorrect,
        ).length;
        if (correctOptions !== 1) {
          throw new BadRequestException(
            `Question ${question.questionNo} must have exactly one correct option`,
          );
        }
      }
    }

    if (dto.tagCodes && dto.tagCodes.length > 0) {
      const tags = await this.tagRepository.find({
        where: { code: In(dto.tagCodes) },
        select: { code: true, id: true },
      });
      if (tags.length !== dto.tagCodes.length) {
        const missing = dto.tagCodes.filter(
          (code) => !tags.some((tag) => tag.code === code),
        );
        throw new BadRequestException(
          `Missing tag codes: ${missing.join(', ')}`,
        );
      }
    }

    if ((!allowPartial || dto.part) && (!allowPartial || dto.assets)) {
      this.validateAssetsByPart(dto.part, dto.assets);
    }
  }

  private validateAssetsByPart(
    part?: QuestionPart,
    assets?: Array<{ kind: AssetKind }>,
  ) {
    if (!part) return;
    const kinds = new Set((assets ?? []).map((asset) => asset.kind));

    if (part === QuestionPart.P1 && !kinds.has(AssetKind.IMAGE)) {
      throw new BadRequestException(
        'Part P1 requires at least one image asset',
      );
    }

    if (
      [QuestionPart.P2, QuestionPart.P3, QuestionPart.P4].includes(part) &&
      !kinds.has(AssetKind.AUDIO) &&
      !kinds.has(AssetKind.TRANSCRIPT)
    ) {
      throw new BadRequestException(
        `Part ${part} requires audio or transcript asset`,
      );
    }
  }

  private validateQuestionCountByPart(
    part: QuestionPart,
    questionCount: number,
  ) {
    if (
      (part === QuestionPart.P1 ||
        part === QuestionPart.P2 ||
        part === QuestionPart.P5) &&
      questionCount !== 1
    ) {
      throw new BadRequestException(
        `Part ${part} must contain exactly 1 question per group`,
      );
    }

    if (
      (part === QuestionPart.P3 || part === QuestionPart.P4) &&
      questionCount !== 3
    ) {
      throw new BadRequestException(
        `Part ${part} must contain exactly 3 questions per group`,
      );
    }

    if (part === QuestionPart.P6 && questionCount !== 4) {
      throw new BadRequestException(
        'Part P6 must contain exactly 4 questions per group',
      );
    }

    if (
      part === QuestionPart.P7 &&
      (questionCount < 2 || questionCount > 5)
    ) {
      throw new BadRequestException(
        'Part P7 must contain from 2 to 5 questions per group',
      );
    }
  }

  private ensurePublishable(
    questionGroup: Pick<QuestionGroup, 'part' | 'assets' | 'questions'>,
  ) {
    this.validateAssetsByPart(questionGroup.part, questionGroup.assets);

    if (!questionGroup.questions || questionGroup.questions.length === 0) {
      throw new BadRequestException(
        'Question group must contain at least one question',
      );
    }
  }

  private async assertQuestionGroupExists(id: string) {
    const exists = await this.questionGroupRepository.findOne({
      where: { id, deletedAt: IsNull() },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException('Question group not found');
    }
  }

  private sortQuestionGroupRelations(questionGroup: QuestionGroup) {
    questionGroup.assets?.sort((a, b) => a.sortOrder - b.sortOrder);
    questionGroup.questions?.sort((a, b) => a.questionNo - b.questionNo);
    questionGroup.questions?.forEach((question) => {
      question.options?.sort((a, b) => a.sortOrder - b.sortOrder);
    });
    questionGroup.questionGroupTags?.sort((a, b) =>
      a.tag.code.localeCompare(b.tag.code),
    );
    questionGroup.reviews?.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  private resolveSkillScopeFromPayload(
    dto: Pick<
      CreateQuestionGroupDto,
      'questions' | 'sourceType' | 'sourceRef' | 'metadata'
    >,
  ): string {
    if (
      this.hasSpeakingWritingHint(dto.sourceType, dto.sourceRef, dto.metadata ?? {})
    ) {
      return 'other_skills';
    }
    const questions = dto.questions ?? [];
    if (questions.length === 0) return 'other_skills';
    const isObjective = questions.every((question) => {
      const options = question.options ?? [];
      return options.length >= 2;
    });
    return isObjective ? 'listening_reading' : 'other_skills';
  }

  private hasSpeakingWritingHint(
    sourceType?: string,
    sourceRef?: string,
    metadata?: Record<string, unknown>,
  ): boolean {
    const source = `${sourceType ?? ''} ${sourceRef ?? ''}`.toLowerCase();
    if (/(speaking|writing)/i.test(source)) return true;
    const metaText = JSON.stringify(metadata ?? {}).toLowerCase();
    return /(toeic-speaking|toeic-writing|"skill":"speaking"|"skill":"writing")/i.test(
      metaText,
    );
  }

  private getExtensionFromMime(mime: string): string | null {
    const normalized = mime.toLowerCase();
    if (normalized === 'image/jpeg') return '.jpg';
    if (normalized === 'image/png') return '.png';
    if (normalized === 'image/webp') return '.webp';
    if (normalized === 'audio/mpeg') return '.mp3';
    if (normalized === 'audio/wav') return '.wav';
    if (normalized === 'audio/ogg') return '.ogg';
    if (normalized === 'application/json') return '.json';
    if (normalized === 'text/csv') return '.csv';
    if (
      normalized ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return '.xlsx';
    }
    return null;
  }

  private assertImportContentType(contentType: string) {
    const allowed = new Set([
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ]);
    if (!allowed.has(contentType)) {
      throw new BadRequestException(
        `Unsupported import contentType: ${contentType}`,
      );
    }
  }

  private assertValidStatusTransition(
    currentStatus: QuestionGroupStatus,
    nextStatus: QuestionGroupStatus,
  ) {
    if (currentStatus === nextStatus) return;
    const allowed =
      AdminQuestionBankService.ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid status transition: ${currentStatus} -> ${nextStatus}`,
      );
    }
  }
}
