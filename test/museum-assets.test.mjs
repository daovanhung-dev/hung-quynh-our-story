import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

test('museum local asset manifest stays CC0 and CDN-free', async () => {
  const manifest = JSON.parse(await readFile(resolve(root, 'public/museum-assets/manifest.json'), 'utf8'));
  assert.equal(manifest.runtimeCdn, false);
  assert.equal(manifest.licensePolicy, 'CC0 only');
  assert.ok(manifest.assets.length >= 3);
  for (const asset of manifest.assets) {
    assert.equal(asset.license, 'CC0');
    assert.match(asset.src, /^(?!https?:\/\/|\/\/)/);
    assert.match(asset.sourceUrl, /^https:\/\//);
  }

  const assetDirectory = resolve(root, 'public/museum-assets');
  const kenneyModel = resolve(assetDirectory, 'kenney/blocky-characters/character-a.glb');
  const kenneyTexture = resolve(assetDirectory, 'kenney/blocky-characters/Textures/texture-a.png');
  assert.ok((await readFile(kenneyModel)).byteLength > 100_000);
  assert.ok((await readFile(kenneyTexture)).byteLength > 1_000);
});

test('museum dialogue source contains 128 generated combinations and Vietnamese happiness praise', async () => {
  const source = await readFile(resolve(root, 'src/app/core/content/museum-dialogue.content.ts'), 'utf8');
  const starterCount = (source.match(/mood: '/g) ?? []).length;
  const endingCount = (source.match(/— /g) ?? []).length;
  assert.ok(starterCount >= 32);
  assert.ok(endingCount >= 4);
  assert.match(source, /hạnh phúc/iu);
  assert.match(source, /MUSEUM_DIALOGUES/);
});

test('museum audio source keeps exactly the five existing MP3 names', async () => {
  const source = await readFile(resolve(root, 'src/app/features/museum/museum-audio-player.component.ts'), 'utf8');
  for (const filename of ['Cà phê đắng như ly cafe.mp3', 'Mascara.mp3', 'Mơ.mp3', 'Thằng Điên.mp3', 'Vì anh đâu có biết.mp3']) {
    assert.match(source, new RegExp(filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(source, /<audio[^>]+autoplay/i);
});
