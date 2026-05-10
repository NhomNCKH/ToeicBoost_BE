import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ShadowingContent } from './entities/shadowing-content.entity';
import { ShadowingSegment } from './entities/shadowing-segment.entity';
import { ShadowingYoutubeService } from './shadowing-youtube.service';
import { buildShadowingSegments } from './shadowing-segment-builder';
import { AiTutorService } from '@modules/ai-tutor/ai-tutor.service';
import { toIPA } from 'phonemize';

@Injectable()
export class ShadowingService {
  constructor(
    @InjectRepository(ShadowingContent)
    private readonly contentRepo: Repository<ShadowingContent>,
    @InjectRepository(ShadowingSegment)
    private readonly segmentRepo: Repository<ShadowingSegment>,
    private readonly youtube: ShadowingYoutubeService,
    private readonly aiTutor: AiTutorService,
  ) {}

  async adminImportFromYoutube(input: {
    youtubeUrl: string;
    title?: string;
    level: string;
    topics?: string[];
  }) {
    const youtubeId = this.youtube.getYoutubeId(input.youtubeUrl);
    const exists = await this.contentRepo.findOne({ where: { youtubeId } });
    if (exists) {
      return {
        contentId: exists.id,
        alreadyExists: true,
      };
    }

    let transcriptLines: Array<{ startSec: number; durSec: number; text: string }> = [];
    try {
      transcriptLines = await this.youtube.fetchTranscript(youtubeId, ['en', 'en-US', 'en-GB']);
    } catch (e: any) {
      throw new BadRequestException(
        e?.message ||
          'Không lấy được captions từ YouTube. Video có thể không có subtitle hoặc bị chặn.',
      );
    }

    const segments = buildShadowingSegments(transcriptLines);
    if (segments.length === 0) {
      throw new BadRequestException('Captions rỗng hoặc không thể tạo segment.');
    }

    const content = this.contentRepo.create({
      title: (input.title ?? '').trim() || `YouTube ${youtubeId}`,
      youtubeId,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
      durationSec: 0,
      level: input.level,
      topics: Array.isArray(input.topics) ? input.topics.filter(Boolean) : [],
      status: 'draft',
    });
    const saved = await this.contentRepo.save(content);

    const segEntities = segments.map((s) =>
      this.segmentRepo.create({
        contentId: saved.id,
        order: s.order,
        startSec: s.startSec,
        endSec: s.endSec,
        textEn: s.textEn,
        textVi: null,
        ipa: null,
      }),
    );
    await this.segmentRepo.save(segEntities);

    // Kick off translation best-effort (small batches). If AI is not configured, it's okay.
    void this.translateContentSegments(saved.id).catch(() => {});

    return {
      contentId: saved.id,
      youtubeId,
      importedSegments: segEntities.length,
      pendingTranslation: true,
    };
  }

  async adminReimportEnglishCaptions(contentId: string) {
    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Không tìm thấy nội dung shadowing.');

    let transcriptLines: Array<{ startSec: number; durSec: number; text: string }> = [];
    try {
      transcriptLines = await this.youtube.fetchTranscript(content.youtubeId, ['en', 'en-US', 'en-GB']);
    } catch (e: any) {
      throw new BadRequestException(e?.message ?? 'Không lấy được captions tiếng Anh.');
    }

    const segments = buildShadowingSegments(transcriptLines);
    if (segments.length === 0) throw new BadRequestException('Captions rỗng hoặc không thể tạo segment.');

    await this.segmentRepo.delete({ contentId });
    const segEntities = segments.map((s) =>
      this.segmentRepo.create({
        contentId,
        order: s.order,
        startSec: s.startSec,
        endSec: s.endSec,
        textEn: s.textEn,
        textVi: null,
        ipa: null,
      }),
    );
    await this.segmentRepo.save(segEntities);
    void this.translateContentSegments(contentId).catch(() => {});

    return { reimported: true, importedSegments: segEntities.length };
  }

  async adminList(params: {
    page: number;
    limit: number;
    keyword?: string;
    level?: string;
    topic?: string;
    status?: string;
  }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (params.keyword?.trim()) where.title = ILike(`%${params.keyword.trim()}%`);
    if (params.level) where.level = params.level;
    if (params.status) where.status = params.status;
    // topic filter via jsonb contains
    if (params.topic) where.topics = (params.topic ? () => `topics @> '["${params.topic}"]'` : undefined);

    const [items, total] = await this.contentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { page, limit, total, items };
  }

  async adminGetDetail(contentId: string) {
    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Không tìm thấy nội dung shadowing.');
    const segments = await this.segmentRepo.find({
      where: { contentId },
      order: { order: 'ASC' },
    });
    return { content, segments };
  }

  async adminUpdateContent(
    contentId: string,
    patch: { title?: string; level?: string; topics?: string[]; status?: string },
  ) {
    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Không tìm thấy nội dung shadowing.');
    if (patch.title !== undefined) content.title = String(patch.title).trim() || content.title;
    if (patch.level !== undefined) content.level = String(patch.level).trim() || content.level;
    if (patch.topics !== undefined) content.topics = Array.isArray(patch.topics) ? patch.topics.filter(Boolean) : [];
    if (patch.status !== undefined) content.status = patch.status as any;
    const saved = await this.contentRepo.save(content);
    return { updated: true, content: saved };
  }

