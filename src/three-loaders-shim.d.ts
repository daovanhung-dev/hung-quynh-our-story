declare module 'three/addons/loaders/GLTFLoader.js' {
  import type { AnimationClip, Group } from 'three';

  export interface GLTF {
    scene: Group;
    animations: AnimationClip[];
  }

  export class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent<EventTarget>) => void,
      onError?: (event: unknown) => void
    ): void;
  }
}

declare module 'three/addons/utils/SkeletonUtils.js' {
  import type { Object3D } from 'three';

  export function clone(source: Object3D): Object3D;
}
