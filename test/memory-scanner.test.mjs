import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { scanMemories } from '../scripts/lib/memory-scanner.mjs';

const imageExtension = /\.(?:jpe?g|png|heic)$/i;

test('scanner creates date memories with an optimized, dimensioned cover', async () => {
  const { memories, errors } = await scanMemories();
  assert.deepEqual(errors, []);
  assert.ok(memories.length > 0);

  for (const memory of memories) {
    assert.ok(memory.cover, `${memory.id} needs a cover`);
    assert.ok(memory.cover.width && memory.cover.height, `${memory.id} cover needs intrinsic dimensions`);
    assert.match(memory.cover.src, /^images\/generated\/memories\//, `${memory.id} cover must be generated`);
  }
});

test('image media has only generated WebP variants and every variant has dimensions', async () => {
  const { memories, unresolvedMedia, errors } = await scanMemories();
  assert.deepEqual(errors, []);
  const allMedia = [...memories.flatMap((memory) => memory.images), ...unresolvedMedia.flatMap((group) => group.media)];

  for (const media of allMedia.filter((item) => item.kind === 'image')) {
    assert.match(media.src, /^images\/generated\/memories\/.*\.webp$/);
    assert.match(media.thumbnailSrc, /^images\/generated\/memories\/.*-thumb\.webp$/);
    assert.match(media.displaySrc, /^images\/generated\/memories\/.*-display\.webp$/);
    assert.match(media.mediumSrc, /^images\/generated\/memories\/.*-medium\.webp$/);
    assert.ok(media.width > 0 && media.height > 0);
  }
});

test('generated media manifest contains dimensions and no original image is part of data output', async () => {
  const manifestPath = path.join(process.cwd(), 'public', 'images', 'generated', 'memories', 'media-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(manifest.version, 1);
  assert.ok(Object.keys(manifest.dimensions).length > 0);

  const { memories, unresolvedMedia } = await scanMemories();
  const serialized = JSON.stringify({ memories, unresolvedMedia });
  assert.equal(imageExtension.test(serialized), false, 'scanner output must not expose JPG/PNG/HEIC originals');
});
