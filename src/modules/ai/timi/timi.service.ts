import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimiSession, TimiPersona } from './entities/timi-session.entity';
import {
  TimiTurn,
  TimiTurnRole,
} from './entities/timi-turn.entity';
import { GroqLlmAdapter, ChatMessage } from './adapters/groq-llm.adapter';
import { GroqSttAdapter } from './adapters/groq-stt.adapter';
import { EdgeTtsAdapter } from './adapters/edge-tts.adapter';
import {
  buildTimiSystemPrompt,
  TIMI_GREETING_BY_PERSONA,
} from './timi.prompt';

const HISTORY_WINDOW = 12;

export interface TimiTurnResponse {
  turnId: string;
  userTranscript: string;
  reply: {
    text: string;
    nextPrompt: string | null;
    microCorrection: { wrong: string; right: string; tip: string } | null;
    audioBase64: string;
    audioMime: string;
    voiceId: string;
    modelId: string;
    latencyMs: number;
  };
}

@Injectable()
export class TimiService {
  private readonly logger = new Logger(TimiService.name);

  constructor(
    @InjectRepository(TimiSession)
    private readonly sessionRepo: Repository<TimiSession>,
    @InjectRepository(TimiTurn)
    private readonly turnRepo: Repository<TimiTurn>,
    private readonly llm: GroqLlmAdapter,
    private readonly stt: GroqSttAdapter,
    private readonly tts: EdgeTtsAdapter,
  ) {}

  async createSession(
    userId: string,
    input: { persona?: TimiPersona; title?: string },
  ) {
    const persona = input.persona ?? TimiPersona.CASUAL;
    const now = new Date();

    const session = await this.sessionRepo.save(
      this.sessionRepo.create({
        createdById: userId,
        userId,
        persona,
        title: input.title ?? null,
        startedAt: now,
        lastActiveAt: now,
        metadata: {},
      }),
    );

    const greetingText = TIMI_GREETING_BY_PERSONA[persona];
    const tts = await this.tts.synthesize({ text: greetingText });

    const greetingTurn = await this.turnRepo.save(
      this.turnRepo.create({
        createdById: userId,
        sessionId: session.id,
        role: TimiTurnRole.BOT,
        transcript: greetingText,
        nextPrompt: null,
        microCorrection: null,
        modelId: 'static:greeting',
        voiceId: tts.voiceId,
        latencyMs: 0,
        metadata: { greeting: true },
      }),
    );

    return {
      sessionId: session.id,
      persona: session.persona,
      title: session.title,
      startedAt: session.startedAt,
      greeting: {
        turnId: greetingTurn.id,
        text: greetingText,
        audioBase64: tts.audioBase64,
        audioMime: tts.mimeType,
        voiceId: tts.voiceId,
      },
    };
  }

