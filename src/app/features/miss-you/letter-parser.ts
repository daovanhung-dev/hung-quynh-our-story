export interface LetterSegment {
  readonly text: string;
  readonly bold: boolean;
}

/** Parse only **bold** spans while leaving all other source text untouched. */
export function parseLetterSegments(source: string): readonly LetterSegment[] {
  const segments: LetterSegment[] = [];
  const boldPattern = /\*\*([\s\S]+?)\*\*/g;
  let cursor = 0;

  for (const match of source.matchAll(boldPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: source.slice(cursor, index), bold: false });
    segments.push({ text: match[1], bold: true });
    cursor = index + match[0].length;
  }

  if (cursor < source.length) segments.push({ text: source.slice(cursor), bold: false });
  return segments;
}
