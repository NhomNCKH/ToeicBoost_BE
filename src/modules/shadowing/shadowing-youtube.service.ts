import { BadRequestException, Injectable } from '@nestjs/common';
import { YoutubeTranscript } from 'youtube-transcript';

type TranscriptLine = {
  startSec: number;
  durSec: number;
  text: string;
};

function extractYoutubeId(input: string): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  // Direct id
  if (/^[a-zA-Z0-9_-]{6,32}$/.test(raw) && !raw.includes('http')) return raw;
  try {
    const url = new URL(raw);
    const v = url.searchParams.get('v');
    if (v) return v;
    // youtu.be/<id>
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').trim();
      return id || null;
    }
    // /shorts/<id>
    const parts = url.pathname.split('/').filter(Boolean);
    const shortsIdx = parts.findIndex((p) => p === 'shorts');
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1];
    return null;
  } catch {
    return null;
  }
}

@Injectable()
export class ShadowingYoutubeService {
  getYoutubeId(youtubeUrlOrId: string): string {
    const id = extractYoutubeId(youtubeUrlOrId);
    if (!id) {
      throw new BadRequestException('YouTube URL/ID không hợp lệ.');
    }
    return id;
  }

  private toLines(lines: any[]): TranscriptLine[] {
    return (lines ?? [])
      .map((l: any) => ({
        startSec: Math.max(0, Math.floor(Number(l?.offset ?? 0) / 1000)),
        durSec: Math.max(0, Math.ceil(Number(l?.duration ?? 0) / 1000)),
        text: String(l?.text ?? '').replace(/\s+/g, ' ').trim(),
      }))
      .filter((l) => l.text.length > 0);
  }

  private looksArabic(text: string): boolean {
    const s = String(text ?? '');
    if (!s) return false;
    const arabic = (s.match(/[\u0600-\u06FF]/g) ?? []).length;
    const latin = (s.match(/[A-Za-z]/g) ?? []).length;
    // if mostly arabic and almost no latin, treat as wrong track for our use-case
    return arabic >= 6 && arabic > latin * 2;
  }

  async fetchTranscript(youtubeId: string, preferredLangs: string[] = ['en', 'en-US']): Promise<TranscriptLine[]> {
    // Prefer English captions explicitly; do NOT fall back silently to other languages.
    const tried: string[] = [];
    for (const lang of preferredLangs) {
      tried.push(lang);
      try {
        const raw = await YoutubeTranscript.fetchTranscript(youtubeId, { lang });
        const lines = this.toLines(raw as any[]);
        const sample = lines.slice(0, 8).map((x) => x.text).join(' ');
        if (this.looksArabic(sample)) {
          continue;
        }
        if (lines.length > 0) return lines;
      } catch {
        // try next language
      }
    }

    throw new BadRequestException(
      `Không tìm thấy captions tiếng Anh cho video này (đã thử: ${tried.join(', ')}).`,
    );
  }
}

