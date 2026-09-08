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

interface RoomBounds {
  room: MuseumRoom;
  start: number;
  end: number;
  height: number;
  group: THREE.Group;
}

interface DisplayNode {
  display: MuseumDisplay;
  roomId: string;
  group: THREE.Group;
  imageMesh: THREE.Mesh;
  imageMaterial: THREE.MeshStandardMaterial;
  texture?: THREE.Texture;
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
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly keys = new Set<string>();
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly roomBounds: RoomBounds[] = [];
  private readonly displayNodes = new Map<string, DisplayNode>();
  private readonly roomTextures = new Set<string>();
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
  private readonly movement = new THREE.Vector3();
  private readonly roomScratch = new THREE.Vector3();

  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() rooms: readonly MuseumRoom[] = [];
  @Output() readonly photoSelected = new EventEmitter<MuseumDisplay>();
  @Output() readonly roomChanged = new EventEmitter<string>();
  @Output() readonly xrAvailabilityChanged = new EventEmitter<boolean>();

  protected readonly isLoading = signal(false);
  protected readonly webglSupported = signal<boolean | null>(null);
  protected readonly xrSupported = signal(false);
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
    const node = this.displayNodes.get(displayId);
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
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
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
    this.roomTextures.clear();
    this.totalLength = 18;

    this.addLighting();
    this.addLobby();

    let cursor = 0;
    for (const room of this.rooms) {
      const roomBounds = this.buildRoom(room, cursor);
      this.roomBounds.push(roomBounds);
      cursor = roomBounds.end + 1.4;
    }

    this.totalLength = Math.max(cursor + 2, 18);
    if (this.roomBounds.length) {
      const first = this.roomBounds[0];
      this.camera.position.set(0, 1.65, -6.5);
      this.camera.lookAt(0, 1.7, first.start + 7);
      this.setActiveRoom(first, false);
    }
    this.isLoading.set(false);
  }

  private addLighting(): void {
    if (!this.scene) {
      return;
    }

    this.scene.add(new THREE.HemisphereLight('#fff4df', '#2b1018', 1.3));
    const key = new THREE.PointLight('#ffd9b5', 2.2, 30, 1.7);
    key.position.set(0, 5.4, 2);
    this.scene.add(key);
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
    this.scene.add(lobby);
  }

  private buildRoom(room: MuseumRoom, start: number): RoomBounds {
    if (!this.scene) {
      throw new Error('Museum scene is not ready');
    }

    const displaysPerSide = Math.max(1, Math.ceil(room.displays.length / 2));
    const columns = Math.min(5, Math.max(1, Math.ceil(displaysPerSide / 2)));
    const rows = Math.max(1, Math.ceil(displaysPerSide / columns));
    const depth = Math.max(17, columns * 4.15 + 5.5);
    const height = Math.max(6.3, rows * 2.65 + 3.6);
    const end = start + depth;
    const center = start + depth / 2;
    const roomGroup = new THREE.Group();
    roomGroup.name = `room-${room.id}`;

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

    room.displays.forEach((display, index) => {
      const node = this.createDisplayNode(display, room.id, index, columns, center, height);
      roomGroup.add(node.group);
      this.displayNodes.set(display.id, node);
    });

    this.scene.add(roomGroup);
    return { room, start, end, height, group: roomGroup };
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
    columns: number,
    center: number,
    height: number
  ): DisplayNode {
    const side = index % 2 === 0 ? -1 : 1;
    const slot = Math.floor(index / 2);
    const column = slot % columns;
    const row = Math.floor(slot / columns);
    const frameWidth = 2.75;
    const frameHeight = 1.85;
    const z = center - (columns - 1) * 2.05 + column * 4.1;
    const y = Math.min(height - 2.2, 1.9 + row * 2.35);
    const group = new THREE.Group();
    group.name = `display-${display.id}`;
    group.userData['displayId'] = display.id;
    group.userData['display'] = display;
    group.position.set(side * 8.78, y, z);
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
    canvas.width = 1024;
    canvas.height = 180;
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
    const photoHit = this.raycaster.intersectObjects([...this.displayNodes.values()].map((node) => node.imageMesh), false)[0];
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
    const photoHit = this.raycaster.intersectObjects([...this.displayNodes.values()].map((node) => node.imageMesh), false)[0];
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

  private loadRoomTextures(roomId: string): void {
    if (this.roomTextures.has(roomId)) {
      return;
    }

    this.roomTextures.add(roomId);
    const nodes = [...this.displayNodes.values()].filter((node) => node.roomId === roomId);
    this.isLoading.set(nodes.length > 0);
    for (const node of nodes) {
      const source = node.display.media.displaySrc || node.display.media.mediumSrc || node.display.media.src;
      let url: string;
      try {
        url = new URL(source, document.baseURI).href;
      } catch {
        continue;
      }

      this.textureLoader.load(
        url,
        (texture) => {
          if (this.disposed) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          node.texture = texture;
          node.imageMaterial.map = texture;
          node.imageMaterial.color.set('#ffffff');
          node.imageMaterial.needsUpdate = true;
          this.isLoading.set(false);
        },
        undefined,
        () => {
          node.imageMaterial.color.set('#c8a78d');
          node.imageMaterial.needsUpdate = true;
          this.isLoading.set(false);
        }
      );
    }
  }

  private unloadRoomTextures(keepRoomIds: readonly string[]): void {
    const keep = new Set(keepRoomIds);
    for (const roomId of [...this.roomTextures]) {
      if (keep.has(roomId)) {
        continue;
      }
      for (const node of this.displayNodes.values()) {
        if (node.roomId !== roomId || !node.texture) {
          continue;
        }
        node.texture.dispose();
        node.texture = undefined;
        node.imageMaterial.map = null;
        node.imageMaterial.color.set('#fff6e7');
        node.imageMaterial.needsUpdate = true;
      }
      this.roomTextures.delete(roomId);
    }
  }

  private updateActiveRoom(force = false): void {
    if (!this.camera || !this.roomBounds.length) {
      return;
    }

    const next = this.roomBounds.find((room) => this.camera!.position.z >= room.start && this.camera!.position.z <= room.end) || this.roomBounds[0];
    if (!force && this.activeRoom?.room.id === next.room.id) {
      return;
    }
    this.setActiveRoom(next, true);
  }

  private setActiveRoom(room: RoomBounds, announce: boolean): void {
    this.activeRoom = room;
    const roomIndex = this.roomBounds.indexOf(room);
    const neighbors = this.roomBounds.slice(Math.max(0, roomIndex - 1), roomIndex + 2).map((item) => item.room.id);
    this.loadRoomTextures(room.room.id);
    for (const neighborId of neighbors) {
      this.loadRoomTextures(neighborId);
    }
    this.unloadRoomTextures(neighbors);
    if (announce) {
      this.roomChanged.emit(room.room.id);
    }
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
    const rightDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    rightDirection.y = 0;
    rightDirection.normalize();
    this.movement.copy(this.direction).multiplyScalar(inputForward).addScaledVector(rightDirection, inputRight);
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

    const delta = this.lastFrameTime ? Math.min((time - this.lastFrameTime) / 1000, 0.05) : 0;
    this.lastFrameTime = time;
    this.updateMovement(delta);
    this.renderer.render(this.scene, this.camera);
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

  private disposeScene(): void {
    if (!this.scene) {
      return;
    }

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
        if (material instanceof THREE.MeshBasicMaterial || material instanceof THREE.MeshStandardMaterial || material instanceof THREE.LineBasicMaterial) {
          if (material.map) {
            textures.add(material.map);
          }
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
