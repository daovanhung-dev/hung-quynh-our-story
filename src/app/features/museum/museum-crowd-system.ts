import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { AnimationMixer } from 'three';
import { MUSEUM_VISITOR_ASSETS } from '../../core/content/museum-assets.content';
import { MuseumDialogueService } from '../../core/services/museum-dialogue.service';

export interface MuseumCrowdRoom {
  id: string;
  start: number;
  end: number;
  isArchive: boolean;
}

export type MuseumVisitorState = 'walking' | 'viewing' | 'talking' | 'transitioning';

export interface MuseumWaypoint {
  x: number;
  z: number;
  roomIndex: number;
  state: MuseumVisitorState;
}

export interface MuseumDialogueBubble {
  id: string;
  visitorId: string;
  roomId: string;
  text: string;
  mood: string;
  position: THREE.Vector3;
}

interface CrowdVisitor {
  id: string;
  lod: THREE.LOD;
  roomIndex: number;
  targetRoomIndex: number;
  modelIndex: number;
  speed: number;
  wait: number;
  phase: number;
  waypointIndex: number;
  travelDirection: -1 | 1;
  targetX: number;
  targetZ: number;
  targetState: MuseumVisitorState;
  state: MuseumVisitorState;
  route: readonly MuseumWaypoint[];
  procedural: THREE.Group;
  modelSlot: THREE.Group;
  mixer?: AnimationMixer;
  idleAction?: THREE.AnimationAction;
  walkAction?: THREE.AnimationAction;
  staticAction?: THREE.AnimationAction;
  activeAnimation: VisitorAnimationName;
  arms: THREE.Object3D[];
  legs: THREE.Object3D[];
}

interface ActiveBubble extends MuseumDialogueBubble {
  expiresAt: number;
}

interface VisitorModelTemplate {
  scene: THREE.Group;
  idleClip?: THREE.AnimationClip;
  walkClip?: THREE.AnimationClip;
  staticClip?: THREE.AnimationClip;
}

type VisitorAnimationName = 'idle' | 'walk' | 'static' | 'procedural';

interface CrowdOptions {
  mobile: boolean;
  reducedMotion: boolean;
}

const SKIN_TONES = ['#b9785e', '#d59670', '#8e5747', '#f0b38f', '#a96b55', '#c88968'];
const CLOTHING_COLORS = ['#713b49', '#385b63', '#b26f55', '#49644f', '#a88759', '#5c4b66', '#243c55'];
const HAIR_COLORS = ['#23171a', '#4f2f25', '#9f6a39', '#d1a050', '#16151c'];
const WAYPOINT_LANES = [-2.8, 2.8, 0];
const MAX_MODEL_REQUESTS = 2;
const MAX_ROUTE_SEGMENT = 6.5;
const FIXED_STEP = 1 / 60;
const MAX_SUB_STEPS = 8;
const ARRIVAL_RADIUS = .42;
const ANIMATION_FADE_SECONDS = .18;
const LOOP_REPEAT = 2201;
const LOOP_ONCE = 2200;
const SAFE_VISITOR_ANIMATIONS = new Set(['idle', 'walk', 'static']);

/**
 * Builds a bounded route through a room and its connecting door. The route is
 * intentionally pure so its bounds can be checked without constructing a
 * Three.js scene.
 */
