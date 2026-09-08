declare module 'three' {
  export class Color {
    constructor(color?: string | number);
    set(color: string | number): this;
  }

  export class Vector2 {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
  }

  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    x: number;
    y: number;
    z: number;
    set(x: number, y: number, z: number): this;
    setFromMatrixPosition(matrix: Matrix4): this;
    copy(vector: Vector3): this;
    add(vector: Vector3): this;
    addScaledVector(vector: Vector3, scalar: number): this;
    sub(vector: Vector3): this;
    multiplyScalar(scalar: number): this;
    applyQuaternion(quaternion: Quaternion): this;
    transformDirection(matrix: Matrix4): this;
    normalize(): this;
    lengthSq(): number;
  }

  export class Quaternion {}
  export class Matrix4 {}

  export class Fog {
    constructor(color: string | number, near: number, far: number);
  }

  export class Object3D {
    name: string;
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: { z: number; set(x: number, y: number, z: number): void; setScalar(value: number): void };
    children: Object3D[];
    userData: Record<string, unknown>;
    matrixWorld: Matrix4;
    quaternion: Quaternion;
    add(...objects: Object3D[]): this;
    getWorldPosition(target: Vector3): this;
    addEventListener(type: string, listener: () => void): void;
    traverse(callback: (object: Object3D) => void): void;
  }

  export class Group extends Object3D {}

  export class Scene extends Object3D {
    background: Color;
    fog?: Fog;
    clear(): void;
  }

  export class Camera extends Object3D {}

  export class PerspectiveCamera extends Camera {
    constructor(fov: number, aspect: number, near: number, far: number);
    aspect: number;
    updateProjectionMatrix(): void;
    lookAt(x: number, y: number, z: number): void;
  }

  export class BufferGeometry {
    setFromPoints(points: Vector3[]): this;
    dispose(): void;
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width: number, height: number);
  }

  export class BoxGeometry extends BufferGeometry {
    constructor(width: number, height: number, depth: number);
  }

  export class Texture {
    colorSpace: string;
    dispose(): void;
  }

  export class CanvasTexture extends Texture {
    constructor(canvas: HTMLCanvasElement);
  }

  export class Material {
    map: Texture | null;
    dispose(): void;
  }

  export class MeshStandardMaterial extends Material {
    constructor(parameters?: Record<string, unknown>);
    color: Color;
    needsUpdate: boolean;
    clone(): MeshStandardMaterial;
  }

  export class MeshBasicMaterial extends Material {
    constructor(parameters?: Record<string, unknown>);
    needsUpdate: boolean;
  }

  export class LineBasicMaterial extends Material {
    constructor(parameters?: Record<string, unknown>);
  }

  export class Mesh extends Object3D {
    constructor(geometry: BufferGeometry, material: Material | Material[]);
    geometry: BufferGeometry;
    material: Material | Material[];
  }

  export class Line extends Object3D {
    constructor(geometry: BufferGeometry, material: Material);
    geometry: BufferGeometry;
    material: Material;
  }

  export class HemisphereLight extends Object3D {
    constructor(skyColor: string, groundColor: string, intensity: number);
  }

  export class PointLight extends Object3D {
    constructor(color: string, intensity: number, distance: number, decay: number);
  }

  export class TextureLoader {
    load(
      url: string,
      onLoad: (texture: Texture) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: unknown) => void
    ): Texture;
  }

  export interface Intersection {
    object: Object3D;
    point: Vector3;
  }

  export class Raycaster {
    ray: { origin: Vector3; direction: Vector3 };
    set(origin: Vector3, direction: Vector3): void;
    setFromCamera(coords: Vector2, camera: Camera): void;
    intersectObjects(objects: Object3D[], recursive?: boolean): Intersection[];
  }

  export class WebGLRenderer {
    constructor(parameters?: { canvas?: HTMLCanvasElement; antialias?: boolean; powerPreference?: string });
    domElement: HTMLCanvasElement;
    outputColorSpace: string;
    xr: {
      enabled: boolean;
      isPresenting: boolean;
      getController(index: number): Group;
      getSession(): { inputSources: Array<{ gamepad?: { axes: number[] } }> } | null;
    };
    setPixelRatio(value: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    setAnimationLoop(callback: ((time: number) => void) | null): void;
    render(scene: Scene, camera: Camera): void;
    dispose(): void;
  }

  export const MathUtils: {
    clamp(value: number, min: number, max: number): number;
  };

  export const SRGBColorSpace: string;
}

declare module 'three/addons/controls/PointerLockControls.js' {
  import type { Camera } from 'three';

  export class PointerLockControls {
    constructor(camera: Camera, domElement: HTMLElement);
    isLocked: boolean;
    lock(): void;
    disconnect(): void;
  }
}

declare module 'three/addons/webxr/VRButton.js' {
  import type { WebGLRenderer } from 'three';

  export const VRButton: {
    createButton(renderer: WebGLRenderer): HTMLElement;
  };
}
