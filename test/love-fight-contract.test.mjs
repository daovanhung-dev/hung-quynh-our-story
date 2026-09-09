import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const root = resolve(import.meta.dirname, '..');

const rulesSource = await readFile(resolve(root, 'src/app/features/love-fight/models/love-fight-rules.ts'), 'utf8');
const rulesModule = await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(rulesSource, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
}).outputText).toString('base64')}`);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  }));
  return nested.flat();
}

test('LOVE FIGHT runtime assets contain the complete v1 catalog', async () => {
  const files = await filesIn(resolve(root, 'public/games/love-fight'));
  const relative = files.map((file) => file.replace(`${root}/public/games/love-fight/`, ''));
  assert.equal(relative.filter((file) => /^characters\/quynh\/Q\d{2}\.webp$/.test(file)).length, 12);
  assert.equal(relative.filter((file) => /^characters\/hung\/H\d{2}\.webp$/.test(file)).length, 12);
  assert.equal(relative.filter((file) => file.startsWith('weapons/') && file.endsWith('.webp')).length, 12);
  assert.equal(relative.filter((file) => file.startsWith('effects/') && file.endsWith('.webp')).length, 12);
  assert.equal(relative.filter((file) => file.startsWith('audio/') && file.endsWith('.wav')).length, 8);
});

test('LOVE FIGHT integration is lazy, static-only and does not ship the ROM reference', async () => {
  const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
  const routes = await readFile(resolve(root, 'src/app/app.routes.ts'), 'utf8');
  const hub = await readFile(resolve(root, 'src/app/core/content/hub.content.ts'), 'utf8');
  const angular = await readFile(resolve(root, 'angular.json'), 'utf8');
  assert.equal(packageJson.dependencies.phaser, '4.2.1');
  assert.match(routes, /path: 'love-fight'/);
  assert.match(routes, /features\/love-fight\/love-fight\.page/);
  assert.match(hub, /route: '\/love-fight'/);
  assert.match(angular, /games\/sf2\.zip/);
  assert.match(angular, /games\/LOVE_FIGHT_ASSET_PACK_v1\/\*\*\//);
});

test('combat model preserves the romantic guardrails and exact ending copy', async () => {
  const model = await readFile(resolve(root, 'src/app/features/love-fight/models/love-fight.model.ts'), 'utf8');
  const ai = await readFile(resolve(root, 'src/app/features/love-fight/engine/hung-ai-controller.ts'), 'utf8');
  const session = await readFile(resolve(root, 'src/app/features/love-fight/services/love-fight-session.service.ts'), 'utf8');
  assert.match(model, /'CƠN DỖI'|Cơn Dỗi|anger/);
  assert.match(model, /Vợ yêu ơi! Chồng trân thành xin lũi em!/);
  assert.match(model, /Có lẽ đối khi chúng ta còn chưa hiểu nhau một chút thoi nhưng có lẽ sau cuộc cãi vã, anh vẫn bên em, anh vẫn mãi yêu em!!!/);
  assert.doesNotMatch(ai, /PUNCH|KICK/);
  assert.match(session, /roundTarget\(this\.setup\(\)\.rounds\)/);
  assert.match(rulesSource, /Math\.max\(0, Math\.min\(METER_MAX/);
});

test('runtime rules clamp meters, enforce rounds/cooldowns and define the state machine', () => {
  assert.equal(rulesModule.clampMeter(-20), 0);
  assert.equal(rulesModule.clampMeter(1000), 100);
  assert.equal(rulesModule.clampMeter(42.6), 43);
  assert.deepEqual([1, 3, 5].map((rounds) => rulesModule.roundTarget(rounds)), [1, 2, 3]);
  assert.equal(rulesModule.resolveRoundState(3, 2, 0), 'ending-b');
  assert.equal(rulesModule.resolveRoundState(3, 0, 2), 'ending-a');
  assert.equal(rulesModule.resolveRoundState(5, 1, 1), 'continue');
  assert.equal(rulesModule.cooldownReady(999, 1000), false);
  assert.equal(rulesModule.cooldownReady(1000, 1000), true);
  assert.equal(rulesModule.canTransition('intro', 'outfit-select'), true);
  assert.equal(rulesModule.canTransition('intro', 'playing'), false);
  assert.equal(rulesModule.canTransition('match-result', 'ending-a'), true);
  assert.equal(rulesModule.canTransition('gallery', 'intro'), true);
  assert.ok(rulesModule.HUNG_ALLOWED_ACTIONS.every((action) => !['PUNCH', 'KICK'].includes(action)));
});
