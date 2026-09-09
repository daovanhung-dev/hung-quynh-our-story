import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import type { MuseumDisplay, MuseumRoom } from '../../core/models/museum.model';
import { MuseumDialogueService } from '../../core/services/museum-dialogue.service';
import { MuseumCrowdSystem, type MuseumDialogueBubble } from './museum-crowd-system';
import {
  getMuseumDisplaySlot,
  getMuseumRoomLayout,
  isMuseumPropPositionSafe,
  type MuseumRoomLayout
} from './museum-layout';

interface RoomBounds {
  room: MuseumRoom;
  start: number;
  end: number;
  height: number;
  layout: MuseumRoomLayout;
  group: THREE.Group;
  built: boolean;
}

interface DisplayNode {
  display: MuseumDisplay;
  roomId: string;
  group: THREE.Group;
  imageMesh: THREE.Mesh;
  imageMaterial: THREE.MeshStandardMaterial;
  texture?: THREE.Texture;
}

interface TextureRequest {
  displayId: string;
  roomId: string;
  url: string;
  priority: number;
  token: number;
}

type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported: (mode: 'immersive-vr') => Promise<boolean>;
  };
};

@Component({
  selector: 'app-museum-scene',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="museum-scene-shell"
      [class.is-reduced-motion]="reducedMotion"
      [attr.data-webgl-supported]="webglSupported()"
      [attr.data-xr-supported]="xrSupported()"
      [attr.data-dialogue-count]="dialogueCount"
      [attr.data-active-visitors]="activeVisitors()"
      [attr.data-visitor-pool]="visitorPool()"
      [attr.data-visitor-pose]="visitorPose()"
      [attr.data-visitor-animation]="visitorAnimation()"
      [attr.data-invalid-visitor-animations]="invalidVisitorAnimations()"
      [attr.data-crowd-motion]="crowdMotion()"
      [attr.data-visitor-position-hash]="visitorPositionHash()"
      [attr.data-rendered-displays]="renderedDisplays()"
      [attr.data-loaded-textures]="loadedTextures()"
      [attr.data-texture-concurrency]="textureConcurrency()"
      [attr.data-textures-pending]="texturesPending()"
      data-photo-occlusion="clear"
    >
      <canvas
        #canvas
        class="museum-canvas"
        aria-label="Không gian bảo tàng ký ức 3D"
        (click)="onCanvasClick($event)"
        (pointerdown)="onCanvasPointerDown($event)"
        (pointermove)="onCanvasPointerMove($event)"
        (pointerup)="onCanvasPointerUp($event)"
        (pointercancel)="onCanvasPointerUp($event)"
      ></canvas>

      @if (dialogueBubbles().length) {
        <div class="museum-dialogue-layer" aria-live="polite" aria-label="Lời trò chuyện của khách tham quan">
          @for (bubble of dialogueBubbles(); track bubble.id) {
            <div class="dialogue-bubble" [class]="'mood-' + bubble.mood" [style.left.%]="bubble.left" [style.top.%]="bubble.top">
              <span class="dialogue-dot" aria-hidden="true">♡</span>{{ bubble.text }}
            </div>
          }
        </div>
      }

      @if (isLoading()) {
        <div class="scene-loading" aria-live="polite">
          <span class="loading-mark" aria-hidden="true">♡</span>
          <span>Đang mở những căn phòng ký ức…</span>
        </div>
      }

      @if (webglSupported() === false) {
        <div class="scene-fallback" role="status">
          <span class="fallback-mark" aria-hidden="true">✦</span>
          <strong>Trình duyệt chưa mở được không gian 3D.</strong>
          <p>Em vẫn có thể xem toàn bộ ảnh trong danh mục bên dưới.</p>
        </div>
      }

      @if (touchDevice) {
        <div
          class="museum-joystick"
          aria-label="Joystick di chuyển"
          (pointerdown)="beginJoystick($event)"
          (pointermove)="moveJoystick($event)"
          (pointerup)="endJoystick($event)"
          (pointercancel)="endJoystick($event)"
        >
          <span class="joystick-ring" aria-hidden="true"></span>
          <span
            class="joystick-knob"
            aria-hidden="true"
            [style.transform]="'translate(' + joystickX * 28 + 'px, ' + joystickY * 28 + 'px)'"
          ></span>
          <small>Di chuyển</small>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { position:relative; display:block; min-height:clamp(480px,72svh,760px); overflow:hidden; background:#1a0e12; }
    .museum-scene-shell { position:relative; width:100%; height:100%; min-height:clamp(480px,72svh,760px); overflow:hidden; background:radial-gradient(circle at 50% 40%,#4c2630 0,#201318 62%,#120a0d 100%); }
    .museum-canvas { display:block; width:100%; height:100%; min-height:clamp(480px,72svh,760px); cursor:grab; touch-action:none; }
    .museum-canvas:active { cursor:grabbing; }
    .museum-dialogue-layer { position:absolute; inset:0; z-index:2; pointer-events:none; overflow:hidden; }
    .dialogue-bubble { position:absolute; width:min(230px,42%); padding:.62rem .72rem; border:1px solid rgba(255,253,249,.52); border-radius:1rem 1rem 1rem .25rem; background:rgba(255,248,234,.94); color:#47242e; box-shadow:0 10px 25px rgba(0,0,0,.18); font-family:var(--font-display, Georgia, serif); font-size:.8rem; line-height:1.32; transform:translate(-50%,-100%); }
    .dialogue-bubble.mood-playful { background:#f3d6c1; }
    .dialogue-bubble.mood-curious { background:#e4e7d5; }
    .dialogue-bubble.mood-tender { background:#f2d9df; }
    .dialogue-dot { margin-right:.25rem; color:#a85c6c; font-family:Georgia,serif; }
    .scene-loading,.scene-fallback { position:absolute; inset:50% auto auto 50%; display:grid; justify-items:center; gap:.75rem; width:min(86%,380px); padding:1.5rem; border:1px solid rgba(255,253,249,.22); background:rgba(28,15,19,.9); color:#fffdf9; text-align:center; transform:translate(-50%,-50%); box-shadow:0 18px 60px rgba(0,0,0,.28); }
    .scene-loading { pointer-events:none; }
    .scene-loading:not(:has(+ .scene-fallback)) { animation:scene-pulse 1.8s ease-in-out infinite; }
    .loading-mark,.fallback-mark { color:#e1b57b; font-family:Georgia,serif; font-size:2rem; }
    .scene-fallback { z-index:3; }
    .scene-fallback strong { font-family:var(--font-display); font-size:1.45rem; font-weight:400; line-height:1.05; }
    .scene-fallback p { margin:0; color:rgba(255,253,249,.7); line-height:1.55; }
    .museum-joystick { position:absolute; z-index:4; right:1.25rem; bottom:1.25rem; display:grid; width:108px; height:108px; place-items:center; border:1px solid rgba(255,253,249,.28); border-radius:50%; background:rgba(28,15,19,.54); color:#fffdf9; touch-action:none; user-select:none; }
    .joystick-ring { position:absolute; width:62px; height:62px; border:1px solid rgba(255,253,249,.28); border-radius:50%; }
    .joystick-knob { position:absolute; width:32px; height:32px; border:1px solid rgba(255,253,249,.72); border-radius:50%; background:#a96270; box-shadow:0 4px 18px rgba(0,0,0,.22); transition:transform 90ms ease-out; }
    .museum-joystick small { position:absolute; top:calc(100% + .35rem); color:rgba(255,253,249,.68); font-size:.64rem; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; }
    :host ::ng-deep .museum-vr-button { z-index:6; right:1rem !important; bottom:1rem !important; border:1px solid rgba(255,253,249,.42) !important; border-radius:0 !important; background:#7f3b4b !important; font-family:var(--font-body, sans-serif) !important; font-size:.72rem !important; letter-spacing:.1em !important; }
    @keyframes scene-pulse { 0%,100% { opacity:.78; } 50% { opacity:1; } }
    @media (prefers-reduced-motion: reduce) { .scene-loading:not(:has(+ .scene-fallback)) { animation:none; } .joystick-knob { transition:none; } }
    @media (max-width:680px) { :host,.museum-scene-shell,.museum-canvas { min-height:clamp(460px,70svh,680px); } .museum-joystick { right:1rem; bottom:1rem; } }
  `]
})
export class MuseumSceneComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly dialogueService = inject(MuseumDialogueService);
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly keys = new Set<string>();
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly roomBounds: RoomBounds[] = [];
  private readonly displayNodes = new Map<string, DisplayNode>();
  private readonly selectablePhotoMeshes: THREE.Mesh[] = [];
  private readonly textureQueue: TextureRequest[] = [];
  private readonly textureStates = new Map<string, 'queued' | 'loading' | 'loaded' | 'failed'>();
  private readonly desiredTextureIds = new Set<string>();
  private readonly lookPointer = { id: -1, x: 0, y: 0 };
  private readonly joystickPointer = { id: -1, x: 0, y: 0 };
  private readonly joystick = { x: 0, y: 0 };
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private controls?: PointerLockControls;
  private resizeObserver?: ResizeObserver;
  private vrButton?: HTMLElement;
  private activeRoom?: RoomBounds;
  private selectedNode?: DisplayNode;
  private floorMeshes: THREE.Object3D[] = [];
  private lastFrameTime = 0;
  private dragged = false;
  private disposed = false;
  private totalLength = 18;
  private readonly direction = new THREE.Vector3();
  private readonly rightDirection = new THREE.Vector3();
  private readonly movement = new THREE.Vector3();
  private readonly roomScratch = new THREE.Vector3();
  private crowd?: MuseumCrowdSystem;
  private lastCrowdHudUpdate = 0;
  private lastTextureWindowUpdate = 0;
  private lastTextureWindowZ = Number.NaN;
  private textureRequestToken = 0;
  private textureLoadingCount = 0;
  private lastActiveRoomIndex = -1;
  private textureNeighborDirection: -1 | 1 = 1;

  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() rooms: readonly MuseumRoom[] = [];
  @Output() readonly photoSelected = new EventEmitter<MuseumDisplay>();
  @Output() readonly roomChanged = new EventEmitter<string>();
  @Output() readonly xrAvailabilityChanged = new EventEmitter<boolean>();
  @Output() readonly visitorCountChanged = new EventEmitter<number>();
  @Output() readonly visitorPoolChanged = new EventEmitter<number>();

  protected readonly isLoading = signal(false);
  protected readonly webglSupported = signal<boolean | null>(null);
  protected readonly xrSupported = signal(false);
  protected readonly activeVisitors = signal(0);
  protected readonly visitorPool = signal(0);
  protected readonly visitorPose = signal<'standing'>('standing');
  protected readonly visitorAnimation = signal<'idle' | 'walk' | 'mixed' | 'reduced'>('idle');
  protected readonly invalidVisitorAnimations = signal(0);
  protected readonly dialogueBubbles = signal<readonly (MuseumDialogueBubble & { left: number; top: number })[]>([]);
  protected readonly renderedDisplays = signal(0);
  protected readonly loadedTextures = signal(0);
  protected readonly textureConcurrency = signal(0);
  protected readonly texturesPending = signal(0);
  protected readonly crowdMotion = signal<'moving' | 'paused' | 'reduced'>('paused');
  protected readonly visitorPositionHash = signal('');
  protected readonly dialogueCount = this.dialogueService.getAll().length;
  protected touchDevice = false;
  protected reducedMotion = false;
  protected joystickX = 0;
  protected joystickY = 0;

  ngAfterViewInit(): void {
    this.touchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.createRenderer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['rooms'] || changes['rooms'].firstChange || !this.renderer) {
      return;
    }

    this.rebuildScene();
  }

  ngOnDestroy(): void {
    this.disposed = true;
    this.keys.clear();
    this.resizeObserver?.disconnect();
    this.controls?.disconnect();
    this.renderer?.setAnimationLoop(null);
    if (this.vrButton?.parentElement) {
      this.vrButton.parentElement.removeChild(this.vrButton);
    }
    this.disposeScene();
    this.renderer?.dispose();
  }

  focusDisplay(displayId: string): void {
    let node = this.displayNodes.get(displayId);
    if (!node) {
      const room = this.roomBounds.find((item) => item.room.displays.some((display) => display.id === displayId));
      if (room) {
        this.setActiveRoom(room, true);
        node = this.displayNodes.get(displayId);
      }
    }
    if (!node || !this.camera) {
      return;
    }

    node.group.getWorldPosition(this.roomScratch);
    const targetX = THREE.MathUtils.clamp(this.roomScratch.x * 0.45, -5.5, 5.5);
    const targetZ = THREE.MathUtils.clamp(this.roomScratch.z + (this.roomScratch.x < 0 ? 2.5 : -2.5), 0.5, this.totalLength - 0.5);
    this.camera.position.set(targetX, 1.65, targetZ);
    this.camera.lookAt(this.roomScratch.x, this.roomScratch.y, this.roomScratch.z);
    this.selectNode(node);
    this.updateActiveRoom(true);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      event.preventDefault();
      this.keys.add(key);
    }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.key.toLowerCase());
  }

  onCanvasClick(event: MouseEvent): void {
    if (this.dragged) {
      this.dragged = false;
      return;
    }

    if (!this.touchDevice) {
      this.controls?.lock();
    }
    this.selectFromScreen(event.clientX, event.clientY);
  }

  onCanvasPointerDown(event: PointerEvent): void {
    if (!this.touchDevice) {
      return;
    }

    this.lookPointer.id = event.pointerId;
    this.lookPointer.x = event.clientX;
    this.lookPointer.y = event.clientY;
    this.dragged = false;
    this.canvasRef.nativeElement.setPointerCapture(event.pointerId);
  }

  onCanvasPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.lookPointer.id || !this.camera) {
      return;
    }

    const deltaX = event.clientX - this.lookPointer.x;
    const deltaY = event.clientY - this.lookPointer.y;
    this.lookPointer.x = event.clientX;
    this.lookPointer.y = event.clientY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 3) {
      this.dragged = true;
    }

    this.camera.rotation.y -= deltaX * 0.004;
    this.camera.rotation.x = THREE.MathUtils.clamp(this.camera.rotation.x - deltaY * 0.0025, -1.15, 1.15);
  }

  onCanvasPointerUp(event: PointerEvent): void {
    if (event.pointerId === this.lookPointer.id) {
      this.lookPointer.id = -1;
    }
  }

  beginJoystick(event: PointerEvent): void {
    event.stopPropagation();
    this.joystickPointer.id = event.pointerId;
    this.updateJoystick(event);
  }

  moveJoystick(event: PointerEvent): void {
    if (event.pointerId === this.joystickPointer.id) {
      event.stopPropagation();
      this.updateJoystick(event);
    }
  }

  endJoystick(event: PointerEvent): void {
    if (event.pointerId !== this.joystickPointer.id) {
      return;
    }

    event.stopPropagation();
    this.joystickPointer.id = -1;
    this.joystick.x = 0;
    this.joystick.y = 0;
    this.joystickX = 0;
    this.joystickY = 0;
  }

  private createRenderer(): void {
    const canvas = this.canvasRef.nativeElement;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !this.touchDevice,
        powerPreference: 'high-performance'
      });
      const maxPixelRatio = this.touchDevice ? 1.25 : 1.5;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.xr.enabled = true;
      this.webglSupported.set(true);
    } catch {
      this.webglSupported.set(false);
      this.xrAvailabilityChanged.emit(false);
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#190d11');
    this.scene.fog = new THREE.Fog('#190d11', 20, 76);
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.05, 160);
    this.camera.position.set(0, 1.65, 3);
    this.controls = new PointerLockControls(this.camera, canvas);
    this.renderer.setAnimationLoop((time) => this.renderFrame(time));
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host.nativeElement);
    this.resize();
    this.rebuildScene();
    void this.detectXR();
  }

  private rebuildScene(): void {
    if (!this.scene || !this.camera) {
      return;
    }

    this.disposeScene();
    this.roomBounds.length = 0;
    this.displayNodes.clear();
    this.selectablePhotoMeshes.length = 0;
    this.textureQueue.length = 0;
    this.textureStates.clear();
    this.desiredTextureIds.clear();
    this.textureRequestToken += 1;
    this.textureLoadingCount = 0;
    this.textureConcurrency.set(0);
    this.texturesPending.set(0);
    this.renderedDisplays.set(0);
    this.loadedTextures.set(0);
    this.lastTextureWindowUpdate = 0;
    this.lastTextureWindowZ = Number.NaN;
    this.lastActiveRoomIndex = -1;
    this.totalLength = 18;

    this.addLighting();
    this.addLobby();

    let cursor = 0;
    for (const room of this.rooms) {
      const layout = getMuseumRoomLayout(room.displays.length);
      const group = new THREE.Group();
      group.name = `room-${room.id}`;
      const roomBounds: RoomBounds = {
        room,
        start: cursor,
        end: cursor + layout.depth,
        height: layout.height,
        layout,
        group,
        built: false
      };
      this.scene.add(group);
      this.roomBounds.push(roomBounds);
      cursor = roomBounds.end + 1.4;
    }

    this.totalLength = Math.max(cursor + 2, 18);
    this.camera.far = Math.max(160, this.totalLength + 24);
    this.camera.updateProjectionMatrix();
    if (this.roomBounds.length && this.webglSupported()) {
      this.crowd = new MuseumCrowdSystem(
        this.roomBounds.map((item) => ({
          id: item.room.id,
          start: item.start,
          end: item.end,
          isArchive: item.room.isArchive
        })),
        this.dialogueService,
        { mobile: this.touchDevice, reducedMotion: this.reducedMotion }
      );
      this.scene.add(this.crowd.group);
      this.activeVisitors.set(this.crowd.maxVisitors);
      this.visitorPool.set(this.crowd.maxVisitors);
      this.visitorCountChanged.emit(this.crowd.maxVisitors);
      this.visitorPoolChanged.emit(this.crowd.maxVisitors);
    }
    if (this.roomBounds.length) {
      const first = this.roomBounds[0];
      this.camera.position.set(0, 1.65, -6.5);
      this.camera.lookAt(0, 1.7, first.start + 7);
      this.setActiveRoom(first, false);
    }
    this.updateSceneMetrics();
  }

  private addLighting(): void {
    if (!this.scene) {
      return;
    }

    this.scene.add(new THREE.HemisphereLight('#fff4df', '#2b1018', 1.3));
    const key = new THREE.PointLight('#ffd9b5', 2.2, 30, 1.7);
    key.position.set(0, 5.4, 2);
    this.scene.add(key);
    const ceilingGlow = new THREE.PointLight('#b87983', 1.4, 46, 1.8);
    ceilingGlow.position.set(0, 7, 20);
    this.scene.add(ceilingGlow);
  }

  private addLobby(): void {
    if (!this.scene) {
      return;
    }

    const lobby = new THREE.Group();
    lobby.name = 'museum-lobby';
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 16),
      new THREE.MeshStandardMaterial({ color: '#694237', roughness: 0.82, metalness: 0.02 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -7);
    floor.userData['isTeleportFloor'] = true;
    lobby.add(floor);
    this.floorMeshes.push(floor);

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(18, 6.5, 0.25),
      new THREE.MeshStandardMaterial({ color: '#3a1a23', roughness: 0.95 })
    );
    back.position.set(0, 3.25, -15);
    lobby.add(back);

    const plaque = this.createTextPlaque('H ♡ Q · MEMORY MUSEUM', 0, 3.1, -14.8, 0.95);
    lobby.add(plaque);
    const subtitle = this.createTextPlaque('Mỗi căn phòng là một tháng mình đã có nhau', 0, 2.2, -14.72, 0.32);
    lobby.add(subtitle);
    const entryPlaque = this.createTextPlaque('H ♡ Q · MEMORY MUSEUM', 0, 4.25, -0.35, 0.62);
    entryPlaque.rotation.y = Math.PI;
    lobby.add(entryPlaque);
    this.addLobbyDetails(lobby);
    this.scene.add(lobby);
  }

  private addLobbyDetails(lobby: THREE.Group): void {
    const wood = new THREE.MeshStandardMaterial({ color: '#4c2b29', roughness: .78, metalness: .06 });
    const champagne = new THREE.MeshStandardMaterial({ color: '#dcae72', roughness: .42, metalness: .58 });
    const cream = new THREE.MeshStandardMaterial({ color: '#e7d2b8', roughness: .72 });
    const columnGeometry = new THREE.BoxGeometry(.42, 6.2, .42);
    for (const x of [-7.8, 7.8]) {
      const column = new THREE.Mesh(columnGeometry, wood);
      column.position.set(x, 3.1, -8.8);
      lobby.add(column);
      const capital = new THREE.Mesh(new THREE.BoxGeometry(.72, .18, .72), champagne);
      capital.position.set(x, 6.2, -8.8);
      lobby.add(capital);
    }
    const welcomeDesk = new THREE.Mesh(new THREE.BoxGeometry(4.4, .95, 1.1), wood);
    welcomeDesk.position.set(0, .48, -5.2);
    lobby.add(welcomeDesk);
    const guestbook = new THREE.Mesh(new THREE.BoxGeometry(1.5, .12, .9), cream);
    guestbook.position.set(0, 1.03, -5.2);
    guestbook.rotation.y = -.12;
    lobby.add(guestbook);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), champagne);
    lamp.position.set(-1.35, 1.12, -5.2);
    lobby.add(lamp);
    const bench = new THREE.Mesh(new THREE.BoxGeometry(3.6, .28, .72), cream);
    bench.position.set(0, .72, -1.75);
    lobby.add(bench);
    const benchLegs = new THREE.BoxGeometry(.18, .7, .18);
    for (const x of [-1.35, 1.35]) {
      const leg = new THREE.Mesh(benchLegs, wood);
      leg.position.set(x, .36, -1.75);
      lobby.add(leg);
    }
  }

  private buildRoom(roomBounds: RoomBounds): void {
    if (roomBounds.built) {
      return;
    }

    const { room, start, end, height, layout, group: roomGroup } = roomBounds;
    const depth = end - start;
    const center = start + depth / 2;

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(18, depth),
      new THREE.MeshStandardMaterial({ color: room.isArchive ? '#493440' : '#694237', roughness: 0.86, metalness: 0.01 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, center);
    floor.userData['isTeleportFloor'] = true;
    roomGroup.add(floor);
    this.floorMeshes.push(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({
      color: room.isArchive ? '#372530' : '#ead6bd',
      roughness: 0.94,
      metalness: 0
    });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, depth), wallMaterial);
    leftWall.position.set(-9, height / 2, center);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, depth), wallMaterial.clone());
    rightWall.position.set(9, height / 2, center);
    roomGroup.add(leftWall, rightWall);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(18, depth),
      new THREE.MeshStandardMaterial({ color: room.isArchive ? '#26171e' : '#b98375', roughness: 1 })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, height, center);
    roomGroup.add(ceiling);

    const divider = this.createRoomHeader(room, center, height);
    roomGroup.add(divider);

    const roomLight = new THREE.PointLight(room.isArchive ? '#d18a9d' : '#ffd6b0', room.isArchive ? 2.1 : 2.6, 24, 1.8);
    roomLight.position.set(0, height - 0.7, center);
    roomGroup.add(roomLight);
    this.addRoomDetails(roomGroup, center, depth, height, room.isArchive, layout, room.displays.length);

    room.displays.forEach((display, index) => {
      const node = this.createDisplayNode(display, room.id, index, layout, center);
      roomGroup.add(node.group);
      this.displayNodes.set(display.id, node);
      this.selectablePhotoMeshes.push(node.imageMesh);
    });

    roomBounds.built = true;
    this.updateSceneMetrics();
  }

  private addRoomDetails(group: THREE.Group, center: number, depth: number, height: number, archive: boolean, layout: MuseumRoomLayout, displayCount: number): void {
    const wood = new THREE.MeshStandardMaterial({ color: archive ? '#352027' : '#5a332d', roughness: .8, metalness: .04 });
    const trim = new THREE.MeshStandardMaterial({ color: archive ? '#9b6271' : '#b98267', roughness: .62, metalness: .12 });
    const plaster = new THREE.MeshStandardMaterial({ color: archive ? '#432c36' : '#d9c0a5', roughness: .95 });
    const columnGeometry = new THREE.BoxGeometry(.36, height, .36);
    const columnCount = Math.max(2, Math.floor(depth / 6));
    for (let index = 0; index <= columnCount; index += 1) {
      const z = center - depth / 2 + .8 + index * ((depth - 1.6) / columnCount);
      for (const x of [-8.96, 8.96]) {
        const column = new THREE.Mesh(columnGeometry, wood);
        column.position.set(x, height / 2, z);
        group.add(column);
        const capital = new THREE.Mesh(new THREE.BoxGeometry(.62, .16, .62), trim);
        capital.position.set(x, height - .18, z);
        group.add(capital);
      }
    }

    for (const y of [height - .35, height - 1.1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(17.1, .16, .22), trim);
      beam.position.set(0, y, center);
      group.add(beam);
    }

    const trackGeometry = new THREE.BoxGeometry(5.4, .1, .18);
    for (const z of [center - depth * .28, center + depth * .28]) {
      const track = new THREE.Mesh(trackGeometry, wood);
      track.position.set(0, height - .48, z);
      group.add(track);
      for (const x of [-1.8, 0, 1.8]) {
        const spotlight = new THREE.SpotLight(archive ? '#e1a4b1' : '#ffe3bd', 1.55, 8, .46, .48, 1.6);
        spotlight.position.set(x, height - .5, z);
        spotlight.target.position.set(x * .7, 1.2, z + (z < center ? 2.3 : -2.3));
        group.add(spotlight, spotlight.target);
      }
    }

    const start = center - depth / 2;
    const end = center + depth / 2;
    const displayZs = Array.from({ length: displayCount }, (_, index) => getMuseumDisplaySlot(index, layout, center).z);
    const benchZ = start + 2.4;
    const plantNearZ = end - 2.45;
    const sculptureZ = end - 2.15;
    if (isMuseumPropPositionSafe(0, benchZ, layout, center, displayZs)) {
      this.addBench(group, benchZ, wood, plaster);
    }
    if (isMuseumPropPositionSafe(-2.8, plantNearZ, layout, center, displayZs)) {
      this.addPlant(group, plantNearZ, -2.8, archive);
    }
    if (isMuseumPropPositionSafe(2.8, start + 2.35, layout, center, displayZs)) {
      this.addPlant(group, start + 2.35, 2.8, archive);
    }
    if (isMuseumPropPositionSafe(0, sculptureZ, layout, center, displayZs)) {
      this.addSculpture(group, sculptureZ, archive);
      this.addRopeBarrier(group, sculptureZ, archive);
    }
  }

  private addBench(group: THREE.Group, z: number, wood: THREE.MeshStandardMaterial, seatMaterial: THREE.MeshStandardMaterial): void {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.8, .24, .7), seatMaterial);
    seat.position.set(0, .76, z);
    group.add(seat);
    for (const x of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(.14, .75, .14), wood);
      leg.position.set(x, .37, z);
      group.add(leg);
    }
  }

  private addPlant(group: THREE.Group, z: number, x: number, archive: boolean): void {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(.44, .55, .68, 12),
      new THREE.MeshStandardMaterial({ color: archive ? '#552d3b' : '#9b5f4c', roughness: .8 })
    );
    pot.position.set(x, .34, z);
    group.add(pot);
    const leafMaterial = new THREE.MeshStandardMaterial({ color: archive ? '#3d5a4a' : '#55785d', roughness: .9 });
    for (let index = 0; index < 5; index += 1) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(.26, 8, 6), leafMaterial);
      leaf.scale.set(.68, 1.5, .55);
      leaf.position.set(x + Math.sin(index * 1.4) * .35, .85 + (index % 3) * .3, z + Math.cos(index * 1.4) * .25);
      group.add(leaf);
    }
  }

  private addSculpture(group: THREE.Group, z: number, archive: boolean): void {
    const pedestal = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 1.05, 1.35),
      new THREE.MeshStandardMaterial({ color: archive ? '#48303a' : '#b6a18c', roughness: .72 })
    );
    pedestal.position.set(0, .53, z);
    const sculpture = new THREE.Mesh(
      new THREE.SphereGeometry(.5, 18, 12),
      new THREE.MeshStandardMaterial({ color: archive ? '#ba6f83' : '#d8aa6c', roughness: .3, metalness: .55 })
    );
    sculpture.position.set(0, 1.48, z);
    sculpture.scale.set(.72, 1.2, .72);
    group.add(pedestal, sculpture);
  }

  private addRopeBarrier(group: THREE.Group, z: number, archive: boolean): void {
    const postMaterial = new THREE.MeshStandardMaterial({ color: archive ? '#a46c7b' : '#d0a36d', roughness: .45, metalness: .55 });
    const ropeMaterial = new THREE.MeshStandardMaterial({ color: archive ? '#6d3a4a' : '#7b434d', roughness: .9 });
    for (const x of [-2.25, 2.25]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(.1, .12, 1.05, 10), postMaterial);
      post.position.set(x, .53, z);
      group.add(post);
    }
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 4.5, 8), ropeMaterial);
    rope.rotation.z = Math.PI / 2;
    rope.position.set(0, .92, z);
    group.add(rope);
  }

  private createRoomHeader(room: MuseumRoom, center: number, height: number): THREE.Group {
    const header = new THREE.Group();
    const plaque = this.createTextPlaque(room.isArchive ? 'NHỮNG ẢNH CHƯA XÁC ĐỊNH NGÀY' : room.label.toUpperCase(), 0, height - 0.8, center - 0.08, room.isArchive ? 0.44 : 0.48);
    header.add(plaque);
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(5.8, 0.025, 0.025),
      new THREE.MeshStandardMaterial({ color: '#b77080', roughness: 0.68 })
    );
    line.position.set(0, height - 1.32, center - 0.08);
    header.add(line);
    return header;
  }

  private createDisplayNode(
    display: MuseumDisplay,
    roomId: string,
    index: number,
    layout: MuseumRoomLayout,
    center: number
  ): DisplayNode {
    const slot = getMuseumDisplaySlot(index, layout, center);
    const side = slot.side;
    const frameWidth = layout.frameWidth;
    const frameHeight = layout.frameHeight;
    const group = new THREE.Group();
    group.name = `display-${display.id}`;
    group.userData['displayId'] = display.id;
    group.userData['display'] = display;
    group.position.set(slot.x, slot.y, slot.z);
    group.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(frameWidth + 0.24, frameHeight + 0.24, 0.15),
      new THREE.MeshStandardMaterial({ color: '#713b49', roughness: 0.68, metalness: 0.05 })
    );
    frame.userData['displayId'] = display.id;
    const imageMaterial = new THREE.MeshStandardMaterial({ color: '#fff6e7', roughness: 0.88, metalness: 0 });
    const imageMesh = new THREE.Mesh(new THREE.PlaneGeometry(frameWidth, frameHeight), imageMaterial);
    imageMesh.position.z = side === -1 ? 0.1 : -0.1;
    imageMesh.userData['displayId'] = display.id;
    imageMesh.userData['display'] = display;
    group.add(frame, imageMesh);

    const caption = this.createTextPlaque(display.title || display.date || 'Ký ức', 0, -1.25, side === -1 ? 0.12 : -0.12, 0.22);
    caption.position.y = -1.32;
    group.add(caption);

    return { display, roomId, group, imageMesh, imageMaterial };
  }

  private createTextPlaque(text: string, x: number, y: number, z: number, size: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 72;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#fff4df';
      context.font = `600 ${Math.round(size * 52)}px Georgia, serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text.slice(0, 48), canvas.width / 2, canvas.height / 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(2, text.length * size * 0.16), size), material);
    mesh.position.set(x, y, z);
    return mesh;
  }

  private async detectXR(): Promise<void> {
    const xr = (navigator as XRNavigator).xr;
    if (!xr) {
      this.xrSupported.set(false);
      this.xrAvailabilityChanged.emit(false);
      return;
    }

    try {
      const supported = await xr.isSessionSupported('immersive-vr');
      if (this.disposed) {
        return;
      }
      this.xrSupported.set(supported);
      this.xrAvailabilityChanged.emit(supported);
      if (supported && this.renderer) {
        this.addVRButton();
        this.addXRControllers();
      }
    } catch {
      this.xrSupported.set(false);
      this.xrAvailabilityChanged.emit(false);
    }
  }

  private addVRButton(): void {
    if (!this.renderer || this.vrButton) {
      return;
    }

    this.vrButton = VRButton.createButton(this.renderer);
    this.vrButton.classList.add('museum-vr-button');
    this.vrButton.setAttribute('aria-label', 'Bước vào VR');
    this.host.nativeElement.appendChild(this.vrButton);
  }

  private addXRControllers(): void {
    if (!this.renderer || !this.scene) {
      return;
    }

    for (let index = 0; index < 2; index += 1) {
      const controller = this.renderer.xr.getController(index);
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
        new THREE.LineBasicMaterial({ color: '#e1b57b', transparent: true, opacity: 0.72 })
      );
      line.name = 'controller-ray';
      line.scale.z = 4;
      controller.add(line);
      controller.addEventListener('selectstart', () => this.selectFromController(controller));
      this.scene.add(controller);
    }
  }

  private selectFromController(controller: THREE.Group): void {
    const origin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
    const direction = new THREE.Vector3(0, 0, -1).transformDirection(controller.matrixWorld);
    this.raycaster.set(origin, direction);
    const photoHit = this.raycaster.intersectObjects(this.selectablePhotoMeshes, false)[0];
    if (photoHit) {
      const displayId = photoHit.object.userData['displayId'] as string | undefined;
      const node = displayId ? this.displayNodes.get(displayId) : undefined;
      if (node) {
        this.selectNode(node);
        this.photoSelected.emit(node.display);
      }
      return;
    }

    const floorHit = this.raycaster.intersectObjects(this.floorMeshes, false)[0];
    if (floorHit && this.camera) {
      this.camera.position.x = THREE.MathUtils.clamp(floorHit.point.x, -7.7, 7.7);
      this.camera.position.z = THREE.MathUtils.clamp(floorHit.point.z, 0.5, this.totalLength - 0.5);
      this.camera.position.y = 1.65;
      this.updateActiveRoom(true);
    }
  }

  private selectFromScreen(clientX: number, clientY: number): void {
    if (!this.renderer || !this.camera) {
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const photoHit = this.raycaster.intersectObjects(this.selectablePhotoMeshes, false)[0];
    if (!photoHit) {
      return;
    }

    const displayId = photoHit.object.userData['displayId'] as string | undefined;
    const node = displayId ? this.displayNodes.get(displayId) : undefined;
    if (node) {
      this.selectNode(node);
      this.photoSelected.emit(node.display);
    }
  }

  private selectNode(node: DisplayNode): void {
    if (this.selectedNode && this.selectedNode !== node) {
      const oldFrame = this.selectedNode.group.children[0] as THREE.Mesh;
      (oldFrame.material as THREE.MeshStandardMaterial).color.set('#713b49');
      this.selectedNode.group.scale.setScalar(1);
    }

    const frame = node.group.children[0] as THREE.Mesh;
    (frame.material as THREE.MeshStandardMaterial).color.set('#dfaa72');
    node.group.scale.setScalar(1.055);
    this.selectedNode = node;
  }

  private updateTextureWindow(activeRoomId: string, neighborRoomId?: string): void {
    if (!this.camera) {
      return;
    }

    const activeNodes = [...this.displayNodes.values()]
      .filter((node) => node.roomId === activeRoomId)
      .sort((a, b) => Math.abs(a.group.position.z - this.camera!.position.z) - Math.abs(b.group.position.z - this.camera!.position.z));
    const neighborNodes = neighborRoomId
      ? [...this.displayNodes.values()]
        .filter((node) => node.roomId === neighborRoomId)
        .sort((a, b) => a.group.position.z - b.group.position.z)
      : [];
    const desired = new Set<string>();
    for (const node of activeNodes.slice(0, 18)) {
      desired.add(node.display.id);
    }
    for (const node of neighborNodes.slice(0, 6)) {
      desired.add(node.display.id);
    }

    const desiredChanged = desired.size !== this.desiredTextureIds.size || [...desired].some((displayId) => !this.desiredTextureIds.has(displayId));
    if (!desiredChanged) {
      this.pumpTextureQueue();
      this.lastTextureWindowUpdate = performance.now();
      this.lastTextureWindowZ = this.camera.position.z;
      return;
    }

    this.desiredTextureIds.clear();
    for (const displayId of desired) {
      this.desiredTextureIds.add(displayId);
    }
    this.textureRequestToken += 1;
    this.textureQueue.length = 0;

    for (const node of this.displayNodes.values()) {
      if (this.desiredTextureIds.has(node.display.id)) {
        continue;
      }
      this.releaseNodeTexture(node);
      this.textureStates.delete(node.display.id);
    }

    for (const node of activeNodes.slice(0, 18)) {
      this.queueTexture(node, 0);
    }
    for (const node of neighborNodes.slice(0, 6)) {
      this.queueTexture(node, 1);
    }
    this.textureQueue.sort((a, b) => a.priority - b.priority);
    this.pumpTextureQueue();
    this.lastTextureWindowUpdate = performance.now();
    this.lastTextureWindowZ = this.camera.position.z;
    this.updateSceneMetrics();
  }

  private queueTexture(node: DisplayNode, priority: number): void {
    if (node.texture || this.textureStates.has(node.display.id)) {
      return;
    }
    const source = node.display.media.displaySrc || node.display.media.mediumSrc;
    if (!source) {
      node.imageMaterial.color.set('#c8a78d');
      node.imageMaterial.needsUpdate = true;
      this.textureStates.set(node.display.id, 'failed');
      return;
    }

    let url: string;
    try {
      url = new URL(source, document.baseURI).href;
    } catch {
      node.imageMaterial.color.set('#c8a78d');
      node.imageMaterial.needsUpdate = true;
      this.textureStates.set(node.display.id, 'failed');
      return;
    }

    const token = this.textureRequestToken;
    this.textureStates.set(node.display.id, 'queued');
    this.textureQueue.push({ displayId: node.display.id, roomId: node.roomId, url, priority, token });
  }

  private pumpTextureQueue(): void {
    const maxConcurrent = 4;
    while (!this.disposed && this.textureLoadingCount < maxConcurrent && this.textureQueue.length) {
      const request = this.textureQueue.shift();
      if (!request || request.token !== this.textureRequestToken || !this.desiredTextureIds.has(request.displayId)) {
        continue;
      }
      const node = this.displayNodes.get(request.displayId);
      if (!node) {
        continue;
      }
      this.textureStates.set(request.displayId, 'loading');
      this.textureLoadingCount += 1;
      this.textureConcurrency.set(this.textureLoadingCount);
      try {
        this.textureLoader.load(
          request.url,
          (texture) => this.finishTextureRequest(request, node, texture),
          undefined,
          () => this.failTextureRequest(request, node)
        );
      } catch {
        this.failTextureRequest(request, node);
      }
    }
    this.updateSceneMetrics();
  }

  private finishTextureRequest(request: TextureRequest, node: DisplayNode, texture: THREE.Texture): void {
    this.textureLoadingCount = Math.max(0, this.textureLoadingCount - 1);
    this.textureConcurrency.set(this.textureLoadingCount);
    const current = !this.disposed && request.token === this.textureRequestToken && this.desiredTextureIds.has(request.displayId) && this.displayNodes.get(request.displayId) === node;
    if (!current) {
      texture.dispose();
      this.pumpTextureQueue();
      return;
    }
    texture.colorSpace = THREE.SRGBColorSpace;
    node.texture = texture;
    node.imageMaterial.map = texture;
    node.imageMaterial.color.set('#ffffff');
    node.imageMaterial.needsUpdate = true;
    this.textureStates.set(request.displayId, 'loaded');
    this.pumpTextureQueue();
  }

  private failTextureRequest(request: TextureRequest, node: DisplayNode): void {
    this.textureLoadingCount = Math.max(0, this.textureLoadingCount - 1);
    this.textureConcurrency.set(this.textureLoadingCount);
    if (this.displayNodes.get(request.displayId) === node && request.token === this.textureRequestToken) {
      node.imageMaterial.color.set('#c8a78d');
      node.imageMaterial.needsUpdate = true;
      this.textureStates.set(request.displayId, 'failed');
    }
    this.pumpTextureQueue();
  }

  private releaseNodeTexture(node: DisplayNode): void {
    node.texture?.dispose();
    node.texture = undefined;
    node.imageMaterial.map = null;
    node.imageMaterial.color.set('#fff6e7');
    node.imageMaterial.needsUpdate = true;
  }

  private updateSceneMetrics(): void {
    this.renderedDisplays.set(this.displayNodes.size);
    this.loadedTextures.set([...this.displayNodes.values()].filter((node) => Boolean(node.texture)).length);
    this.texturesPending.set(this.textureQueue.length + this.textureLoadingCount);
    this.isLoading.set(this.textureQueue.length + this.textureLoadingCount > 0 && this.renderedDisplays() > 0);
  }

  private updateActiveRoom(force = false): void {
    if (!this.camera || !this.roomBounds.length) {
      return;
    }

    const containingRoom = this.roomBounds.find((room) => this.camera!.position.z >= room.start && this.camera!.position.z <= room.end);
    const next = containingRoom || this.roomBounds.reduce((closest, room) => {
      const distance = this.camera!.position.z < room.start ? room.start - this.camera!.position.z : this.camera!.position.z - room.end;
      const closestDistance = this.camera!.position.z < closest.start ? closest.start - this.camera!.position.z : this.camera!.position.z - closest.end;
      return distance < closestDistance ? room : closest;
    }, this.roomBounds[0]);
    if (!force && this.activeRoom?.room.id === next.room.id) {
      return;
    }
    this.setActiveRoom(next, true);
  }

  private setActiveRoom(room: RoomBounds, announce: boolean): void {
    this.activeRoom = room;
    const roomIndex = this.roomBounds.indexOf(room);
    const direction = this.lastActiveRoomIndex >= 0 && roomIndex < this.lastActiveRoomIndex ? -1 : 1;
    this.textureNeighborDirection = direction;
    const neighborIndex = Math.min(this.roomBounds.length - 1, Math.max(0, roomIndex + direction));
    const neighbors = [...new Set([room.room.id, this.roomBounds[neighborIndex]?.room.id].filter((id): id is string => Boolean(id)))];
    for (const roomBound of this.roomBounds) {
      const shouldBuild = neighbors.includes(roomBound.room.id);
      if (shouldBuild) {
        this.buildRoom(roomBound);
        roomBound.group.visible = true;
      } else {
        this.unbuildRoom(roomBound);
        roomBound.group.visible = false;
      }
    }
    this.lastActiveRoomIndex = roomIndex;
    this.crowd?.setActiveRoom(room.room.id);
    this.updateTextureWindow(room.room.id, this.roomBounds[neighborIndex]?.room.id);
    if (announce) {
      this.roomChanged.emit(room.room.id);
    }
  }

  private unbuildRoom(roomBounds: RoomBounds): void {
    if (!roomBounds.built) {
      return;
    }

    this.textureRequestToken += 1;
    this.textureQueue.length = 0;
    for (const display of roomBounds.room.displays) {
      const node = this.displayNodes.get(display.id);
      if (!node) {
        continue;
      }
      this.releaseNodeTexture(node);
      this.textureStates.delete(display.id);
      this.desiredTextureIds.delete(display.id);
      const meshIndex = this.selectablePhotoMeshes.indexOf(node.imageMesh);
      if (meshIndex >= 0) {
        this.selectablePhotoMeshes.splice(meshIndex, 1);
      }
      if (this.selectedNode === node) {
        this.selectedNode = undefined;
      }
      this.displayNodes.delete(display.id);
    }
    this.floorMeshes = this.floorMeshes.filter((floor) => floor.parent !== roomBounds.group);
    this.disposeGroupContents(roomBounds.group);
    roomBounds.built = false;
    this.updateSceneMetrics();
  }

  private updateMovement(delta: number): void {
    if (!this.camera || !this.scene) {
      return;
    }

    const xrPresenting = this.renderer?.xr.isPresenting ?? false;
    const keyboardForward = (this.keys.has('w') || this.keys.has('arrowup') ? 1 : 0) - (this.keys.has('s') || this.keys.has('arrowdown') ? 1 : 0);
    const keyboardRight = (this.keys.has('d') || this.keys.has('arrowright') ? 1 : 0) - (this.keys.has('a') || this.keys.has('arrowleft') ? 1 : 0);
    const xrInput = xrPresenting ? this.getXRThumbstickInput() : { forward: 0, right: 0 };
    const inputForward = xrPresenting ? xrInput.forward : keyboardForward - this.joystick.y;
    const inputRight = xrPresenting ? xrInput.right : keyboardRight + this.joystick.x;

    if (inputForward === 0 && inputRight === 0) {
      this.updateActiveRoom();
      return;
    }

    this.direction.set(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.direction.y = 0;
    this.direction.normalize();
    this.rightDirection.set(1, 0, 0).applyQuaternion(this.camera.quaternion);
    this.rightDirection.y = 0;
    this.rightDirection.normalize();
    this.movement.copy(this.direction).multiplyScalar(inputForward).addScaledVector(this.rightDirection, inputRight);
    if (this.movement.lengthSq() > 1) {
      this.movement.normalize();
    }

    const speed = xrPresenting ? 2.2 : 3.2;
    this.camera.position.addScaledVector(this.movement, speed * delta);
    this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -7.8, 7.8);
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, 0.35, this.totalLength - 0.35);
    this.camera.position.y = 1.65;
    this.updateActiveRoom();
  }

  private getXRThumbstickInput(): { forward: number; right: number } {
    const session = this.renderer?.xr.getSession();
    if (!session) {
      return { forward: 0, right: 0 };
    }

    for (const source of session.inputSources) {
      const axes = source.gamepad?.axes ?? [];
      if (axes.length < 2) {
        continue;
      }
      const axisX = axes.length >= 4 ? axes[2] : axes[0];
      const axisY = axes.length >= 4 ? axes[3] : axes[1];
      if (Math.abs(axisX) < 0.08 && Math.abs(axisY) < 0.08) {
        continue;
      }
      return { forward: -axisY, right: axisX };
    }

    return { forward: 0, right: 0 };
  }

  private renderFrame(time: number): void {
    if (!this.renderer || !this.scene || !this.camera || this.disposed) {
      return;
    }

    if (document.visibilityState === 'hidden' && !this.renderer.xr.isPresenting) {
      // Avoid applying the whole time spent in a background tab to either the
      // camera or the crowd when the tab becomes visible again.
      this.lastFrameTime = 0;
      return;
    }

    const delta = this.lastFrameTime ? Math.min(Math.max(0, (time - this.lastFrameTime) / 1000), 0.12) : 0;
    this.lastFrameTime = time;
    this.updateMovement(delta);
    this.crowd?.update(delta, time / 1000, this.activeRoom?.room.id, this.camera);
    if (time - this.lastCrowdHudUpdate > 100) {
      this.refreshCrowdHud(time / 1000);
      this.lastCrowdHudUpdate = time;
    }
    if (this.activeRoom && time - this.lastTextureWindowUpdate > 350 && Math.abs(this.camera.position.z - this.lastTextureWindowZ) > 2) {
      const activeIndex = this.roomBounds.indexOf(this.activeRoom);
      const direction = this.textureNeighborDirection;
      const neighborIndex = Math.min(this.roomBounds.length - 1, Math.max(0, activeIndex + direction));
      this.updateTextureWindow(this.activeRoom.room.id, this.roomBounds[neighborIndex]?.room.id);
    }
    this.renderer.render(this.scene, this.camera);
  }

  private refreshCrowdHud(now: number): void {
    const activeVisitorCount = this.crowd?.getActiveVisitorCount(this.activeRoom?.room.id) ?? 0;
    if (activeVisitorCount !== this.activeVisitors()) {
      this.activeVisitors.set(activeVisitorCount);
      this.visitorCountChanged.emit(activeVisitorCount);
    }
    this.crowdMotion.set(this.crowd?.getMotionState(this.activeRoom?.room.id) ?? 'paused');
    this.visitorPose.set(this.crowd?.getPoseState(this.activeRoom?.room.id) ?? 'standing');
    this.visitorAnimation.set(this.crowd?.getAnimationState(this.activeRoom?.room.id) ?? 'idle');
    this.invalidVisitorAnimations.set(this.crowd?.getInvalidAnimationCount() ?? 0);
    this.visitorPositionHash.set(this.crowd?.getPositionHash(this.activeRoom?.room.id) ?? '');
    const bubbles = this.crowd?.getBubbles(now, this.activeRoom?.room.id) ?? [];
    if (!this.camera || !this.renderer) {
      this.dialogueBubbles.set([]);
      return;
    }
    const nextBubbles = bubbles
      .map((bubble) => {
        const projected = this.roomScratch.copy(bubble.position).project(this.camera!);
        return {
          ...bubble,
          left: THREE.MathUtils.clamp((projected.x * .5 + .5) * 100, 24, 76),
          top: THREE.MathUtils.clamp((-projected.y * .5 + .5) * 100, 10, 78),
          depth: projected.z
        };
      })
      .filter((bubble) => bubble.depth > -1 && bubble.depth < 1)
      .map(({ depth: _depth, ...bubble }) => bubble);
    this.dialogueBubbles.set(nextBubbles);
  }

  private updateJoystick(event: PointerEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX - (rect.left + rect.width / 2);
    const y = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(x, y);
    const limit = rect.width * 0.34;
    const scale = distance > limit ? limit / distance : 1;
    this.joystick.x = (x * scale) / limit;
    this.joystick.y = (y * scale) / limit;
    this.joystickX = this.joystick.x;
    this.joystickY = this.joystick.y;
  }

  private resize(): void {
    if (!this.renderer || !this.camera) {
      return;
    }

    const rect = this.host.nativeElement.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private disposeGroupContents(group: THREE.Group): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    group.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) {
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
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    group.clear();
  }

  private disposeScene(): void {
    if (!this.scene) {
      return;
    }

    this.crowd?.dispose();
    this.crowd = undefined;
    this.dialogueBubbles.set([]);
    this.activeVisitors.set(0);
    this.visitorPool.set(0);
    this.visitorPose.set('standing');
    this.visitorAnimation.set('idle');
    this.invalidVisitorAnimations.set(0);
    this.crowdMotion.set('paused');
    this.visitorPositionHash.set('');
    this.textureRequestToken += 1;
    this.textureQueue.length = 0;
    this.textureStates.clear();
    this.desiredTextureIds.clear();
    this.textureLoadingCount = 0;
    this.textureConcurrency.set(0);
    this.texturesPending.set(0);
    this.renderedDisplays.set(0);
    this.loadedTextures.set(0);

    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Line)) {
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
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    this.scene.clear();
    this.floorMeshes = [];
  }
}
