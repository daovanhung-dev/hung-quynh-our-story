import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { getHouseMood, formatHouseClock, HOUSE_TIME_ZONES } from '../src/app/features/our-home/services/house-time.utils.mjs';

const root = resolve(import.meta.dirname, '..');
const feature = resolve(root, 'src/app/features/our-home');

async function readFeature(path) {
  return readFile(resolve(feature, path), 'utf8');
}

test('Our Home stays a lazy static route and loads its real 3D scene inside the feature', async () => {
  const routes = await readFile(resolve(root, 'src/app/app.routes.ts'), 'utf8');
  const page = await readFeature('our-home.page.ts');
  const scene = await readFeature('components/house-scene.component.ts');
  assert.match(routes, /path:\s*'our-home'[\s\S]*?loadComponent:\s*\(\)\s*=>\s*import\('\.\/features\/our-home\/our-home\.page'/);
  assert.doesNotMatch(page, /from\s+['"](?:three|phaser)(?:\/|['"])/);
  assert.match(scene, /from 'three'/);
  assert.match(scene, /three\/addons\/controls\/OrbitControls\.js/);
  assert.match(scene, /minAzimuthAngle = -Infinity/);
  assert.match(scene, /maxAzimuthAngle = Infinity/);
  assert.match(scene, /WebGLRenderer/);
});

test('all six rooms have unique, accessible, in-bounds hotspots and real action content', async () => {
  const source = await readFeature('content/room-map.content.ts');
  const copy = await readFeature('content/house-copy.content.ts');
  const expectedRooms = ['entrance', 'living', 'kitchen', 'study', 'bedroom', 'balcony'];
  const roomBlocks = [...source.matchAll(/^\s{4}id: '(entrance|living|kitchen|study|bedroom|balcony)',[\s\S]*?^\s{4}\]\n\s{2}\}/gm)];
  assert.equal(roomBlocks.length, 6);
  assert.deepEqual(roomBlocks.map((match) => match[1]), expectedRooms);

  const hotspotPattern = /^\s{6}\{ id: '([^']+)', label: '([^']+)', visualLabel: '([^']+)', icon: '([^']+)', action: '([^']+)'(?:, payloadId: '([^']+)')?(?:, awardsStamp: '([^']+)')? \},?$/gm;
  const hotspots = [...source.matchAll(hotspotPattern)];
  assert.equal(hotspots.length, 18);
  assert.equal(new Set(hotspots.map((match) => match[1])).size, hotspots.length);
  const copyKeys = new Set([...copy.matchAll(/^\s*'([^']+)':/gm)].map((match) => match[1]));
  const allowedActions = new Set(['navigate', 'dialog', 'photo-gallery', 'letter-box', 'toggle-light', 'reveal', 'clocks', 'audio']);
  const allowedStamps = new Set(['memory', 'care', 'courage', 'letters', 'moon']);

  for (const [, id, label, visualLabel, , action, payloadId, stamp] of hotspots) {
    assert.ok(id && label.trim() && visualLabel.trim(), `hotspot ${id} must have an accessible label`);
    assert.ok(allowedActions.has(action), `${id} has unsupported action ${action}`);
    if (payloadId && action !== 'navigate') assert.ok(copyKeys.has(payloadId), `${id} points to missing copy ${payloadId}`);
    if (action === 'navigate') assert.ok(expectedRooms.includes(payloadId), `${id} points to missing room ${payloadId}`);
    if (stamp) assert.ok(allowedStamps.has(stamp), `${id} points to unknown stamp ${stamp}`);
  }

  for (const roomId of expectedRooms.slice(1)) {
    const block = roomBlocks.find((match) => match[1] === roomId)?.[0] ?? '';
    assert.ok([...block.matchAll(hotspotPattern)].length >= 2, `${roomId} needs at least two useful interactions`);
  }
});

test('the record-player uses existing public music assets and waits for a user gesture', async () => {
  const roomMap = await readFeature('content/room-map.content.ts');
  const player = await readFeature('components/house-music-player.component.ts');
  const catalog = await readFile(resolve(root, 'src/app/core/content/music-tracks.content.ts'), 'utf8');
  assert.match(roomMap, /id: 'record-player'[^\n]*action: 'audio'/);
  assert.match(player, /<audio #audio preload="none"/);
  assert.match(player, /audio\.play\(\)/);
  assert.match(player, /audio\.pause\(\)[\s\S]*removeAttribute\('src'\)[\s\S]*audio\.load\(\)/);
  const filenames = [...catalog.matchAll(/encodeURIComponent\('([^']+\.mp3)'\)/g)].map((match) => match[1]);
  assert.equal(filenames.length, 5);
  for (const filename of filenames) await stat(resolve(root, 'public/mp3', filename));
});

test('five letter IDs and final letter content are present and independent of the Miss You source', async () => {
  const source = await readFeature('content/letters.content.ts');
  const ids = [...source.matchAll(/^\s*\{\s*id: '(sad|miss-me|tired|lonely|happy)'/gm)].map((match) => match[1]);
  assert.deepEqual(ids, ['sad', 'miss-me', 'tired', 'lonely', 'happy']);
  assert.match(source, /Gửi vợ yêu của anh/);
  assert.match(source, /Chồng yêu Quỳnh/);
  assert.match(source, /chuyện khiến em buồn/);
  assert.doesNotMatch(source, /LOVE_LETTER_ORIGINAL/);
  assert.match(await readFeature('components/final-gift.component.ts'), /FINAL_LETTER\.split/);
});

test('Our Home clock formatting uses fixed IANA zones and Japan mood boundaries', () => {
  assert.equal(HOUSE_TIME_ZONES.japan, 'Asia/Tokyo');
  assert.equal(HOUSE_TIME_ZONES.vietnam, 'Asia/Ho_Chi_Minh');
  const japanInstant = (hour, minute) => new Date(Date.UTC(2026, 9, 12, hour - 9, minute));
  const cases = [
    [4, 59, 'night'], [5, 0, 'dawn'], [10, 59, 'dawn'], [11, 0, 'day'],
    [16, 59, 'day'], [17, 0, 'sunset'], [18, 59, 'sunset'], [19, 0, 'night']
  ];
  for (const [hour, minute, mood] of cases) assert.equal(getHouseMood(japanInstant(hour, minute)), mood);
  const instant = new Date('2026-10-12T16:00:00Z');
  assert.equal(formatHouseClock(instant, 'Asia/Tokyo', 'en-GB'), '01:00');
  assert.equal(formatHouseClock(instant, 'Asia/Ho_Chi_Minh', 'en-GB'), '23:00');
});

test('room scenes and shared memory viewer stay available when a photo cannot load', async () => {
  const page = await readFeature('our-home.page.ts');
  const scene = await readFeature('components/house-scene.component.ts');
  const selector = await readFeature('content/photo-selection.ts');
  assert.match(page, /MemoryService/);
  assert.match(page, /PhotoViewerComponent/);
  assert.match(page, /markPhotoFailed\(photo\.id\)/);
  assert.match(page, /photo-fallback/);
  assert.match(scene, /aria-label/);
  assert.match(selector, /OUR_HOME_PHOTO_IDS/);
  assert.match(selector, /item\.kind === 'image' && item\.src/);
});

test('the four approved gallery photos are explicit existing couple memories', async () => {
  const selector = await readFeature('content/photo-selection.ts');
  const generated = await readFile(resolve(root, 'src/app/generated/memories.generated.ts'), 'utf8');
  const selection = [...selector.matchAll(/^\s*'(2026-01-04-img-[^']+)'/gm)].map((match) => match[1]);
  assert.deepEqual(selection, [
    '2026-01-04-img-3745', '2026-01-04-img-7226', '2026-01-04-img-7230', '2026-01-04-img-7235'
  ]);
  for (const id of selection) assert.match(generated, new RegExp(`"id":\\s*"${id}"`), `${id} must exist in the generated catalog`);
});

test('all six rooms have low-poly 3D models plus optimized local WebP and script-free SVG fallbacks', async () => {
  const rooms = ['entrance', 'living', 'kitchen', 'study', 'bedroom', 'balcony'];
  const directory = resolve(root, 'public/our-home/rooms');
  const expectedAssets = rooms.flatMap((room) => [`${room}.svg`, `${room}-isometric.webp`]).sort();
  assert.deepEqual((await readdir(directory)).sort(), expectedAssets);
  const scene = await readFeature('components/house-scene.component.ts');
  const model = await readFeature('components/house-3d-room.ts');
  assert.match(scene, /-isometric\.webp/);
  assert.match(scene, /rooms\/\$\{roomId\}\$\{extension\}/);
  assert.match(model, /new THREE\.BoxGeometry/);
  assert.match(model, /new THREE\.CylinderGeometry/);
  assert.match(model, /anchors\.set\('moon'/);
  for (const room of rooms) assert.match(model, new RegExp(`case '${room}'`));
  let totalRasterBytes = 0;
  for (const room of rooms) {
    const svgPath = resolve(directory, `${room}.svg`);
    const webpPath = resolve(directory, `${room}-isometric.webp`);
    const [svg, svgMetadata, webpHeader, webpMetadata] = await Promise.all([
      readFile(svgPath, 'utf8'), stat(svgPath), readFile(webpPath), stat(webpPath)
    ]);
    totalRasterBytes += webpMetadata.size;
    assert.match(svg, /^<svg\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"[^>]*viewBox="0 0 800 520"/);
    assert.doesNotMatch(svg, /<script|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i, `${room} SVG fallback must not load scripts or remote assets`);
    assert.ok(svgMetadata.size < 10_000, `${room} vector fallback should stay small`);
    assert.equal(webpHeader.toString('ascii', 0, 4), 'RIFF', `${room} artwork must use the WebP container`);
    assert.equal(webpHeader.toString('ascii', 8, 12), 'WEBP', `${room} artwork must be an actual WebP image`);
    assert.ok(webpMetadata.size < 200_000, `${room} WebP should stay below 200 KB; got ${webpMetadata.size}`);
  }
  assert.ok(totalRasterBytes < 800_000, `all six room scenes should stay below 800 KB; got ${totalRasterBytes}`);
});

test('uncollected stamp labels meet normal-text contrast on the paper surface', async () => {
  const globalStyles = await readFile(resolve(root, 'src/styles.scss'), 'utf8');
  const pageStyles = await readFeature('our-home.page.scss');
  const paper = globalStyles.match(/--paper:\s*(#[\da-fA-F]{6})/)?.[1];
  const muted = globalStyles.match(/--text-muted:\s*(#[\da-fA-F]{6})/)?.[1];
  assert.ok(paper, 'paper surface color must be defined');
  assert.ok(muted, 'muted text color must be defined');
  assert.match(pageStyles, /\.stamp\s*\{[^}]*color:\s*var\(--text-muted\)/s);
  assert.ok(contrastRatio(muted, paper) >= 4.5, `stamp text contrast is ${contrastRatio(muted, paper).toFixed(2)}:1`);
});

function contrastRatio(first, second) {
  const luminance = (hex) => {
    const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