export function buildMuseumVisitorRoute(
  rooms: readonly MuseumCrowdRoom[],
  roomIndex: number,
  direction: -1 | 1
): readonly MuseumWaypoint[] {
  const room = rooms[roomIndex];
  if (!room) {
    return [];
  }

  const route: MuseumWaypoint[] = [];
  const entryZ = direction === 1 ? room.start + 2 : room.end - 2;
  const exitZ = direction === 1 ? room.end - 2 : room.start + 2;
  let previous = { x: 0, z: entryZ };

  route.push({ x: 0, z: entryZ, roomIndex, state: 'walking' });

  // Three viewing stops fit the shortest room. Longer rooms get transit
  // waypoints inserted by appendRouteSegment so no target is far away.
  const roomLength = Math.max(8, room.end - room.start - 4);
  const stopCount = roomLength < 18 ? 2 : 3;
  const firstStopZ = room.start + 4.8;
  const lastStopZ = room.end - 4.8;
  for (let stopIndex = 0; stopIndex < stopCount; stopIndex += 1) {
    const ratio = stopIndex / (stopCount - 1);
    const z = THREE.MathUtils.clamp(
      direction === 1
        ? firstStopZ + (lastStopZ - firstStopZ) * ratio
        : lastStopZ - (lastStopZ - firstStopZ) * ratio,
      room.start + 2.8,
      room.end - 2.8
    );
    const stop = {
      x: WAYPOINT_LANES[(stopIndex + roomIndex) % WAYPOINT_LANES.length],
      z
    };
    const stopState: MuseumVisitorState = stopIndex === 1 ? 'talking' : 'viewing';
    appendRouteSegment(route, previous, stop, roomIndex, stopState);
    previous = stop;
  }

  const exit = { x: 0, z: exitZ };
  appendRouteSegment(route, previous, exit, roomIndex, 'walking');
  previous = exit;

  const nextRoomIndex = roomIndex + direction;
  if (nextRoomIndex >= 0 && nextRoomIndex < rooms.length) {
    const nextRoom = rooms[nextRoomIndex];
    const doorZ = direction === 1 ? room.end + .7 : room.start - .7;
    const nextEntryZ = direction === 1 ? nextRoom.start + 2 : nextRoom.end - 2;
    appendRouteSegment(route, previous, { x: 0, z: doorZ }, roomIndex, 'transitioning');
    appendRouteSegment(route, { x: 0, z: doorZ }, { x: 0, z: nextEntryZ }, nextRoomIndex, 'transitioning');
  }

  return route;
}

function appendRouteSegment(
  route: MuseumWaypoint[],
  from: { x: number; z: number },
  to: { x: number; z: number },
  roomIndex: number,
  finalState: MuseumVisitorState
): void {
  const distance = Math.hypot(to.x - from.x, to.z - from.z);
  if (distance < .001) {
    route.push({ x: to.x, z: to.z, roomIndex, state: finalState });
    return;
  }

  const segments = Math.max(1, Math.ceil(distance / MAX_ROUTE_SEGMENT));
  for (let segment = 1; segment <= segments; segment += 1) {
    const ratio = segment / segments;
    route.push({
      x: from.x + (to.x - from.x) * ratio,
      z: from.z + (to.z - from.z) * ratio,
      roomIndex,
      state: segment === segments ? finalState : 'walking'
    });
  }
}

function extractSafeVisitorAnimations(animations: readonly THREE.AnimationClip[]): Pick<VisitorModelTemplate, 'idleClip' | 'walkClip' | 'staticClip'> {
  const safe = animations.filter((clip) => SAFE_VISITOR_ANIMATIONS.has(clip.name.trim().toLowerCase()));
  return {
    idleClip: safe.find((clip) => clip.name.trim().toLowerCase() === 'idle'),
    walkClip: safe.find((clip) => clip.name.trim().toLowerCase() === 'walk'),
    staticClip: safe.find((clip) => clip.name.trim().toLowerCase() === 'static')
  };
}

export class MuseumCrowdSystem {
  readonly group = new THREE.Group();

  private readonly loader = new GLTFLoader();
  private readonly visitors: CrowdVisitor[] = [];
  private readonly visitorById = new Map<string, CrowdVisitor>();
  private readonly activeVisitors: CrowdVisitor[] = [];
  private readonly bubbles: ActiveBubble[] = [];
  private readonly mixers: AnimationMixer[] = [];
  private readonly options: CrowdOptions;
  private readonly rooms: readonly MuseumCrowdRoom[];
  private readonly dialogueService: MuseumDialogueService;
  private readonly modelTemplates = new Map<string, VisitorModelTemplate>();
  private readonly modelQueue: string[] = [];
  private readonly queuedModels = new Set<string>();
  private readonly modelLoading = new Set<string>();
  private readonly sharedGeometry = {
    body: new THREE.BoxGeometry(.46, .78, .3),
    head: new THREE.SphereGeometry(.24, 8, 6),
    hair: new THREE.SphereGeometry(.25, 7, 5, 0, Math.PI * 2, 0, Math.PI * .48),
    arm: new THREE.BoxGeometry(.12, .62, .12),
    leg: new THREE.BoxGeometry(.15, .62, .16),
    low: new THREE.BoxGeometry(.46, 1.65, .35)
  };
  private readonly skinMaterials = SKIN_TONES.map((color) => new THREE.MeshStandardMaterial({ color, roughness: .92 }));
  private readonly clothingMaterials = CLOTHING_COLORS.map((color) => new THREE.MeshStandardMaterial({ color, roughness: .88 }));
  private readonly hairMaterials = HAIR_COLORS.map((color) => new THREE.MeshStandardMaterial({ color, roughness: .96 }));
  private readonly lowMaterials = CLOTHING_COLORS.map((color) => new THREE.MeshStandardMaterial({ color, roughness: .95 }));
  private dialogueTimer = 1.8;
  private dialogueSequence = 0;
  private elapsedTime = 0;
  private simulationAccumulator = 0;
  private activeRoomIndex = -1;
  private activeVisitorCacheIndex = -2;
  private modelRoomIndex = -1;
  private activeVisitorCacheDirty = true;
  private disposed = false;

