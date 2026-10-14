import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, signal, SimpleChanges, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { HouseHotspot, HouseRoom, HouseRoomId } from '../models/our-home.model';
import { createHouse3DRoom } from './house-3d-room';

interface ProjectedHotspot {
  readonly left: number;
  readonly top: number;
  readonly visible: boolean;
}

@Component({
  selector: 'app-house-scene',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="house-scene" [class.is-reduced-motion]="reducedMotion">
    <section #stage class="scene-stage" [class]="'scene-stage mood-' + mood + (reducedMotion ? ' is-reduced-motion' : '') + (lampOn ? '' : ' is-lamp-off') + (room.id === 'entrance' && introStage === 'welcome' ? ' is-welcome' : '') + (room.id === 'entrance' && introStage === 'story' ? ' is-waking' : '')" [attr.data-room-id]="room.id" [attr.data-render-status]="renderStatus()" [attr.data-view-degrees]="viewDegrees()" [attr.aria-label]="room.title">
      <canvas
        #canvas
        class="house-canvas"
        [class.is-hidden]="renderStatus() === 'fallback'"
        [attr.data-room-model]="room.id"
        aria-hidden="true"
        (pointerdown)="onCanvasPointerDown($event)"
        (pointerup)="onCanvasPointerUp($event)"
        (pointercancel)="clearCanvasPointer()"
      ></canvas>
      @if (renderStatus() === 'fallback') {
        @if (!failedArtworkRooms().has(room.id)) {
          <img class="room-art" [attr.data-room-art]="room.id" [src]="artworkPath(room.id)" alt="" aria-hidden="true" draggable="false" fetchpriority="high" decoding="async" (load)="animateArtwork($event)" (error)="onArtworkError(room.id)">
        } @else {
          <div class="scene-fallback" aria-hidden="true"><span class="fallback-moon">☾</span><span class="fallback-home">⌂</span><span class="fallback-title">{{ room.title }}</span><span class="fallback-note">Một góc nhỏ dành cho chúng mình</span></div>
        }
      }
      @if (renderStatus() === 'ready') {
        <div class="scene-hotspots" aria-hidden="true">
          @for (hotspot of room.hotspots; track hotspot.id) {
            @let projection = hotspotProjection()[hotspot.id];
            @if (projection?.visible) {
              <span class="hotspot" [style.left.%]="projection.left" [style.top.%]="projection.top">
                <span class="hotspot-icon">{{ hotspot.icon }}</span><span class="hotspot-label">{{ hotspot.visualLabel }}</span>
              </span>
            }
          }
        </div>
        <div class="view-controls" aria-label="Điều khiển góc nhìn 3D">
          <button class="view-button reset-view" type="button" aria-label="Đưa mô hình về góc nhìn ban đầu" (click)="resetView()">↺ Góc nhìn ban đầu</button>
          <div class="rotate-buttons">
            <button class="view-button" type="button" aria-label="Xoay mô hình sang trái 45 độ" (click)="rotateBy(-45)">↶</button>
            <button class="view-button" type="button" aria-label="Xoay mô hình sang phải 45 độ" (click)="rotateBy(45)">↷</button>
          </div>
        </div>
      }
      <div class="scene-wash" aria-hidden="true"></div>
      <p class="scene-hint" aria-hidden="true">Kéo để xoay 360° · Chạm vào đồ vật để khám phá</p>
    </section>
    <nav class="scene-interactions" [attr.aria-label]="'Tương tác trong ' + room.title">
      @for (hotspot of room.hotspots; track hotspot.id) {
        <button class="interaction-button" type="button" [attr.data-hotspot-id]="hotspot.id" [attr.aria-label]="hotspot.label" (click)="activated.emit(hotspot)">
          <span aria-hidden="true">{{ hotspot.icon }}</span><span>{{ hotspot.visualLabel }}</span>
        </button>
      }
    </nav>
    </div>
  `,
  styleUrl: './house-scene.component.scss'
})
export class HouseSceneComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) room!: HouseRoom;
  @Input({ required: true }) mood: 'dawn' | 'day' | 'sunset' | 'night' = 'day';
  @Input() reducedMotion = false;
  @Input() lampOn = true;
  @Input() introStage: 'welcome' | 'story' | 'done' = 'done';
  @Output() readonly activated = new EventEmitter<HouseHotspot>();

  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stage', { static: true }) private readonly stageRef!: ElementRef<HTMLElement>;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly contextLostListener = (event: Event): void => {
    event.preventDefault();
    this.fallBackToArtwork();
  };
  private readonly handleControlsChange = (): void => {
    this.renderScene();
    this.updateHotspotProjection();
    this.updateRotationValue();
  };
  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private controls?: OrbitControls;
  private roomModel?: THREE.Group;
  private roomAnchors?: ReadonlyMap<string, THREE.Vector3>;
  private activeLamp?: THREE.PointLight;
  private resizeObserver?: ResizeObserver;
  private pendingCanvasPointer?: { id: number; x: number; y: number };
  private disposed = false;
  private readonly vectorFallbackRooms = signal<ReadonlySet<HouseRoomId>>(new Set());
  protected readonly failedArtworkRooms = signal<ReadonlySet<HouseRoomId>>(new Set());
  protected readonly renderStatus = signal<'starting' | 'ready' | 'fallback'>('starting');
  protected readonly hotspotProjection = signal<Readonly<Record<string, ProjectedHotspot>>>({});
  protected readonly viewDegrees = signal(0);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['room'] && this.room) {
      if (this.renderer && this.scene) this.rebuildRoom();
    }
    if (changes['lampOn'] && this.activeLamp) {
      this.activeLamp.intensity = this.lampOn ? 1.55 : 0.08;
      this.renderScene();
    }
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('webglcontextlost', this.contextLostListener);
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.setPixelRatio(Math.min(this.canvasRef.nativeElement.ownerDocument.defaultView?.devicePixelRatio ?? 1, 1.5));
      this.renderer.setClearColor('#000000', 0);

      this.scene = new THREE.Scene();
      this.scene.background = null;
      this.scene.add(new THREE.HemisphereLight('#fff2e2', '#5b3c50', 2.0));
      const keyLight = new THREE.DirectionalLight('#fff6e7', 2.25);
      keyLight.position.set(-4.5, 8, 6);
      this.scene.add(keyLight);

      this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
      this.camera.position.set(0, 4.65, 9.0);
      this.controls = new OrbitControls(this.camera, canvas);
      this.controls.target.set(0, 1.05, 0);
      this.controls.enableDamping = false;
      this.controls.enablePan = false;
      this.controls.enableZoom = true;
      this.controls.minDistance = 6.2;
      this.controls.maxDistance = 15.5;
      this.controls.minPolarAngle = 0.52;
      this.controls.maxPolarAngle = 1.42;
      this.controls.minAzimuthAngle = -Infinity;
      this.controls.maxAzimuthAngle = Infinity;
      this.controls.addEventListener('change', this.handleControlsChange);

      this.resizeObserver = new ResizeObserver(() => this.resizeRenderer());
      this.resizeObserver.observe(this.stageRef.nativeElement);
      this.rebuildRoom();
      this.renderStatus.set('ready');
      this.resizeRenderer();
      this.controls.update();
      this.renderScene();
      this.updateHotspotProjection();
      this.updateRotationValue();
    } catch {
      this.fallBackToArtwork();
    }
  }

  ngOnDestroy(): void {
    this.disposed = true;
    this.resizeObserver?.disconnect();
    this.controls?.removeEventListener('change', this.handleControlsChange);
    this.controls?.dispose();
    this.disposeRoomModel();
    this.renderer?.dispose();
    this.canvasRef.nativeElement.removeEventListener('webglcontextlost', this.contextLostListener);
  }

  protected onCanvasPointerDown(event: PointerEvent): void {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.pendingCanvasPointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  protected onCanvasPointerUp(event: PointerEvent): void {
    const start = this.pendingCanvasPointer;
    this.pendingCanvasPointer = undefined;
    if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 9) return;
    const canvas = this.canvasRef.nativeElement;
    const bounds = canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    this.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    if (!this.camera || !this.roomModel) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([this.roomModel], true);
    let target: THREE.Object3D | null = hits[0]?.object ?? null;
    while (target && !target.userData['hotspotId']) target = target.parent;
    const hotspotId = target?.userData['hotspotId'];
    if (typeof hotspotId !== 'string') return;
    const hotspot = this.room.hotspots.find((item) => item.id === hotspotId);
    if (hotspot) this.activated.emit(hotspot);
  }

  protected clearCanvasPointer(): void {
    this.pendingCanvasPointer = undefined;
  }

  protected rotateBy(degrees: number): void {
    if (!this.controls || !this.camera) return;
    const target = this.controls.target;
    const offset = this.camera.position.clone().sub(target);
    const distance = Math.sqrt(offset.lengthSq());
    const polar = Math.acos(THREE.MathUtils.clamp(offset.y / distance, -1, 1));
    const azimuth = this.controls.getAzimuthalAngle() + degrees * Math.PI / 180;
    const horizontalRadius = distance * Math.sin(polar);
    this.camera.position.set(
      target.x + horizontalRadius * Math.sin(azimuth),
      target.y + distance * Math.cos(polar),
      target.z + horizontalRadius * Math.cos(azimuth)
    );
    this.controls.update();
    this.handleControlsChange();
  }

  protected resetView(): void {
    this.controls?.reset();
    this.controls?.update();
    this.handleControlsChange();
  }

  protected animateArtwork(event: Event): void {
    const image = event.currentTarget;
    if (!(image instanceof HTMLImageElement)) return;
    image.classList.remove('is-entering');
    if (this.reducedMotion) return;
    void image.offsetWidth;
    image.classList.add('is-entering');
  }

  protected artworkPath(roomId: HouseRoomId): string {
    const extension = this.vectorFallbackRooms().has(roomId) ? '.svg' : '-isometric.webp';
    return `our-home/rooms/${roomId}${extension}`;
  }

  protected onArtworkError(roomId: HouseRoomId): void {
    if (!this.vectorFallbackRooms().has(roomId)) {
      this.vectorFallbackRooms.update((rooms) => new Set(rooms).add(roomId));
      return;
    }
    this.failedArtworkRooms.update((rooms) => new Set(rooms).add(roomId));
  }

  private rebuildRoom(): void {
    if (!this.scene || !this.room || !this.controls || !this.camera) return;
    this.disposeRoomModel();
    const room = createHouse3DRoom(this.room.id, this.lampOn);
    this.roomModel = room.group;
    this.roomAnchors = room.anchors;
    this.activeLamp = room.lamp;
    this.scene.add(room.group);
    this.controls.target.set(0, 1.05, 0);
    this.camera.position.set(0, 4.65, 9.0);
    this.controls.update();
    this.controls.saveState();
    this.updateHotspotProjection(room.anchors);
    this.renderScene();
  }

  private disposeRoomModel(): void {
    if (!this.roomModel) return;
    this.roomModel.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material.dispose();
    });
    this.scene?.remove(this.roomModel);
    this.roomModel.clear();
    this.roomModel = undefined;
    this.roomAnchors = undefined;
    this.activeLamp = undefined;
  }

  private resizeRenderer(): void {
    if (!this.renderer || !this.camera || this.disposed) return;
    const bounds = this.stageRef.nativeElement.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderScene();
    this.updateHotspotProjection();
  }

  private renderScene(): void {
    if (this.scene && this.camera && this.renderer && !this.disposed && this.renderStatus() !== 'fallback') {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private updateHotspotProjection(anchors?: ReadonlyMap<string, THREE.Vector3>): void {
    if (!this.camera || !this.roomModel || !this.room) return;
    const activeAnchors = anchors ?? this.roomAnchors;
    if (!activeAnchors) return;
    this.camera.updateMatrixWorld(true);
    this.roomModel.updateMatrixWorld(true);
    const projection: Record<string, ProjectedHotspot> = {};
    for (const hotspot of this.room.hotspots) {
      const anchor = activeAnchors.get(hotspot.id);
      if (!anchor) continue;
      const point = anchor.clone().project(this.camera);
      const left = (point.x + 1) * 50;
      const top = (1 - point.y) * 50;
      projection[hotspot.id] = {
        left,
        top,
        visible: point.z >= -1 && point.z <= 1 && left >= 4 && left <= 96 && top >= 7 && top <= 91
      };
    }
    this.hotspotProjection.set(projection);
  }

  private updateRotationValue(): void {
    if (!this.controls) return;
    const angle = this.controls.getAzimuthalAngle() * 180 / Math.PI;
    this.viewDegrees.set(((Math.round(angle) % 360) + 360) % 360);
  }

  private fallBackToArtwork(): void {
    if (this.renderStatus() === 'fallback') return;
    this.renderStatus.set('fallback');
    this.controls?.removeEventListener('change', this.handleControlsChange);
    this.controls?.dispose();
    this.controls = undefined;
    this.resizeObserver?.disconnect();
    this.disposeRoomModel();
    this.renderer?.dispose();
    this.renderer = undefined;
  }

}
