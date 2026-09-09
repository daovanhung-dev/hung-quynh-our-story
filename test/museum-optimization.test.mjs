import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

test('museum gallery layout caps wall rows and expands along the room length', async () => {
  const source = await readFile(resolve(root, 'src/app/features/museum/museum-layout.ts'), 'utf8');
  assert.match(source, /MUSEUM_MAX_WALL_ROWS\s*=\s*3/);
  assert.match(source, /MUSEUM_SLOT_WIDTH\s*=\s*3\.6/);
  assert.match(source, /Math\.ceil\(displaysPerSide \/ rows\)/);
  assert.match(source, /Math\.max\(24,/);
});

test('museum scene keeps the progressive texture budget and never falls back to originals', async () => {
  const source = await readFile(resolve(root, 'src/app/features/museum/museum-scene.component.ts'), 'utf8');
  assert.match(source, /const maxConcurrent = 4/);
  assert.match(source, /activeNodes\.slice\(0, 18\)/);
  assert.match(source, /neighborNodes\.slice\(0, 6\)/);
  assert.match(source, /media\.displaySrc \|\| node\.display\.media\.mediumSrc/);
  assert.doesNotMatch(source, /media\.displaySrc \|\| node\.display\.media\.mediumSrc \|\| node\.display\.media\.src/);
  assert.match(source, /request\.token !== this\.textureRequestToken/);
});

test('museum crowd uses bounded time steps, short waypoints and lazy model loading', async () => {
  const source = await readFile(resolve(root, 'src/app/features/museum/museum-crowd-system.ts'), 'utf8');
  assert.match(source, /Math\.min\(delta, \.12\)/);
  assert.match(source, /const FIXED_STEP = 1 \/ 60/);
  assert.match(source, /const MAX_SUB_STEPS = 8/);
  assert.match(source, /simulationAccumulator/);
  assert.match(source, /buildMuseumVisitorRoute/);
  assert.match(source, /MAX_ROUTE_SEGMENT = 6\.5/);
  assert.match(source, /'walking' \| 'viewing' \| 'talking' \| 'transitioning'/);
  assert.match(source, /const MAX_MODEL_REQUESTS = 2/);
  assert.match(source, /visitor\.waypointIndex < 3/);
  assert.match(source, /visitor\.speed \* delta/);
  assert.match(source, /visitor\.travelDirection = visitor\.travelDirection === 1 \? -1 : 1/);
  assert.match(source, /activeVisitors: CrowdVisitor\[\]/);
  assert.doesNotMatch(source, /createFarPool/);
});

test('museum visitors only activate upright idle and walk clips', async () => {
  const source = await readFile(resolve(root, 'src/app/features/museum/museum-crowd-system.ts'), 'utf8');
  assert.match(source, /SAFE_VISITOR_ANIMATIONS = new Set\(\['idle', 'walk', 'static'\]\)/);
  assert.match(source, /extractSafeVisitorAnimations\(gltf\.animations\)/);
  assert.match(source, /clipAction\(template\.idleClip\)/);
  assert.match(source, /clipAction\(template\.walkClip\)/);
  assert.match(source, /new THREE\.Box3\(\)\.setFromObject\(clone\)/);
  assert.match(source, /ANIMATION_FADE_SECONDS = \.18/);
  assert.match(source, /armMeshes\[0\]\.position\.y = -\.31/);
  assert.match(source, /legMeshes\[0\]\.position\.y = -\.31/);
  assert.doesNotMatch(source, /for \(const clip of template\.animations\)/);
  assert.doesNotMatch(source, /clipAction\(clip\)\.play\(\)/);
});
