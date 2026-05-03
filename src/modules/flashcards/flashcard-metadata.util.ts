export type FlashcardNoteSource = 'manual' | 'json_import' | 'ai_generated';

export interface StructuredFlashcardMetadata {
  version: 1;
  expression: string;
  partOfSpeech?: string;
  pronunciation?: string;
  meaningVi?: string;
  meaningEn?: string;
  phrasalVerbs?: string[];
  synonyms?: string[];
  antonyms?: string[];
  exampleEn?: string;
  exampleVi?: string;
  note?: string;
  source?: FlashcardNoteSource;
  level?: string;
  contentType?: string;
  tags?: string[];
}

const VOCAB_META_PREFIX = '__VOCAB_META_V1__';

function cleanText(value: unknown, maxLength: number): string | undefined {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) return undefined;
  return text.slice(0, maxLength);
}

export function cleanStringArray(value: unknown, maxItems = 20, maxLength = 120): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    const cleaned = cleanText(item, maxLength);
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= maxItems) break;
  }

  return result;
}

export function serializeStructuredFlashcardMetadata(
  metadata: Partial<StructuredFlashcardMetadata> | null | undefined,
): string | null {
  if (!metadata) return null;

  const expression = cleanText(metadata.expression, 2000);
  if (!expression) return null;

  const normalized: StructuredFlashcardMetadata = {
    version: 1,
    expression,
    partOfSpeech: cleanText(metadata.partOfSpeech, 100),
    pronunciation: cleanText(metadata.pronunciation, 200),
    meaningVi: cleanText(metadata.meaningVi, 5000),
    meaningEn: cleanText(metadata.meaningEn, 5000),
    phrasalVerbs: cleanStringArray(metadata.phrasalVerbs, 10),
    synonyms: cleanStringArray(metadata.synonyms, 12),
    antonyms: cleanStringArray(metadata.antonyms, 12),
    exampleEn: cleanText(metadata.exampleEn, 5000),
    exampleVi: cleanText(metadata.exampleVi, 5000),
    note: cleanText(metadata.note, 5000),
    source: cleanText(metadata.source, 30) as FlashcardNoteSource | undefined,
    level: cleanText(metadata.level, 20),
    contentType: cleanText(metadata.contentType, 50),
    tags: cleanStringArray(metadata.tags, 20, 80),
  };

  return `${VOCAB_META_PREFIX}${JSON.stringify(normalized)}`;
}

export function buildBackFromStructuredMetadata(
  metadata: Partial<StructuredFlashcardMetadata> | null | undefined,
): string {
  return cleanText(metadata?.meaningVi, 5000) ?? cleanText(metadata?.meaningEn, 5000) ?? '';
}

export function toDelimitedTagString(tags: string[] | null | undefined): string {
  return cleanStringArray(tags, 20, 80).join(', ');
}