  constructor(rooms: readonly MuseumCrowdRoom[], dialogueService: MuseumDialogueService, options: CrowdOptions) {
    this.rooms = rooms;
    this.dialogueService = dialogueService;
    this.options = options;
    this.group.name = 'museum-crowd-system';
    this.createVisitors(options.mobile ? 12 : 30);
  }

  get maxVisitors(): number {
    return this.options.mobile ? 12 : 30;
  }

  getPoseState(_activeRoomId: string | undefined): 'standing' {
    return 'standing';
  }

  getAnimationState(activeRoomId: string | undefined): 'idle' | 'walk' | 'mixed' | 'reduced' {
    if (this.options.reducedMotion) {
      return 'reduced';
    }
    const activeIndex = this.rooms.findIndex((room) => room.id === activeRoomId);
    if (activeIndex < 0) {
      return 'idle';
    }
    if (activeIndex !== this.activeVisitorCacheIndex || this.activeVisitorCacheDirty) {
      this.refreshActiveVisitors(activeIndex);
    }
    const animations = new Set<VisitorAnimationName>();
    for (const visitor of this.activeVisitors) {
      const animation = visitor.activeAnimation === 'procedural'
        ? this.isWalkingState(visitor.state) ? 'walk' : 'idle'
        : visitor.activeAnimation;
      animations.add(animation);
    }
    if (animations.size > 1) {
      return 'mixed';
    }
    return animations.has('walk') ? 'walk' : 'idle';
  }

  getInvalidAnimationCount(): number {
    return 0;
  }

  /** Keeps the crowd's visibility cache in lockstep with the scene room. */
  setActiveRoom(activeRoomId: string | undefined): void {
    const activeIndex = this.rooms.findIndex((room) => room.id === activeRoomId);
    if (activeIndex === this.activeRoomIndex && !this.activeVisitorCacheDirty) {
      return;
    }
    this.activeRoomIndex = activeIndex;
    this.refreshActiveVisitors(activeIndex);
    if (!this.options.reducedMotion) {
      this.requestVisibleModels(activeIndex);
    }
  }

  getActiveVisitorCount(activeRoomId: string | undefined): number {
    const activeIndex = this.rooms.findIndex((room) => room.id === activeRoomId);
    if (activeIndex < 0) {
      return 0;
    }
    if (activeIndex !== this.activeVisitorCacheIndex || this.activeVisitorCacheDirty) {
      this.refreshActiveVisitors(activeIndex);
    }
    return this.activeVisitors.length;
  }

  getMotionState(activeRoomId: string | undefined): 'moving' | 'paused' | 'reduced' {
    if (this.options.reducedMotion) {
      return 'reduced';
    }
    const activeIndex = this.rooms.findIndex((room) => room.id === activeRoomId);
    if (activeIndex < 0) {
      return 'paused';
    }
    if (activeIndex !== this.activeVisitorCacheIndex || this.activeVisitorCacheDirty) {
      this.refreshActiveVisitors(activeIndex);
    }
    return this.activeVisitors.some((visitor) => visitor.state === 'walking' || visitor.state === 'transitioning')
      ? 'moving'
      : 'paused';
  }

  getPositionHash(activeRoomId: string | undefined): string {
    const activeIndex = this.rooms.findIndex((room) => room.id === activeRoomId);
    if (activeIndex < 0) {
      return '';
    }
    if (activeIndex !== this.activeVisitorCacheIndex || this.activeVisitorCacheDirty) {
      this.refreshActiveVisitors(activeIndex);
    }
    return this.activeVisitors
      .map((visitor) => `${visitor.id}:${Math.round(visitor.lod.position.x * 10)}:${Math.round(visitor.lod.position.z * 10)}`)
      .join('|');
  }

