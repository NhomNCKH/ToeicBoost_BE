import {
  buildBackFromStructuredMetadata,
  cleanStringArray,
  serializeStructuredFlashcardMetadata,
  toDelimitedTagString,
} from './flashcard-metadata.util';

describe('flashcard-metadata.util', () => {
  it('cleanStringArray trims, de-duplicates, and limits values', () => {
    expect(
      cleanStringArray([' toeic ', 'meeting', '', 'Toeic', 'business'], 3, 20),
    ).toEqual(['toeic', 'meeting', 'business']);
  });

  it('serializeStructuredFlashcardMetadata returns null when expression is missing', () => {
    expect(
      serializeStructuredFlashcardMetadata({
        meaningVi: 'tham dự',
      }),
    ).toBeNull();
  });

  it('serializeStructuredFlashcardMetadata normalizes payload before encoding', () => {
    const encoded = serializeStructuredFlashcardMetadata({
      expression: ' attend ',
      partOfSpeech: ' verb ',
      pronunciation: ' /əˈtend/ ',
      meaningVi: ' tham dự ',
      meaningEn: ' to be present ',
      synonyms: [' join ', 'join', '', 'participate in'],
      antonyms: [' miss '],
      note: ' common TOEIC word ',
      source: 'ai_generated',
      level: 'B1',
      contentType: 'vocabulary',
      tags: [' toeic ', 'meeting', 'Toeic'],
    });

    expect(encoded).toMatch(/^__VOCAB_META_V1__/);
    expect(encoded).toContain('"expression":"attend"');
    expect(encoded).toContain('"partOfSpeech":"verb"');
    expect(encoded).toContain('"pronunciation":"/əˈtend/"');
    expect(encoded).toContain('"meaningVi":"tham dự"');
    expect(encoded).toContain('"meaningEn":"to be present"');
    expect(encoded).toContain('"synonyms":["join","participate in"]');
    expect(encoded).toContain('"antonyms":["miss"]');
    expect(encoded).toContain('"note":"common TOEIC word"');
    expect(encoded).toContain('"source":"ai_generated"');
    expect(encoded).toContain('"level":"B1"');
    expect(encoded).toContain('"contentType":"vocabulary"');
    expect(encoded).toContain('"tags":["toeic","meeting"]');
  });

  it('buildBackFromStructuredMetadata prefers Vietnamese meaning then English meaning', () => {
    expect(
      buildBackFromStructuredMetadata({
        expression: 'attend',
        meaningVi: 'tham dự',
        meaningEn: 'to be present',
      }),
    ).toBe('tham dự');

    expect(
      buildBackFromStructuredMetadata({
        expression: 'attend',
        meaningEn: 'to be present',
      }),
    ).toBe('to be present');
  });

  it('toDelimitedTagString returns a clean comma-separated tag list', () => {
    expect(toDelimitedTagString([' toeic ', '', 'meeting', 'Toeic'])).toBe(
      'toeic, meeting',
    );
  });
});
