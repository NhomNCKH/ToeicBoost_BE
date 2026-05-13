import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TimiSttResult {
  transcript: string;
  modelId: string;
  durationSec: number | null;
}

@Injectable()
export class GroqSttAdapter {
  private readonly logger = new Logger(GroqSttAdapter.name);
  private readonly apiKey: string | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('GROQ_API_KEY') ?? null;
    this.model =
      this.config.get<string>('TIMI_STT_MODEL') ?? 'whisper-large-v3-turbo';
  }

  async transcribe(params: {
    audio: Buffer;
    mimeType: string;
    filename: string;
    language?: string;
  }): Promise<TimiSttResult> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('GROQ_API_KEY chưa được cấu hình');
    }

    const blob = new Blob([new Uint8Array(params.audio)], {
      type: params.mimeType || 'audio/webm',
    });

    const form = new FormData();
    form.append('file', blob, params.filename || 'audio.webm');
    form.append('model', this.model);
    // Chỉ cần plain text → dùng response_format = "json" (chỉ trả {text}).
    // verbose_json trả thêm segments/duration làm payload to hơn và Groq
    // tốn thêm vài chục ms để serialize. BE chỉ dùng `text`.
    form.append('response_format', 'json');
    if (params.language) {
      form.append('language', params.language);
    }
    form.append('temperature', '0');

    const resp = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        body: form,
      },
    );

    const rawText = await resp.text();
    let data: any = null;
    try {
      data = rawText ? JSON.parse(rawText) : null;
    } catch {
      data = null;
    }

    if (!resp.ok) {
      this.logger.warn(
        `Groq STT failed [${resp.status}]: ${data?.error?.message ?? rawText}`,
      );
      throw new HttpException(
        {
          message:
            data?.error?.message ?? `Groq STT failed (${resp.status})`,
          code: 'TIMI_STT_ERROR',
        },
        resp.status === 429
          ? HttpStatus.TOO_MANY_REQUESTS
          : HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const transcript = String(data?.text ?? '').trim();
    // response_format = "json" không trả về duration; chấp nhận null.
    const duration = Number(data?.duration);

    return {
      transcript,
      modelId: `groq:${this.model}`,
      durationSec: Number.isFinite(duration) ? duration : null,
    };
  }
}