  async listTurns(userId: string, sessionId: string) {
    const session = await this.findSessionForUser(userId, sessionId);
    const turns = await this.turnRepo.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
    });

    return {
      sessionId: session.id,
      persona: session.persona,
      items: turns.map((turn) => ({
        id: turn.id,
        role: turn.role,
        transcript: turn.transcript,
        nextPrompt: turn.nextPrompt,
        microCorrection: turn.microCorrection,
        createdAt: turn.createdAt,
      })),
    };
  }

  async closeSession(userId: string, sessionId: string) {
    const session = await this.findSessionForUser(userId, sessionId);
    if (!session.endedAt) {
      session.endedAt = new Date();
      await this.sessionRepo.save(session);
    }
    return { sessionId: session.id, closed: true };
  }

  async submitAudioTurn(
    userId: string,
    sessionId: string,
    audio: { buffer: Buffer; mimeType: string; filename: string },
  ): Promise<TimiTurnResponse> {
    const session = await this.findSessionForUser(userId, sessionId);
    if (session.endedAt) {
      throw new BadRequestException('Phiên đã kết thúc');
    }

    if (!audio?.buffer?.length) {
      throw new BadRequestException('Thiếu file audio');
    }

    const sttStarted = Date.now();
    const sttResult = await this.stt.transcribe({
      audio: audio.buffer,
      mimeType: audio.mimeType,
      filename: audio.filename,
      language: 'en',
    });
    const sttLatency = Date.now() - sttStarted;

    const transcript = sttResult.transcript || '';
    const userTurn = await this.turnRepo.save(
      this.turnRepo.create({
        createdById: userId,
        sessionId: session.id,
        role: TimiTurnRole.USER,
        transcript,
        modelId: sttResult.modelId,
        voiceId: null,
        latencyMs: sttLatency,
        metadata: {
          mimeType: audio.mimeType,
          sttDurationSec: sttResult.durationSec,
        },
      }),
    );

    if (!transcript.trim()) {
      const fallbackText = "Sorry, I couldn't catch that — could you try again?";
      const fallbackTts = await this.tts.synthesize({ text: fallbackText });
      const fallbackTurn = await this.persistBotTurn(
        userId,
        session,
        fallbackText,
        null,
        null,
        fallbackTts.voiceId,
        'static:fallback',
        0,
        { fallback: 'empty_transcript' },
      );

      return {
        turnId: userTurn.id,
        userTranscript: '',
        reply: {
          text: fallbackText,
          nextPrompt: null,
          microCorrection: null,
          audioBase64: fallbackTts.audioBase64,
          audioMime: fallbackTts.mimeType,
          voiceId: fallbackTts.voiceId,
          modelId: 'static:fallback',
          latencyMs: 0,
        },
      };
    }

    return this.runTurnPipeline(userId, session, userTurn, transcript);
  }

  async submitTextTurn(
    userId: string,
    sessionId: string,
    text: string,
  ): Promise<TimiTurnResponse> {
    const session = await this.findSessionForUser(userId, sessionId);
    if (session.endedAt) {
      throw new BadRequestException('Phiên đã kết thúc');
    }
    const trimmed = (text ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('Tin nhắn rỗng');
    }

    const userTurn = await this.turnRepo.save(
      this.turnRepo.create({
        createdById: userId,
        sessionId: session.id,
        role: TimiTurnRole.USER,
        transcript: trimmed,
        modelId: 'manual:text',
        voiceId: null,
        latencyMs: 0,
        metadata: { source: 'text' },
      }),
    );

    return this.runTurnPipeline(userId, session, userTurn, trimmed);
  }

  private async runTurnPipeline(
    userId: string,
    session: TimiSession,
    userTurn: TimiTurn,
    userText: string,
  ): Promise<TimiTurnResponse> {
    const messages = await this.buildLlmMessages(session, userText);

    const llmStarted = Date.now();
    const llmResult = await this.llm.chatJson(messages);
    const llmLatency = Date.now() - llmStarted;

    const tts = await this.tts.synthesize({ text: llmResult.spokenReplyEn });

    const botTurn = await this.persistBotTurn(
      userId,
      session,
      llmResult.spokenReplyEn,
      llmResult.nextPrompt,
      llmResult.microCorrection,
      tts.voiceId,
      llmResult.modelId,
      llmLatency,
      { rawLlm: llmResult.raw },
    );

    session.lastActiveAt = new Date();
    await this.sessionRepo.save(session);

    return {
      turnId: userTurn.id,
      userTranscript: userText,
      reply: {
        text: llmResult.spokenReplyEn,
        nextPrompt: llmResult.nextPrompt,
        microCorrection: llmResult.microCorrection,
        audioBase64: tts.audioBase64,
        audioMime: tts.mimeType,
        voiceId: tts.voiceId,
        modelId: llmResult.modelId,
        latencyMs: llmLatency,
      },
    };
  }

  private async persistBotTurn(
    userId: string,
    session: TimiSession,
    text: string,
    nextPrompt: string | null,
    microCorrection: { wrong: string; right: string; tip: string } | null,
    voiceId: string,
    modelId: string,
    latencyMs: number,
    metadata: Record<string, unknown>,
  ) {
    return this.turnRepo.save(
      this.turnRepo.create({
        createdById: userId,
        sessionId: session.id,
        role: TimiTurnRole.BOT,
        transcript: text,
        nextPrompt,
        microCorrection,
        modelId,
        voiceId,
        latencyMs,
        metadata,
      }),
    );
  }

  private async buildLlmMessages(
    session: TimiSession,
    currentUserText: string,
  ): Promise<ChatMessage[]> {
    const recentTurns = await this.turnRepo.find({
      where: { sessionId: session.id },
      order: { createdAt: 'DESC' },
      take: HISTORY_WINDOW,
    });
    const ordered = recentTurns.reverse();

    const messages: ChatMessage[] = [
      { role: 'system', content: buildTimiSystemPrompt(session.persona) },
    ];

    for (const turn of ordered) {
      if (turn.role === TimiTurnRole.USER) {
        messages.push({ role: 'user', content: turn.transcript });
      } else if (turn.role === TimiTurnRole.BOT) {
        messages.push({ role: 'assistant', content: turn.transcript });
      }
    }

    messages.push({ role: 'user', content: currentUserText });
    return messages;
  }

  private async findSessionForUser(userId: string, sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Không tìm thấy phiên Timi');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập phiên này');
    }
    return session;
  }
}
