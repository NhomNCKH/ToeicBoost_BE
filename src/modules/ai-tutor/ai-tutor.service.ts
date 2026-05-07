import { HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiSkill,
  ExplainAnswerDto,
  GradeSpeakingDto,
  GradeWritingDto,
  LookupVocabularyDto,
} from './dto/ai-tutor.dto';

type AiTextResult = {
  model: string;
  text: string;
};

type SpeakingGradeResult = {
  overallScore: number;
  criteria: {
    pronunciation: number;
    fluency: number;
    grammar: number;
    vocabulary: number;
    relevance: number;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  evidence: string[];
  actionPlan: string[];
  betterAnswer: string;
};

type WritingGradeResult = {
  overallScore: number;
  criteria: {
    grammar: number;
    vocabulary: number;
    coherence: number;
    taskFulfillment: number;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  evidence: string[];
  actionPlan: string[];
  correctedVersion: string;
};

type VocabularyLookupResult = {
  expression: string;
  partOfSpeech: string;
  pronunciation: string;
  meaningVi: string;
  meaningEn: string;
  phrasalVerbs: string[];
  synonyms: string[];
  antonyms: string[];
  examples: Array<{
    en: string;
    vi: string;
  }>;
  note: string;
};

type GeneratedFlashcardMetadata = {
  expression: string;
  partOfSpeech: string;
  pronunciation: string;
  meaningVi: string;
  meaningEn: string;
  exampleEn: string;
  exampleVi: string;
  synonyms: string[];
  antonyms: string[];
  note: string;
  source: 'ai_generated';
  level: string;
  contentType: string;
  tags: string[];
};

type GeneratedFlashcardItem = {
  front: string;
  back: string;
  tags: string[];
  metadata: GeneratedFlashcardMetadata;
};

type GeneratedFlashcardSetResult = {
  title: string;
  cards: GeneratedFlashcardItem[];
  warnings: string[];
};

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);
  private readonly groqApiKey: string | null;
  private readonly groqModelName: string;

  constructor(private readonly config: ConfigService) {
    this.groqApiKey = this.config.get<string>('GROQ_API_KEY') ?? null;
    this.groqModelName = this.config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';
  }

  private async generateWithGroq(apiKey: string, system: string, user: string): Promise<AiTextResult> {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.groqModelName,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    const raw = await resp.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!resp.ok) {
      const err = new Error(
        data?.error?.message || `Groq request failed with status ${resp.status}`,
      ) as Error & { status?: number };
      err.status = resp.status;
      throw err;
    }

    const text = String(data?.choices?.[0]?.message?.content ?? '').trim();
    return {
      model: `groq:${data?.model ?? this.groqModelName}`,
      text,
    };
  }

  private isQuotaExceededError(error: unknown): boolean {
    const e = error as any;
    const status = Number(e?.status ?? e?.statusCode ?? 0);
    if (status === 429) return true;
    const message = String(e?.message ?? '').toLowerCase();
    const code = String(e?.code ?? '').toLowerCase();
    return (
      message.includes('429') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded') ||
      message.includes('rate limit') ||
      message.includes('resource_exhausted') ||
      code.includes('resource_exhausted')
    );
  }

  private isAuthError(error: unknown): boolean {
    const e = error as any;
    const status = Number(e?.status ?? e?.statusCode ?? 0);
    if (status === 401 || status === 403) return true;
    const message = String(e?.message ?? '').toLowerCase();
    return message.includes('api key') || message.includes('permission denied') || message.includes('forbidden');
  }

  private isModelError(error: unknown): boolean {
    const e = error as any;
    const status = Number(e?.status ?? e?.statusCode ?? 0);
    if (status === 400 || status === 404) return true;
    const message = String(e?.message ?? '').toLowerCase();
    return message.includes('model') && (message.includes('not found') || message.includes('not supported'));
  }

  private isTemporaryOverloadError(error: unknown): boolean {
    const e = error as any;
    const status = Number(e?.status ?? e?.statusCode ?? 0);
    if (status === 503 || status === 504) return true;
    const message = String(e?.message ?? '').toLowerCase();
    return (
      message.includes('service unavailable') ||
      message.includes('currently experiencing high demand') ||
      message.includes('please try again later') ||
      message.includes('temporarily unavailable')
    );
  }

  private extractRetryAfterSeconds(error: unknown): number | null {
    const message = String((error as any)?.message ?? '');
    const bySeconds = message.match(/retry in\s+([0-9]+(?:\.[0-9]+)?)s/i);
    if (bySeconds?.[1]) {
      const sec = Math.ceil(Number(bySeconds[1]));
      return Number.isFinite(sec) && sec > 0 ? sec : null;
    }
    const byDelayField = message.match(/"retryDelay":"([0-9]+)s"/i);
    if (byDelayField?.[1]) {
      const sec = Number(byDelayField[1]);
      return Number.isFinite(sec) && sec > 0 ? sec : null;
    }
    return null;
  }

  private async generateText(system: string, user: string): Promise<AiTextResult> {
    const groqApiKey = this.groqApiKey;
    if (!groqApiKey) {
      throw new ServiceUnavailableException('AI service is not configured');
    }

    let lastError: unknown = null;
    try {
      return await this.generateWithGroq(groqApiKey, system, user);
    } catch (error) {
      lastError = error;
      this.logger.warn(`Groq request failed: ${(error as any)?.message ?? String(error)}`);
    }

    if (this.isQuotaExceededError(lastError)) {
      const retryAfterSec = this.extractRetryAfterSeconds(lastError);
      throw new HttpException(
        {
          message: 'AI đang quá tải hoặc hết quota tạm thời. Vui lòng thử lại sau.',
          code: 'AI_QUOTA_EXCEEDED',
          retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (this.isTemporaryOverloadError(lastError)) {
      const retryAfterSec = this.extractRetryAfterSeconds(lastError);
      throw new HttpException(
        {
          message: 'Groq đang quá tải tạm thời. Vui lòng thử lại sau ít phút.',
          code: 'AI_MODEL_OVERLOADED',
          retryAfterSec,
          model: this.groqModelName,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (this.isAuthError(lastError)) {
      throw new HttpException(
        {
          message: 'Groq API key không hợp lệ hoặc chưa được cấp quyền.',
          code: 'AI_AUTH_ERROR',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (this.isModelError(lastError)) {
      throw new HttpException(
        {
          message: 'Model Groq hiện tại không khả dụng. Hãy đổi GROQ_MODEL.',
          code: 'AI_MODEL_UNAVAILABLE',
          model: this.groqModelName,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    throw new HttpException(
      {
        message: 'AI service is temporarily unavailable',
        code: 'AI_UPSTREAM_ERROR',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private toScore200(value: unknown): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    if (n <= 10) return Math.max(0, Math.min(200, Math.round(n * 20)));
    return Math.max(0, Math.min(200, Math.round(n)));
  }

  private toShortText(value: unknown, fallback = ''): string {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || fallback;
  }

  private toLines(value: unknown, max = 6): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean)
      .slice(0, max);
  }

  private parseJsonFromAiText(text: string): Record<string, unknown> | null {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    if (!cleaned) return null;

    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) {
        const candidate = cleaned.slice(start, end + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private normalizeSpeakingResult(raw: Record<string, unknown> | null): SpeakingGradeResult {
    const criteriaRaw = (raw?.criteria ?? {}) as Record<string, unknown>;
    const strengths = this.toLines(raw?.strengths, 6);
    const weaknesses =
      this.toLines(raw?.weaknesses, 6).length > 0
        ? this.toLines(raw?.weaknesses, 6)
        : this.toLines(raw?.improvements, 6);

    return {
      overallScore: this.toScore200(raw?.overallScore),
      criteria: {
        pronunciation: this.toScore200(criteriaRaw.pronunciation),
        fluency: this.toScore200(criteriaRaw.fluency),
        grammar: this.toScore200(criteriaRaw.grammar),
        vocabulary: this.toScore200(criteriaRaw.vocabulary),
        relevance: this.toScore200(criteriaRaw.relevance),
      },
      summary: this.toShortText(raw?.summary, 'Cần thêm dữ liệu để đưa ra đánh giá chính xác hơn.'),
      strengths,
      weaknesses,
      evidence: this.toLines(raw?.evidence, 8),
      actionPlan: this.toLines(raw?.actionPlan, 8),
      betterAnswer: this.toShortText(raw?.betterAnswer),
    };
  }

  private normalizeWritingResult(raw: Record<string, unknown> | null): WritingGradeResult {
    const criteriaRaw = (raw?.criteria ?? {}) as Record<string, unknown>;
    const strengths = this.toLines(raw?.strengths, 6);
    const weaknesses =
      this.toLines(raw?.weaknesses, 6).length > 0
        ? this.toLines(raw?.weaknesses, 6)
        : this.toLines(raw?.improvements, 6);

    return {
      overallScore: this.toScore200(raw?.overallScore),
      criteria: {
        grammar: this.toScore200(criteriaRaw.grammar),
        vocabulary: this.toScore200(criteriaRaw.vocabulary),
        coherence: this.toScore200(criteriaRaw.coherence),
        taskFulfillment: this.toScore200(criteriaRaw.taskFulfillment),
      },
      summary: this.toShortText(raw?.summary, 'Bài viết còn thiếu dữ liệu để đánh giá sâu hơn.'),
      strengths,
      weaknesses,
      evidence: this.toLines(raw?.evidence, 8),
      actionPlan: this.toLines(raw?.actionPlan, 8),
      correctedVersion: this.toShortText(raw?.correctedVersion),
    };
  }

  private normalizeVocabularyResult(
    raw: Record<string, unknown> | null,
    expression: string,
  ): VocabularyLookupResult {
    const examplesRaw = Array.isArray(raw?.examples) ? raw.examples : [];
    const examples = examplesRaw
      .map((x) => {
        const item = x as Record<string, unknown>;
        return {
          en: this.toShortText(item?.en),
          vi: this.toShortText(item?.vi),
        };
      })
      .filter((x) => x.en || x.vi)
      .slice(0, 3);

    return {
      expression: this.toShortText(raw?.expression, expression),
      partOfSpeech: this.toShortText(raw?.partOfSpeech),
      pronunciation: this.toShortText(raw?.pronunciation),
      meaningVi: this.toShortText(raw?.meaningVi),
      meaningEn: this.toShortText(raw?.meaningEn),
      phrasalVerbs: this.toLines(raw?.phrasalVerbs, 6),
      synonyms: this.toLines(raw?.synonyms, 8),
      antonyms: this.toLines(raw?.antonyms, 8),
      examples,
      note: this.toShortText(raw?.note),
    };
  }

  private normalizeGeneratedFlashcardItem(
    raw: unknown,
    defaults: {
      level: string;
      contentType: string;
      tags: string[];
      language: string;
    },
  ): GeneratedFlashcardItem | null {
    const item = raw as Record<string, unknown>;
    const metadataRaw = (item?.metadata ?? {}) as Record<string, unknown>;

    const expression = this.toShortText(
      metadataRaw.expression ?? item?.expression ?? item?.word ?? item?.term,
    );
    const meaningVi = this.toShortText(
      metadataRaw.meaningVi ?? item?.meaningVi ?? item?.meaning ?? item?.translation,
    );
    const meaningEn = this.toShortText(metadataRaw.meaningEn ?? item?.meaningEn);
    const exampleEn = this.toShortText(
      metadataRaw.exampleEn ?? item?.exampleEn ?? item?.exampleSentence ?? item?.example,
    );
    const exampleVi = this.toShortText(metadataRaw.exampleVi ?? item?.exampleVi);

    const fallbackFront =
      defaults.language === 'vi-en' ? meaningVi || this.toShortText(item?.front) : expression;
    const fallbackBack =
      defaults.language === 'vi-en' ? expression || meaningEn : meaningVi || meaningEn;

    const front = this.toShortText(item?.front, fallbackFront);
    const back = this.toShortText(item?.back, fallbackBack);

    if (!front || !back) return null;

    const mergedTags = Array.from(
      new Set(
        [
          ...defaults.tags,
          ...this.toLines(metadataRaw.tags, 20),
          ...this.toLines(item?.tags, 20),
        ]
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      ),
    ).slice(0, 20);

    return {
      front,
      back,
      tags: mergedTags,
      metadata: {
        expression: this.toShortText(metadataRaw.expression, expression || front),
        partOfSpeech: this.toShortText(
          metadataRaw.partOfSpeech ?? item?.partOfSpeech ?? item?.wordType,
        ),
        pronunciation: this.toShortText(
          metadataRaw.pronunciation ?? item?.pronunciation ?? item?.ipa,
        ),
        meaningVi,
        meaningEn,
        exampleEn,
        exampleVi,
        synonyms: this.toLines(metadataRaw.synonyms ?? item?.synonyms, 12),
        antonyms: this.toLines(metadataRaw.antonyms ?? item?.antonyms, 12),
        note: this.toShortText(metadataRaw.note ?? item?.note),
        source: 'ai_generated',
        level: defaults.level,
        contentType: defaults.contentType,
        tags: mergedTags,
      },
    };
  }

  explain(dto: ExplainAnswerDto) {
    const language = (dto.language ?? 'vi').toLowerCase();
    const langHint =
      language.startsWith('en') ? 'Answer in English.' : 'Trả lời bằng tiếng Việt.';

    const system = [
      'You are a TOEIC tutor.',
      'Be concise, accurate, and structured.',
      'If missing information (e.g., correct answer), explain possible reasoning and ask for what is missing at the end.',
      'Avoid revealing chain-of-thought. Provide a short explanation and 1-2 tips.',
      langHint,
    ].join('\n');

    const user = [
      `Skill: ${dto.skill}`,
      `Question/context: ${dto.question}`,
      dto.userAnswer ? `User answer: ${dto.userAnswer}` : '',
      dto.correctAnswer ? `Correct answer: ${dto.correctAnswer}` : '',
      '',
      'Give: (1) short explanation, (2) key vocab/grammar notes, (3) one similar mini-example.',
    ]
      .filter(Boolean)
      .join('\n');

    return this.generateText(system, user);
  }

  gradeWriting(dto: GradeWritingDto) {
    const language = (dto.language ?? 'vi').toLowerCase();
    const langHint =
      language.startsWith('en') ? 'Answer in English.' : 'Trả lời bằng tiếng Việt.';

    const taskType = (dto.taskType ?? '').trim();
    const system = [
      'You are a strict but fair TOEIC Writing evaluator.',
      'Use analytic scoring and produce concrete evidence from the learner essay.',
      'Return JSON only (no markdown, no extra text).',
      'All scores are integers in range 0-200.',
      'Schema: {overallScore:number, criteria:{grammar:number,vocabulary:number,coherence:number,taskFulfillment:number}, summary:string, strengths:string[], weaknesses:string[], evidence:string[], actionPlan:string[], correctedVersion:string}',
      'Each item in evidence must reference specific phrases/sentences from learner essay.',
      'actionPlan must be practical and concise (max 8 bullets).',
      'correctedVersion must preserve user intent while fixing major issues.',
      langHint,
    ].join('\n');

    const user = [
      taskType ? `TaskType: ${taskType}` : '',
      `Prompt: ${dto.prompt}`,
      '',
      'Essay:',
      dto.essay,
    ]
      .filter(Boolean)
      .join('\n');

    return this.generateText(system, user).then((res) => {
      const parsed = this.parseJsonFromAiText(res.text);
      const result = this.normalizeWritingResult(parsed);
      return {
        model: res.model,
        text: res.text,
        result,
        formatVersion: 'writing-v2',
      };
    });
  }

  gradeSpeaking(dto: GradeSpeakingDto) {
    const language = (dto.language ?? 'vi').toLowerCase();
    const langHint =
      language.startsWith('en') ? 'Answer in English.' : 'Trả lời bằng tiếng Việt.';

    const taskType = (dto.taskType ?? '').trim();
    const system = [
      'You are a strict but fair TOEIC Speaking evaluator.',
      'Input transcript is from browser STT, so evaluate pronunciation cautiously and never hallucinate phonetic details.',
      'Use analytic scoring and cite concrete evidence from transcript.',
      'Return JSON only (no markdown, no extra text).',
      'All scores are integers in range 0-200.',
      'Schema: {overallScore:number, criteria:{pronunciation:number,fluency:number,grammar:number,vocabulary:number,relevance:number}, summary:string, strengths:string[], weaknesses:string[], evidence:string[], actionPlan:string[], betterAnswer:string}',
      'If transcript is too short/empty/noisy, lower confidence and mention it in summary.',
      'actionPlan must be practical and concise (max 8 bullets).',
      langHint,
    ].join('\n');

    const user = [
      taskType ? `TaskType: ${taskType}` : '',
      `Prompt: ${dto.prompt}`,
      dto.durationSeconds != null ? `DurationSeconds: ${dto.durationSeconds}` : '',
      '',
      'Transcript:',
      dto.transcript,
    ]
      .filter(Boolean)
      .join('\n');

    return this.generateText(system, user).then((res) => {
      const parsed = this.parseJsonFromAiText(res.text);
      const result = this.normalizeSpeakingResult(parsed);
      return {
        model: res.model,
        text: res.text,
        result,
        formatVersion: 'speaking-v2',
      };
    });
  }

  lookupVocabulary(dto: LookupVocabularyDto) {
    const language = (dto.language ?? 'vi').toLowerCase();
    const langHint =
      language.startsWith('en') ? 'Explain in English first, then Vietnamese.' : 'Giải thích ưu tiên tiếng Việt, có thêm tiếng Anh ngắn gọn.';

    const expression = dto.expression.trim();
    const context = (dto.context ?? '').trim();

    const system = [
      'You are an English vocabulary coach for TOEIC learners.',
      'Return JSON only (no markdown, no extra text).',
      'Schema: {expression:string, partOfSpeech:string, pronunciation:string, meaningVi:string, meaningEn:string, phrasalVerbs:string[], synonyms:string[], antonyms:string[], examples:[{en:string,vi:string}], note:string}',
      'Keep output concise and practical for quick popup dictionary.',
      'If expression is multi-word phrase, explain as phrase first.',
      'Examples must be natural and relevant to TOEIC/business context when possible.',
      langHint,
    ].join('\n');

    const user = [
      `Expression: ${expression}`,
      context ? `Context: ${context}` : '',
      '',
      'Return max 3 examples, max 8 synonyms/antonyms.',
    ]
      .filter(Boolean)
      .join('\n');

    return this.generateText(system, user).then((res) => {
      const parsed = this.parseJsonFromAiText(res.text);
      const result = this.normalizeVocabularyResult(parsed, expression);
      return {
        model: res.model,
        text: res.text,
        result,
        formatVersion: 'vocab-v1',
      };
    });
  }

  generateFlashcardSet(input: {
    topic: string;
    language: 'en-vi' | 'vi-en' | 'en-en';
    level?: string;
    cardCount: number;
    contentType: 'vocabulary' | 'phrase' | 'collocation' | 'sentence' | 'mixed';
    requirements?: string;
  }) {
    const level = (input.level ?? '').trim();
    const topic = input.topic.trim();
    const requirements = (input.requirements ?? '').trim();

    const languageInstruction =
      input.language === 'en-vi'
        ? 'Set front in English and back in Vietnamese.'
        : input.language === 'vi-en'
          ? 'Set front in Vietnamese and back in English.'
          : 'Set both front and back in English, with back explaining meaning in concise learner-friendly English.';

    const contentTypeInstruction =
      input.contentType === 'vocabulary'
        ? 'Focus on single words.'
        : input.contentType === 'phrase'
          ? 'Focus on practical multi-word phrases.'
          : input.contentType === 'collocation'
            ? 'Focus on natural collocations used in work or TOEIC contexts.'
            : input.contentType === 'sentence'
              ? 'Focus on useful complete example sentences.'
              : 'Mix words, phrases, and collocations in a balanced way.';

    const defaultTags = Array.from(
      new Set(
        [
          'ai-generated',
          input.contentType,
          level.toLowerCase(),
          ...topic
            .toLowerCase()
            .split(/[^a-z0-9]+/i)
            .map((part) => part.trim())
            .filter((part) => part.length >= 2)
            .slice(0, 4),
        ].filter(Boolean),
      ),
    );

    const system = [
      'You are generating study flashcards for an English learning app.',
      'Return JSON only. Do not use markdown. Do not add explanations outside JSON.',
      'Return exactly one JSON object with schema:',
      '{"title":string,"cards":[{"front":string,"back":string,"tags":string[],"metadata":{"expression":string,"partOfSpeech":string,"pronunciation":string,"meaningVi":string,"meaningEn":string,"exampleEn":string,"exampleVi":string,"synonyms":string[],"antonyms":string[],"note":string,"source":"ai_generated","level":string,"contentType":string,"tags":string[]}}]}',
      'All cards must be concise, correct, non-duplicate, and useful for learners.',
      'If a field is unknown, return empty string or empty array instead of omitting the schema shape.',
      'Keep examples short and natural.',
      'Do not generate offensive or unsafe content.',
      languageInstruction,
      contentTypeInstruction,
    ].join('\n');

    const user = [
      `Topic: ${topic}`,
      level ? `Level: ${level}` : '',
      `Card count: ${input.cardCount}`,
      `Content type: ${input.contentType}`,
      `Language direction: ${input.language}`,
      requirements ? `Detailed requirements: ${requirements}` : '',
      `Default tags: ${defaultTags.join(', ')}`,
      '',
      'Ensure metadata.source is "ai_generated".',
      'Prefer TOEIC/business-friendly content when the topic fits.',
    ]
      .filter(Boolean)
      .join('\n');

    return this.generateText(system, user).then((res) => {
      const parsed = this.parseJsonFromAiText(res.text);
      const rawCards = Array.isArray(parsed?.cards) ? parsed.cards : [];
      const cards = rawCards
        .map((card) =>
          this.normalizeGeneratedFlashcardItem(card, {
            level,
            contentType: input.contentType,
            tags: defaultTags,
            language: input.language,
          }),
        )
        .filter((card): card is GeneratedFlashcardItem => Boolean(card))
        .slice(0, input.cardCount);

      const warnings: string[] = [];
      if (rawCards.length === 0) {
        warnings.push('AI không trả về danh sách thẻ hợp lệ.');
      } else if (cards.length !== input.cardCount) {
        warnings.push(
          `AI trả về ${cards.length}/${input.cardCount} thẻ hợp lệ sau khi chuẩn hóa.`,
        );
      }

      const title = this.toShortText(parsed?.title, topic || 'AI Flashcards');
      const result: GeneratedFlashcardSetResult = {
        title,
        cards,
        warnings,
      };

      return {
        model: res.model,
        text: res.text,
        result,
        formatVersion: 'flashcards-v1',
      };
    });
  }
}
