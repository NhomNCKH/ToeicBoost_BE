import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface TimiLlmReply {
  spokenReplyEn: string;
  nextPrompt: string | null;
  microCorrection: { wrong: string; right: string; tip: string } | null;
  modelId: string;
  raw: string;
}

@Injectable()
export class GroqLlmAdapter {
  private readonly logger = new Logger(GroqLlmAdapter.name);
  private readonly apiKey: string | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GROQ_API_KEY') ?? null;
    // Default sang model "instant" 8B của Llama 3.1: throughput ~3-4x so với
    // llama-3.3-70b-versatile, latency mỗi turn giảm 600-900ms. Với chat ngắn
    // 2-3 câu English, chất lượng vẫn dư cho TOEIC speaking practice.
    // Nếu muốn dùng lại 70B (chất lượng cao hơn): set env TIMI_LLM_MODEL.
    this.model =
      this.config.get<string>('TIMI_LLM_MODEL') ??
      this.config.get<string>('GROQ_MODEL') ??
      'llama-3.1-8b-instant';
  }

  async chatJson(messages: ChatMessage[]): Promise<TimiLlmReply> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('GROQ_API_KEY chưa được cấu hình');
    }

    const resp = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.6,
          // System prompt đã yêu cầu "1-3 sentences"; 220 tokens ~ 160 từ,
          // dư cho 4-5 câu ngắn. Cắt từ 400 xuống 220 giúp:
          //  - LLM dừng sớm hơn → giảm 200-400ms.
          //  - TTS xử lý text ngắn hơn → giảm thêm 100-300ms.
          max_tokens: 220,
          response_format: { type: 'json_object' },
          messages,
        }),
      },
    );

    const raw = await resp.text();
    let data: any = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }

    if (!resp.ok) {
      this.logger.warn(
        `Groq LLM failed [${resp.status}]: ${data?.error?.message ?? raw}`,
      );
      throw new HttpException(
        {
          message:
            data?.error?.message ?? `Groq request failed (${resp.status})`,
          code: 'TIMI_LLM_ERROR',
        },
        resp.status === 429
          ? HttpStatus.TOO_MANY_REQUESTS
          : HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const text = String(data?.choices?.[0]?.message?.content ?? '').trim();
    const parsed = this.tryParseJson(text);

    return {
      spokenReplyEn: this.toShort(parsed?.spoken_reply_en, 'Sorry, could you say that again?'),
      nextPrompt: this.toShortOrNull(parsed?.next_prompt),
      microCorrection: this.normalizeMicroCorrection(parsed?.micro_correction),
      modelId: `groq:${data?.model ?? this.model}`,
      raw: text,
    };
  }

  private tryParseJson(text: string): Record<string, unknown> | null {
    if (!text) return null;
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start >= 0 && end > start) {
        try {
          return JSON.parse(cleaned.slice(start, end + 1));
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private toShort(value: unknown, fallback = ''): string {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  private toShortOrNull(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private normalizeMicroCorrection(
    value: unknown,
  ): { wrong: string; right: string; tip: string } | null {
    if (!value || typeof value !== 'object') return null;
    const v = value as Record<string, unknown>;
    const wrong = this.toShort(v.wrong);
    const right = this.toShort(v.right);
    const tip = this.toShort(v.tip);
    if (!wrong || !right) return null;
    return { wrong, right, tip };
  }
}
