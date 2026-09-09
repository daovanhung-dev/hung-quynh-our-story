export interface CameraFollowConfig {
  readonly worldWidth: number;
  readonly viewportWidth: number;
  readonly followLerp: number;
  readonly minZoom: number;
  readonly maxZoom: number;
}

export const DEFAULT_CAMERA_CONFIG: CameraFollowConfig = {
  worldWidth: 1280,
  viewportWidth: 960,
  followLerp: 0.12,
  minZoom: 1,
  maxZoom: 1.06
};

export const clampCameraX = (cameraX: number, config: CameraFollowConfig = DEFAULT_CAMERA_CONFIG): number => (
  Math.max(0, Math.min(cameraX, Math.max(0, config.worldWidth - config.viewportWidth)))
);

export const followCameraX = (
  currentX: number,
  leftX: number,
  rightX: number,
  config: CameraFollowConfig = DEFAULT_CAMERA_CONFIG
): number => {
  const midpoint = (leftX + rightX) / 2;
  const desired = clampCameraX(midpoint - config.viewportWidth / 2, config);
  return currentX + (desired - currentX) * config.followLerp;
};

export const cameraZoomFor = (distance: number, comboCount: number, config: CameraFollowConfig = DEFAULT_CAMERA_CONFIG): number => {
  const closeness = Math.max(0, Math.min(1, (360 - distance) / 360));
  const comboBoost = Math.max(0, Math.min(1, (comboCount - 2) / 3));
  return config.minZoom + (config.maxZoom - config.minZoom) * Math.max(closeness, comboBoost);
};