  async adminPublish(contentId: string) {
    await this.adminUpdateContent(contentId, { status: 'published' });
    // Best-effort enrichments so learner sees IPA/VI when available.
    void this.translateContentSegments(contentId).catch(() => {});
    void this.generateIpaForContentSegments(contentId).catch(() => {});
    return { published: true };
  }

  async adminDeleteContent(contentId: string) {
    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Không tìm thấy nội dung shadowing.');
    // segments have FK cascade, but delete explicitly for clarity
    await this.segmentRepo.delete({ contentId });
    await this.contentRepo.delete({ id: contentId });
    return { deleted: true };
  }

  async adminReplaceSegments(
    contentId: string,
    segments: Array<{
      id?: string;
      order: number;
      startSec: number;
      endSec: number;
      textEn: string;
      textVi?: string | null;
    }>,
  ) {
    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Không tìm thấy nội dung shadowing.');
    if (!Array.isArray(segments) || segments.length === 0) {
      throw new BadRequestException('segments rỗng.');
    }

    // Basic validation
    const normalized = segments
      .map((s) => ({
        id: s.id,
        order: Number(s.order) || 0,
        startSec: Math.max(0, Math.floor(Number(s.startSec) || 0)),
        endSec: Math.max(0, Math.floor(Number(s.endSec) || 0)),
        textEn: String(s.textEn ?? '').trim(),
        textVi: s.textVi == null ? null : String(s.textVi).trim(),
      }))
      .filter((s) => s.order > 0 && s.textEn.length > 0);

    if (normalized.length === 0) throw new BadRequestException('segments không hợp lệ.');

    // Replace strategy: delete all old segments then insert new.
    await this.segmentRepo.delete({ contentId });
    const entities = normalized.map((s) =>
      this.segmentRepo.create({
        contentId,
        order: s.order,
        startSec: s.startSec,
        endSec: Math.max(s.startSec + 1, s.endSec),
        textEn: s.textEn,
        textVi: s.textVi,
        ipa: null,
      }),
    );
    await this.segmentRepo.save(entities);
    return { replaced: true, count: entities.length };
  }

  async learnerList(params: {
    page: number;
    limit: number;
    keyword?: string;
    level?: string;
    topic?: string;
    sort?: string;
  }) {
    const { page, limit } = params;
    const skip = (page - 1) * limit;
    const where: any = { status: 'published' };
    if (params.keyword?.trim()) where.title = ILike(`%${params.keyword.trim()}%`);
    if (params.level) where.level = params.level;
    if (params.topic) where.topics = () => `topics @> '["${params.topic}"]'`;

    const [items, total] = await this.contentRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    return { page, limit, total, items };
  }

  async learnerGetDetail(contentId: string) {
    const content = await this.contentRepo.findOne({ where: { id: contentId, status: 'published' } as any });
    if (!content) throw new NotFoundException('Không tìm thấy nội dung shadowing.');
    const segments = await this.segmentRepo.find({
      where: { contentId },
      order: { order: 'ASC' },
    });
    return { content, segments };
  }

  private safeToIpa(textEn: string): string | null {
    const input = String(textEn ?? '').trim();
    if (!input) return null;
    try {
      const out = String(toIPA(input) ?? '').trim();
      return out || null;
    } catch {
      return null;
    }
  }

  async generateIpaForContentSegments(contentId: string) {
    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Không tìm thấy nội dung shadowing.');

    const segments = await this.segmentRepo.find({
      where: { contentId },
      order: { order: 'ASC' },
    });
    if (!segments.length) return { updated: 0 };

    let updated = 0;
    for (const seg of segments) {
      if (seg.ipa && String(seg.ipa).trim()) continue;
      const ipa = this.safeToIpa(seg.textEn);
      if (!ipa) continue;
      seg.ipa = ipa;
      updated += 1;
    }
    if (updated > 0) await this.segmentRepo.save(segments);
    return { updated };
  }

  async translateContentSegments(contentId: string) {
    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content) throw new NotFoundException('Không tìm thấy nội dung shadowing.');

    const segments = await this.segmentRepo.find({
      where: { contentId },
      order: { order: 'ASC' },
    });
    if (segments.length === 0) return { translated: 0 };

    let translated = 0;
    // Translate only missing ones; cap per call to avoid timeouts.
    for (const seg of segments.slice(0, 120)) {
      let changed = false;
      if (!seg.textVi || !seg.textVi.trim()) {
        const vi = await this.translateEnToVi(seg.textEn);
        seg.textVi = vi;
        translated += 1;
        changed = true;
      }
      if (!seg.ipa || !String(seg.ipa).trim()) {
        const ipa = this.safeToIpa(seg.textEn);
        if (ipa) {
          seg.ipa = ipa;
          changed = true;
        }
      }
      if (changed) await this.segmentRepo.save(seg);
    }
    return { translated };
  }

  private async translateEnToVi(textEn: string): Promise<string> {
    const source = String(textEn ?? '').trim();
    if (!source) return '';
    const res = await this.aiTutor.translateRaw({
      sourceText: source,
      sourceLanguage: 'en',
      targetLanguage: 'vi',
    });
    const vi = String(res?.text ?? '').trim();
    return vi || '';
  }
}