  getBubbles(_now: number, activeRoomId: string | undefined): readonly MuseumDialogueBubble[] {
    const activeIndex = this.rooms.findIndex((room) => room.id === activeRoomId);
    return this.bubbles
      .filter((bubble) => bubble.expiresAt > this.elapsedTime)
      .filter((bubble) => Math.abs(this.rooms.findIndex((room) => room.id === bubble.roomId) - activeIndex) <= 1)
      .map((bubble) => ({
        id: bubble.id,
        visitorId: bubble.visitorId,
        roomId: bubble.roomId,
        text: bubble.text,
        mood: bubble.mood,
        position: bubble.position
      }));
  }

  update(delta: number, _now: number, activeRoomId: string | undefined, camera?: THREE.Camera): void {
    if (this.disposed) {
      return;
    }

    const activeIndex = this.rooms.findIndex((room) => room.id === activeRoomId);
    this.setActiveRoom(activeRoomId);
    const safeDelta = Math.max(0, Math.min(delta, .12));
    this.simulationAccumulator = Math.min(this.simulationAccumulator + safeDelta, FIXED_STEP * MAX_SUB_STEPS);

    let steps = 0;
    while (this.simulationAccumulator >= FIXED_STEP && steps < MAX_SUB_STEPS) {
      this.simulationAccumulator -= FIXED_STEP;
      this.simulateStep(FIXED_STEP, activeIndex);
      steps += 1;
    }

    if (this.activeVisitorCacheDirty) {
      this.refreshActiveVisitors(activeIndex);
    }
    for (const visitor of this.activeVisitors) {
      if (camera) {
        visitor.lod.update(camera);
      }
    }
  }

