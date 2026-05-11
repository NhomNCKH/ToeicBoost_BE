import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export interface TimiTtsResult {
  audioBase64: string;
  mimeType: string;
  voiceId: string;
}

@Injectable()
export class EdgeTtsAdapter {
  private readonly logger = new Logger(EdgeTtsAdapter.name);
  private readonly defaultVoice: string;
  private readonly mimeType = 'audio/mpeg';

  constructor(private readonly config: ConfigService) {
    this.defaultVoice =
      this.config.get<string>('TIMI_TTS_VOICE') ?? 'en-US-AriaNeural';
  }

  async synthesize(params: {
    text: string;
    voice?: string;
    rate?: string;
    pitch?: string;
  }): Promise<TimiTtsResult> {
    const text = (params.text ?? '').trim();
    if (!text) {
      throw new HttpException(
        { message: 'Empty text for TTS', code: 'TIMI_TTS_EMPTY' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const voiceId = params.voice ?? this.defaultVoice;

    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(
        voiceId,
        OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
      );

      const { audioStream } = tts.toStream(text);
      const chunks: Buffer[] = [];

      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        audioStream.on('end', () => resolve());
        audioStream.on('close', () => resolve());
        audioStream.on('error', (err: Error) => reject(err));
      });

      const buffer = Buffer.concat(chunks);
      if (buffer.length === 0) {
        throw new Error('Empty audio output from edge-tts');
      }

      return {
        audioBase64: buffer.toString('base64'),
        mimeType: this.mimeType,
        voiceId,
      };
    } catch (error: any) {
      this.logger.warn(`Edge TTS failed: ${error?.message ?? String(error)}`);
      throw new HttpException(
        {
          message: 'Không thể tổng hợp giọng nói cho Timi',
          code: 'TIMI_TTS_ERROR',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
