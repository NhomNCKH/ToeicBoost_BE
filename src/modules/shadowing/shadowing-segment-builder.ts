type TranscriptLine = {
  startSec: number;
  durSec: number;
  text: string;
};

export type BuiltSegment = {
  order: number;
  startSec: number;
  endSec: number;
  textEn: string;
};

function normalizeText(text: string): string {
  return String(text ?? '')
    .replace(/\s+/g, ' ')
    .replace(/\u200B/g, '')
    .trim();
}

function splitIntoSentences(text: string): string[] {
  const t = normalizeText(text);
  if (!t) return [];

  // Try to split by sentence boundaries while keeping punctuation.
  // This is intentionally conservative; we prefer slightly longer sentences than broken fragments.
  const parts =
    t
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/g)
      .map((x) => normalizeText(x))
      .filter(Boolean) ?? [];

  if (parts.length <= 1) return parts.length ? parts : [t];
  return parts;
}

export function buildShadowingSegments(lines: TranscriptLine[]): BuiltSegment[] {
  const cleaned = (lines ?? [])
    .filter((l) => l && l.text)
    .map((l) => ({
      startSec: Math.max(0, Math.floor(Number(l.startSec) || 0)),
      durSec: Math.max(0, Math.floor(Number(l.durSec) || 0)),
      text: normalizeText(l.text),
    }))
    .filter((l) => l.text.length > 0)
    .sort((a, b) => a.startSec - b.startSec);

  if (cleaned.length === 0) return [];

  const segments: BuiltSegment[] = [];

  for (const line of cleaned) {
    const start = line.startSec;
    const lineDur = Math.max(1, line.durSec || 1);
    const end = Math.max(start + 1, start + lineDur);
    const sentences = splitIntoSentences(line.text);
    if (sentences.length === 0) continue;

    if (sentences.length === 1) {
      segments.push({
        order: segments.length + 1,
        startSec: start,
        endSec: end,
        textEn: sentences[0],
      });
      continue;
    }

    // Distribute the line duration across sentences by relative length.
    const lens = sentences.map((s) => Math.max(1, s.length));
    const totalLen = lens.reduce((a, b) => a + b, 0);
    let cursor = start;

    for (let i = 0; i < sentences.length; i++) {
      const isLast = i === sentences.length - 1;
      const ratio = lens[i] / totalLen;
      const alloc = isLast ? end - cursor : Math.max(1, Math.round(lineDur * ratio));
      const segStart = cursor;
      const segEnd = isLast ? end : Math.min(end, segStart + alloc);
      cursor = segEnd;

      segments.push({
        order: segments.length + 1,
        startSec: segStart,
        endSec: Math.max(segStart + 1, segEnd),
        textEn: sentences[i],
      });
    }
  }

  // Fix overlaps / monotonic endSec
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const next = segments[i + 1];
    if (next && seg.endSec > next.startSec) {
      seg.endSec = Math.max(seg.startSec + 1, next.startSec);
    }
  }

  return segments;
}

