import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { test } from 'node:test';
import ts from 'typescript';

const projectRoot = resolve(import.meta.dirname, '..');
const letterSourcePath = resolve(projectRoot, 'LOVE_LETTER_ORIGINAL.md');
const letterPublicPath = resolve(projectRoot, 'public/content/love-letter-miss-you.md');
const expectedHash = '1752b77b6170143ff4ab77181da28d3a1a2e166d40c9901831f46bca58804186';

async function importTypeScript(relativePath) {
  const source = await readFile(resolve(projectRoot, relativePath), 'utf8');
  const { outputText, diagnostics } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true
  });
  assert.deepEqual(diagnostics ?? [], [], `${relativePath} transpiles without diagnostics`);
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  return import(url);
}

test('source letter and public copy remain byte-for-byte immutable', async () => {
  const [source, copy] = await Promise.all([readFile(letterSourcePath), readFile(letterPublicPath)]);
  assert.deepEqual(copy, source);
  assert.equal(source.byteLength, 10_220);
  assert.equal(source.toString('utf8').split('\n').length - 1, 30);
  assert.equal(createHash('sha256').update(source).digest('hex'), expectedHash);
});

test('letter parser preserves Unicode and line breaks while exposing bold spans', async () => {
  const [source, { parseLetterSegments }] = await Promise.all([
    readFile(letterSourcePath, 'utf8'),
    importTypeScript('src/app/features/miss-you/letter-parser.ts')
  ]);
  const segments = parseLetterSegments(source);
  const renderedText = segments.map((segment) => segment.text).join('');

  assert.equal(renderedText, source.replace(/\*\*([\s\S]+?)\*\*/g, '$1'));
  assert.equal((renderedText.match(/\n/g) ?? []).length, 30);
  assert.ok(renderedText.includes('Vợ iu ơiiii!'));
  assert.ok(renderedText.includes('siu siu siu nhiều lun áaaa! ❤️'));
  assert.ok(segments.filter((segment) => segment.bold).length > 0);
  assert.ok(segments.filter((segment) => segment.bold).every((segment) => segment.text.length > 0));
});

test('letter parser leaves HTML-looking text as plain data', async () => {
  const { parseLetterSegments } = await importTypeScript('src/app/features/miss-you/letter-parser.ts');
  const segments = parseLetterSegments('<img src=x onerror=alert(1)> **yêu em**');
  assert.deepEqual(segments, [
    { text: '<img src=x onerror=alert(1)> ', bold: false },
    { text: 'yêu em', bold: true }
  ]);
});

test('days apart follows Vietnam calendar days around midnight and across host time zones', async () => {
  const date = await importTypeScript('src/app/features/miss-you/days-apart.ts');
  const cases = [
    ['2026-09-21T16:59:59.999Z', 0],
    ['2026-09-21T17:00:00.000Z', 0],
    ['2026-09-22T16:59:59.999Z', 0],
    ['2026-09-22T17:00:00.000Z', 1],
    ['2026-10-08T17:00:00.000Z', 17],
    ['2026-10-09T16:59:59.999Z', 17],
    ['2026-10-09T17:00:00.000Z', 18]
  ];
  const previousTimezone = process.env.TZ;

  try {
    for (const hostTimezone of ['Asia/Tokyo', 'America/Los_Angeles']) {
      process.env.TZ = hostTimezone;
      for (const [instant, expected] of cases) assert.equal(date.getDaysApart(new Date(instant)), expected, `${hostTimezone}: ${instant}`);
      assert.equal(date.getMillisecondsUntilVietnamMidnight(new Date('2026-10-09T16:59:59.000Z')), 1_000);
      assert.equal(date.getMillisecondsUntilVietnamMidnight(new Date('2026-10-09T17:00:00.000Z')), 86_400_000);
    }
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});

test('gate code compares the exact case-sensitive value without trimming', async () => {
  const { isMissYouCodeCorrect } = await importTypeScript('src/app/features/miss-you/miss-you-gate.utils.ts');
  assert.equal(isMissYouCodeCorrect('HyeuQ'), true);
  for (const incorrect of ['hyeuQ', 'Hyeuq', 'HyeuQ ', ' HyeuQ', 'Hyeu Q', 'HyeuQ\n', '']) {
    assert.equal(isMissYouCodeCorrect(incorrect), false, JSON.stringify(incorrect));
  }
});

test('shared music catalog points to the five existing local MP3 files', async () => {
  const { MUSIC_TRACKS } = await importTypeScript('src/app/core/content/music-tracks.content.ts');
  assert.equal(MUSIC_TRACKS.length, 5);
  assert.equal(new Set(MUSIC_TRACKS.map((track) => track.id)).size, MUSIC_TRACKS.length);
  for (const track of MUSIC_TRACKS) {
    assert.match(track.src, /^mp3\//);
    const assetPath = decodeURIComponent(new URL(track.src, 'https://example.test/').pathname).replace(/^\//, '');
    const stat = await import('node:fs/promises').then(({ stat }) => stat(resolve(projectRoot, 'public', assetPath)));
    assert.ok(stat.size > 100_000, `${track.title} is an actual local MP3`);
  }
});
