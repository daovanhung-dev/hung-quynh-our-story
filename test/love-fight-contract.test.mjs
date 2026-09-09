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

const loadTsModule = async (relativePath) => {
  const source = await readFile(resolve(root, relativePath), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
  }).outputText).toString('base64')}`);
};

const motionModule = await loadTsModule('src/app/features/love-fight/engine/motion-rules.ts');
const comboModule = await loadTsModule('src/app/features/love-fight/engine/combo-rules.ts');
const cameraModule = await loadTsModule('src/app/features/love-fight/engine/camera-rules.ts');
const hitboxModule = await loadTsModule('src/app/features/love-fight/engine/hitbox-system.ts');

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

test('arcade movement has acceleration, friction, jump buffering, coyote time and no double jump', () => {
  let state = motionModule.createMotionState(300);
  for (let frame = 0; frame < 30; frame += 1) state = motionModule.stepMotion(state, { horizontal: 1, crouching: false, jumpPressed: false, dashPressed: false }, 1000 / 60, frame * 1000 / 60).state;
  assert.equal(state.velocityX, motionModule.DEFAULT_MOTION_CONFIG.maxSpeed);
  for (let frame = 0; frame < 30; frame += 1) state = motionModule.stepMotion(state, { horizontal: 0, crouching: false, jumpPressed: false, dashPressed: false }, 1000 / 60, (30 + frame) * 1000 / 60).state;
  assert.equal(state.velocityX, 0);
  let jump = motionModule.stepMotion(state, { horizontal: 0, crouching: false, jumpPressed: true, dashPressed: false }, 1000 / 60, 1000).state;
  assert.equal(jump.grounded, false);
  const doubleJump = motionModule.stepMotion(jump, { horizontal: 0, crouching: false, jumpPressed: true, dashPressed: false }, 1000 / 60, 1016).events.jumped;
  assert.equal(doubleJump, false);
  const buffered = motionModule.stepMotion({ ...jump, grounded: false, y: -1, velocityY: 120, jumpBufferUntilMs: 1200 }, { horizontal: 0, crouching: false, jumpPressed: false, dashPressed: false }, 16, 1100).state;
  assert.ok(buffered.grounded || buffered.jumpBufferUntilMs > 1100);
  const coyote = motionModule.stepMotion({ ...state, grounded: false, coyoteUntilMs: 1200 }, { horizontal: 0, crouching: false, jumpPressed: true, dashPressed: false }, 16, 1100);
  assert.equal(coyote.events.jumped, true);
});

test('dash travels the configured distance, has an invulnerability window and cooldown', () => {
  let state = motionModule.createMotionState(300);
  let now = 0;
  let dashed = false;
  for (let frame = 0; frame < 6; frame += 1) {
    const result = motionModule.stepMotion(state, { horizontal: 1, crouching: false, jumpPressed: false, dashPressed: frame === 0, dashDirection: 1 }, 1000 / 60, now);
    state = result.state;
    dashed ||= result.events.dashed;
    now += 1000 / 60;
  }
  assert.equal(dashed, true);
  assert.equal(Math.round(state.x - 300), 160);
  assert.equal(motionModule.isInvulnerable(state, 50), true);
  assert.equal(motionModule.isDashReady(state, 100), false);
  assert.equal(motionModule.isDashReady(state, 220), true);
});

test('combo timing accepts J/J/K and weapon chain, then resets after timeout', () => {
  let combo = comboModule.createComboState();
  let result = comboModule.advanceCombo(combo, 'light', 0);
  combo = result.state;
  assert.equal(result.action, 'light-1');
  result = comboModule.advanceCombo(combo, 'light', 400);
  combo = result.state;
  assert.equal(result.action, 'light-2');
  result = comboModule.advanceCombo(combo, 'heavy', 449);
  assert.equal(result.action, 'heavy-finisher');
  result = comboModule.advanceCombo(combo, 'weapon', 449);
  assert.equal(result.action, 'weapon-chain');
  assert.equal(comboModule.comboExpired(combo, 900), true);
  assert.equal(comboModule.advanceCombo(combo, 'heavy', 900).action, 'rejected');
});

test('camera follow is smooth but always clamped to the larger arena', () => {
  assert.equal(cameraModule.clampCameraX(-40), 0);
  assert.equal(cameraModule.clampCameraX(9999), 320);
  assert.ok(cameraModule.followCameraX(0, 700, 1100) > 0);
  assert.ok(cameraModule.cameraZoomFor(80, 3) > cameraModule.cameraZoomFor(500, 0));
});

test('hitboxes are active only inside their active phase', () => {
  const hitbox = { activeFromMs: 70, activeToMs: 150, damage: 8, box: { x: 0, y: 0, width: 10, height: 10 } };
  assert.equal(hitboxModule.isHitboxActive(hitbox, 69), false);
  assert.equal(hitboxModule.isHitboxActive(hitbox, 70), true);
  assert.equal(hitboxModule.isHitboxActive(hitbox, 149), true);
  assert.equal(hitboxModule.isHitboxActive(hitbox, 150), false);
  assert.equal(hitboxModule.actionPhase(30, 70, 150, 220), 'anticipation');
  assert.equal(hitboxModule.actionPhase(90, 70, 150, 220), 'active');
  assert.equal(hitboxModule.actionPhase(180, 70, 150, 220), 'recovery');
});

test('combat presentation includes pooled VFX and Hùng remains non-physical', async () => {
  const poolSource = await readFile(resolve(root, 'src/app/features/love-fight/engine/vfx-pool.ts'), 'utf8');
  const sceneSource = await readFile(resolve(root, 'src/app/features/love-fight/engine/love-fight-scene.ts'), 'utf8');
  const aiSource = await readFile(resolve(root, 'src/app/features/love-fight/engine/hung-ai-controller.ts'), 'utf8');
  assert.match(poolSource, /available/);
  assert.match(poolSource, /release/);
  assert.match(sceneSource, /spawnHitSpark/);
  assert.match(sceneSource, /spawnDashTrail/);
  assert.match(sceneSource, /camera\.shake\(finisher \? 80 : 55/);
  assert.doesNotMatch(aiSource, /PUNCH|KICK/);
});