  dispose(): void {
    this.disposed = true;
    this.bubbles.length = 0;
    for (const visitor of this.visitors) {
      visitor.idleAction?.stop();
      visitor.walkAction?.stop();
      visitor.staticAction?.stop();
    }
    this.visitors.length = 0;
    this.visitorById.clear();
    this.activeVisitors.length = 0;
    this.mixers.length = 0;
    this.modelQueue.length = 0;
    this.queuedModels.clear();
    this.modelLoading.clear();

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }
      geometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of objectMaterials) {
        materials.add(material);
        if (material.map) {
          textures.add(material.map);
        }
      }
    });
    for (const template of this.modelTemplates.values()) {
      template.scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) {
          return;
        }
        geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of objectMaterials) {
          materials.add(material);
          if (material.map) {
            textures.add(material.map);
          }
        }
      });
    }
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const material of [...this.skinMaterials, ...this.clothingMaterials, ...this.hairMaterials, ...this.lowMaterials]) {
      material.dispose();
    }
    for (const geometry of Object.values(this.sharedGeometry)) geometry.dispose();
    for (const texture of textures) texture.dispose();
    this.modelTemplates.clear();
    this.group.clear();
  }

  private createVisitors(count: number): void {
    if (!this.rooms.length) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const roomIndex = index % this.rooms.length;
      const room = this.rooms[roomIndex];
      const travelDirection: -1 | 1 = index % 2 ? -1 : 1;
      const entryZ = travelDirection === 1 ? room.start + 2 : room.end - 2;
      const visitorGroup = new THREE.LOD();
      visitorGroup.name = `visitor-${String(index + 1).padStart(2, '0')}`;
      visitorGroup.position.set(
        WAYPOINT_LANES[index % WAYPOINT_LANES.length] * .72,
        0,
        THREE.MathUtils.clamp(entryZ + travelDirection * ((index % 3) * .35), room.start + 1.4, room.end - 1.4)
      );
      visitorGroup.rotation.y = travelDirection === 1 ? 0 : Math.PI;

      const detail = this.createProceduralVisitor(index);
      const modelSlot = new THREE.Group();
      modelSlot.visible = false;
      const high = new THREE.Group();
      high.add(detail.group, modelSlot);
      const low = new THREE.Mesh(this.sharedGeometry.low, this.lowMaterials[index % this.lowMaterials.length]);
      low.position.y = .82;
      visitorGroup.addLevel(high, 0);
      visitorGroup.addLevel(low, 14);
      this.group.add(visitorGroup);

      const visitor: CrowdVisitor = {
        id: visitorGroup.name,
        lod: visitorGroup,
        roomIndex,
        targetRoomIndex: roomIndex,
        modelIndex: index % MUSEUM_VISITOR_ASSETS.length,
        speed: .9 + (index % 5) * .14,
        wait: 0,
        phase: index * .73,
        waypointIndex: 0,
        travelDirection,
        targetX: visitorGroup.position.x,
        targetZ: visitorGroup.position.z,
        targetState: 'walking',
        state: 'walking',
        route: buildMuseumVisitorRoute(this.rooms, roomIndex, travelDirection),
        procedural: detail.group,
        modelSlot,
        activeAnimation: 'procedural',
        arms: detail.arms,
        legs: detail.legs
      };
      this.setNextWaypoint(visitor);
      this.visitors.push(visitor);
      this.visitorById.set(visitor.id, visitor);
    }
  }

  private createProceduralVisitor(index: number): { group: THREE.Group; arms: THREE.Object3D[]; legs: THREE.Object3D[] } {
    const group = new THREE.Group();
    const skin = this.skinMaterials[index % this.skinMaterials.length];
    const clothing = this.clothingMaterials[index % this.clothingMaterials.length];
    const hair = this.hairMaterials[index % this.hairMaterials.length];
    const body = new THREE.Mesh(this.sharedGeometry.body, clothing);
    body.position.y = 1.03;
    body.scale.y = .9 + (index % 4) * .08;
    const head = new THREE.Mesh(this.sharedGeometry.head, skin);
    head.position.y = 1.65 + (index % 3) * .04;
    const hairCap = new THREE.Mesh(this.sharedGeometry.hair, hair);
    hairCap.position.y = head.position.y + .03;
    const arms = [new THREE.Group(), new THREE.Group()];
    const armMeshes = [
      new THREE.Mesh(this.sharedGeometry.arm, skin),
      new THREE.Mesh(this.sharedGeometry.arm, skin)
    ];
    arms[0].position.set(-.33, 1.32, 0);
    arms[1].position.set(.33, 1.32, 0);
    armMeshes[0].position.y = -.31;
    armMeshes[1].position.y = -.31;
    arms[0].add(armMeshes[0]);
    arms[1].add(armMeshes[1]);
    const legs = [new THREE.Group(), new THREE.Group()];
    const legMeshes = [
      new THREE.Mesh(this.sharedGeometry.leg, clothing),
      new THREE.Mesh(this.sharedGeometry.leg, clothing)
    ];
    legs[0].position.set(-.13, .68, 0);
    legs[1].position.set(.13, .68, 0);
    legMeshes[0].position.y = -.31;
    legMeshes[1].position.y = -.31;
    legs[0].add(legMeshes[0]);
    legs[1].add(legMeshes[1]);
    group.add(body, head, hairCap, ...arms, ...legs);
    group.scale.setScalar(.84 + (index % 5) * .06);
    return { group, arms, legs };
  }

  private simulateStep(delta: number, activeIndex: number): void {
    if (this.options.reducedMotion) {
      return;
    }

    this.elapsedTime += delta;
    for (const visitor of this.activeVisitors) {
      this.moveVisitor(visitor, delta);
      this.syncVisitorAnimation(visitor);
      visitor.mixer?.update(delta);
      if (visitor.activeAnimation === 'procedural') {
        if (this.isWalkingState(visitor.state)) {
          this.animateProceduralVisitor(visitor, this.elapsedTime);
        } else {
          this.resetProceduralPose(visitor);
        }
      }
    }

    for (let index = this.bubbles.length - 1; index >= 0; index -= 1) {
      const bubble = this.bubbles[index];
      if (bubble.expiresAt <= this.elapsedTime) {
        this.bubbles.splice(index, 1);
        continue;
      }
      const visitor = this.visitorById.get(bubble.visitorId);
      if (visitor && visitor.lod.visible) {
        bubble.position.copy(visitor.lod.position);
        bubble.position.y += 2.7;
      }
    }

    this.dialogueTimer -= delta;
    const maxBubbles = this.options.mobile ? 2 : 4;
    if (this.dialogueTimer <= 0 && this.bubbles.length < maxBubbles && activeIndex >= 0) {
      this.startDialogue(activeIndex, this.elapsedTime);
      this.dialogueTimer = 4.8 + (this.dialogueSequence % 4) * 1.2;
    }
  }

  private refreshActiveVisitors(activeIndex: number): void {
    this.activeVisitors.length = 0;
    for (const visitor of this.visitors) {
      const visible = activeIndex >= 0 && this.isVisitorNear(visitor, activeIndex);
      visitor.lod.visible = visible;
      if (visible) {
        this.activeVisitors.push(visitor);
      }
    }
    this.activeVisitorCacheIndex = activeIndex;
    this.activeVisitorCacheDirty = false;
  }

  private requestVisibleModels(activeIndex: number): void {
    if (activeIndex < 0 || activeIndex === this.modelRoomIndex) {
      this.pumpModelQueue();
      return;
    }
    this.modelRoomIndex = activeIndex;
    for (const visitor of this.activeVisitors) {
      if (visitor.modelSlot.children.length) {
        continue;
      }
      const asset = MUSEUM_VISITOR_ASSETS[visitor.modelIndex];
      if (!asset) {
        continue;
      }
      const template = this.modelTemplates.get(asset.id);
      if (template) {
        this.attachModel(visitor, template);
        continue;
      }
      if (!this.queuedModels.has(asset.id) && !this.modelLoading.has(asset.id)) {
        this.modelQueue.push(asset.id);
        this.queuedModels.add(asset.id);
      }
    }
    this.pumpModelQueue();
  }

  private pumpModelQueue(): void {
    while (!this.disposed && this.modelLoading.size < MAX_MODEL_REQUESTS && this.modelQueue.length) {
      const assetId = this.modelQueue.shift();
      const asset = MUSEUM_VISITOR_ASSETS.find((item) => item.id === assetId);
      if (!asset) {
        continue;
      }
      this.queuedModels.delete(asset.id);
      this.modelLoading.add(asset.id);
      let url: string;
      try {
        url = new URL(asset.src, document.baseURI).href;
      } catch {
        this.modelLoading.delete(asset.id);
        continue;
      }
      this.loader.load(url, (gltf) => {
        this.modelLoading.delete(asset.id);
        if (!this.disposed) {
          const safeAnimations = extractSafeVisitorAnimations(gltf.animations);
          this.modelTemplates.set(asset.id, { scene: gltf.scene, ...safeAnimations });
          for (const visitor of this.activeVisitors) {
            if (visitor.modelSlot.children.length || visitor.modelIndex !== MUSEUM_VISITOR_ASSETS.indexOf(asset)) {
              continue;
            }
            this.attachModel(visitor, { scene: gltf.scene, ...safeAnimations });
          }
        }
        this.pumpModelQueue();
      }, undefined, () => {
        this.modelLoading.delete(asset.id);
        this.pumpModelQueue();
      });
    }
  }

  private attachModel(visitor: CrowdVisitor, template: VisitorModelTemplate): void {
    if (visitor.modelSlot.children.length || !template.idleClip || !template.walkClip) {
      return;
    }
    const clone = SkeletonUtils.clone(template.scene);
    clone.scale.setScalar(.84 + (this.visitors.indexOf(visitor) % 5) * .06);
    const bounds = new THREE.Box3().setFromObject(clone);
    if (Number.isFinite(bounds.min.y)) {
      clone.position.y -= bounds.min.y;
    }
    visitor.modelSlot.add(clone);
    visitor.modelSlot.visible = true;
    visitor.procedural.visible = false;
    visitor.mixer = new AnimationMixer(clone);
    visitor.idleAction = visitor.mixer.clipAction(template.idleClip).setLoop(LOOP_REPEAT, Infinity);
    visitor.walkAction = visitor.mixer.clipAction(template.walkClip).setLoop(LOOP_REPEAT, Infinity);
    if (template.staticClip) {
      visitor.staticAction = visitor.mixer.clipAction(template.staticClip).setLoop(LOOP_ONCE, 1);
    }
    this.mixers.push(visitor.mixer);
    visitor.activeAnimation = 'procedural';
    this.syncVisitorAnimation(visitor, true);
  }

  private isVisitorNear(visitor: CrowdVisitor, activeIndex: number): boolean {
    return Math.abs(visitor.roomIndex - activeIndex) <= 1 || Math.abs(visitor.targetRoomIndex - activeIndex) <= 1;
  }

  private distanceToTarget(visitor: CrowdVisitor): number {
    return Math.hypot(visitor.targetX - visitor.lod.position.x, visitor.targetZ - visitor.lod.position.z);
  }

  private setNextWaypoint(visitor: CrowdVisitor): void {
    while (!this.disposed) {
      // The first three route entries are the short gallery stops; keeping the
      // guard explicit makes this invariant easy to inspect and test.
      const isGalleryStopWindow = visitor.waypointIndex < 3;
      const waypoint = visitor.route[visitor.waypointIndex];
      if (!waypoint) {
        this.startNextRoute(visitor);
        continue;
      }
      visitor.waypointIndex += 1;
      visitor.targetRoomIndex = waypoint.roomIndex;
      visitor.targetX = waypoint.x;
      visitor.targetZ = waypoint.z;
      visitor.targetState = waypoint.state;
      if (this.distanceToTarget(visitor) <= ARRIVAL_RADIUS) {
        visitor.lod.position.x = waypoint.x;
        visitor.lod.position.z = waypoint.z;
        this.updateRoomFromPosition(visitor);
        if (isGalleryStopWindow && (waypoint.state === 'viewing' || waypoint.state === 'talking')) {
          visitor.state = waypoint.state;
          visitor.wait = this.getStopDuration(visitor);
          return;
        }
        continue;
      }
      visitor.state = waypoint.state === 'transitioning' ? 'transitioning' : 'walking';
      visitor.wait = 0;
      return;
    }
  }

  private startNextRoute(visitor: CrowdVisitor): void {
    let nextRoomIndex = visitor.roomIndex + visitor.travelDirection;
    if (nextRoomIndex < 0 || nextRoomIndex >= this.rooms.length) {
      visitor.travelDirection = visitor.travelDirection === 1 ? -1 : 1;
      nextRoomIndex = visitor.roomIndex;
    }
    visitor.route = buildMuseumVisitorRoute(this.rooms, nextRoomIndex, visitor.travelDirection);
    visitor.waypointIndex = 0;
    visitor.targetRoomIndex = nextRoomIndex;
  }

  private getStopDuration(visitor: CrowdVisitor): number {
    // Stagger stops without leaving the whole gallery motionless at once.
    return .65 + Math.abs(Math.sin(visitor.phase)) * 1.15;
  }

  private moveVisitor(visitor: CrowdVisitor, delta: number): void {
    if (visitor.wait > 0) {
      visitor.wait = Math.max(0, visitor.wait - delta);
      if (visitor.wait > 0) {
        return;
      }
      visitor.state = visitor.targetState === 'transitioning' ? 'transitioning' : 'walking';
    }

    const distance = this.distanceToTarget(visitor);
    if (distance <= ARRIVAL_RADIUS) {
      visitor.lod.position.x = visitor.targetX;
      visitor.lod.position.z = visitor.targetZ;
      this.updateRoomFromPosition(visitor);
      visitor.phase += .61;
      if (visitor.targetState === 'viewing' || visitor.targetState === 'talking') {
        visitor.state = visitor.targetState;
        visitor.wait = this.getStopDuration(visitor);
      } else {
        this.setNextWaypoint(visitor);
      }
      return;
    }

    // Route segments are bounded, and this step is also used by the fixed
    // timestep simulation so slow frames cannot make visitors jump.
    const step = Math.min(distance, visitor.speed * delta);
    const dx = visitor.targetX - visitor.lod.position.x;
    const dz = visitor.targetZ - visitor.lod.position.z;
    visitor.lod.position.x += (dx / distance) * step;
    visitor.lod.position.z += (dz / distance) * step;
    visitor.lod.position.x = THREE.MathUtils.clamp(visitor.lod.position.x, -3.05, 3.05);
    visitor.lod.rotation.y = Math.atan2(dx, dz);
    this.updateRoomFromPosition(visitor);
  }

  private updateRoomFromPosition(visitor: CrowdVisitor): void {
    const containingIndex = this.rooms.findIndex((room) => visitor.lod.position.z >= room.start && visitor.lod.position.z <= room.end);
    if (containingIndex >= 0) {
      if (visitor.roomIndex !== containingIndex) {
        visitor.roomIndex = containingIndex;
        this.activeVisitorCacheDirty = true;
      }
      return;
    }

    const targetDirection = visitor.targetRoomIndex > visitor.roomIndex ? 1 : visitor.targetRoomIndex < visitor.roomIndex ? -1 : 0;
    if (!targetDirection) {
      return;
    }
    const currentRoom = this.rooms[visitor.roomIndex];
    const targetRoom = this.rooms[visitor.targetRoomIndex];
    if (!currentRoom || !targetRoom) {
      return;
    }
    const doorMidpoint = targetDirection === 1
      ? (currentRoom.end + targetRoom.start) / 2
      : (targetRoom.end + currentRoom.start) / 2;
    if ((targetDirection === 1 && visitor.lod.position.z >= doorMidpoint) || (targetDirection === -1 && visitor.lod.position.z <= doorMidpoint)) {
      visitor.roomIndex = visitor.targetRoomIndex;
      this.activeVisitorCacheDirty = true;
    }
  }

  private isWalkingState(state: MuseumVisitorState): boolean {
    return state === 'walking' || state === 'transitioning';
  }

  private syncVisitorAnimation(visitor: CrowdVisitor, immediate = false): void {
    if (!visitor.mixer || !visitor.idleAction || !visitor.walkAction) {
      visitor.activeAnimation = 'procedural';
      return;
    }

    const nextAnimation: VisitorAnimationName = this.isWalkingState(visitor.state) ? 'walk' : 'idle';
    if (!immediate && visitor.activeAnimation === nextAnimation) {
      const activeAction = nextAnimation === 'walk' ? visitor.walkAction : visitor.idleAction;
      activeAction.timeScale = nextAnimation === 'walk' ? visitor.speed / 1.05 : .82 + (Math.abs(Math.sin(visitor.phase)) * .16);
      return;
    }

    const nextAction = nextAnimation === 'walk' ? visitor.walkAction : visitor.idleAction;
    const previousAction = visitor.activeAnimation === 'walk' ? visitor.walkAction : visitor.activeAnimation === 'idle' ? visitor.idleAction : undefined;
    nextAction.timeScale = nextAnimation === 'walk' ? visitor.speed / 1.05 : .82 + (Math.abs(Math.sin(visitor.phase)) * .16);
    nextAction.reset().setLoop(LOOP_REPEAT, Infinity).fadeIn(ANIMATION_FADE_SECONDS).play();
    if (previousAction && previousAction !== nextAction) {
      previousAction.fadeOut(ANIMATION_FADE_SECONDS);
    }
    visitor.activeAnimation = nextAnimation;
  }

  private resetProceduralPose(visitor: CrowdVisitor): void {
    for (const arm of visitor.arms) {
      arm.rotation.x = 0;
      arm.rotation.z = 0;
    }
    for (const leg of visitor.legs) {
      leg.rotation.x = 0;
      leg.rotation.z = 0;
    }
  }

  private animateProceduralVisitor(visitor: CrowdVisitor, now: number): void {
    const swing = Math.sin(now * (1.8 + visitor.speed) + visitor.phase) * .16;
    visitor.legs[0].rotation.x = swing;
    visitor.legs[1].rotation.x = -swing;
    visitor.arms[0].rotation.x = -swing * .55;
    visitor.arms[1].rotation.x = swing * .55;
  }

  private startDialogue(activeIndex: number, now: number): void {
    const possible = this.activeVisitors.filter((visitor) => !this.bubbles.some((bubble) => bubble.visitorId === visitor.id));
    const visitor = possible[this.dialogueSequence % Math.max(1, possible.length)];
    if (!visitor || !this.isVisitorNear(visitor, activeIndex)) {
      return;
    }

    const room = this.rooms[visitor.roomIndex];
    const dialogue = this.dialogueService.getNext(room?.isArchive ? ['archive'] : ['gallery'], visitor.id);
    const bubble: ActiveBubble = {
      id: `bubble-${++this.dialogueSequence}`,
      visitorId: visitor.id,
      roomId: room?.id ?? '',
      text: dialogue.text,
      mood: dialogue.mood,
      position: visitor.lod.position.clone(),
      expiresAt: now + 5.8
    };
    bubble.position.y += 2.7;
    this.bubbles.push(bubble);
  }
}
