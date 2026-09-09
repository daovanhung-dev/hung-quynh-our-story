export interface MuseumDisplaySlot {
  side: -1 | 1;
  row: number;
  column: number;
  x: number;
  y: number;
  z: number;
}

export interface MuseumRoomLayout {
  columns: number;
  rows: number;
  depth: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  slotWidth: number;
  rowHeight: number;
}

export const MUSEUM_MAX_WALL_ROWS = 3;
export const MUSEUM_FRAME_WIDTH = 2.75;
export const MUSEUM_FRAME_HEIGHT = 1.85;
export const MUSEUM_SLOT_WIDTH = 3.6;
export const MUSEUM_ROW_HEIGHT = 2.35;
export const MUSEUM_WALL_X = 8.78;

/**
 * Keeps the gallery readable by expanding along its length instead of
 * stacking an unbounded number of frames vertically.
 */
export function getMuseumRoomLayout(displayCount: number): MuseumRoomLayout {
  const displaysPerSide = Math.max(1, Math.ceil(Math.max(0, displayCount) / 2));
  const rows = Math.min(MUSEUM_MAX_WALL_ROWS, Math.max(1, Math.ceil(Math.sqrt(displaysPerSide / 2))));
  const columns = Math.max(1, Math.ceil(displaysPerSide / rows));
  const depth = Math.max(24, columns * MUSEUM_SLOT_WIDTH + 10);
  const height = Math.max(7.2, 2.25 + rows * MUSEUM_ROW_HEIGHT + MUSEUM_FRAME_HEIGHT / 2 + .8);

  return {
    columns,
    rows,
    depth,
    height,
    frameWidth: MUSEUM_FRAME_WIDTH,
    frameHeight: MUSEUM_FRAME_HEIGHT,
    slotWidth: MUSEUM_SLOT_WIDTH,
    rowHeight: MUSEUM_ROW_HEIGHT
  };
}

export function getMuseumDisplaySlot(
  index: number,
  layout: MuseumRoomLayout,
  center: number
): MuseumDisplaySlot {
  const side: -1 | 1 = index % 2 === 0 ? -1 : 1;
  const slot = Math.floor(index / 2);
  const column = slot % layout.columns;
  const row = Math.min(layout.rows - 1, Math.floor(slot / layout.columns));
  const z = center - ((layout.columns - 1) * layout.slotWidth) / 2 + column * layout.slotWidth;
  const y = 2.05 + row * layout.rowHeight;

  return { side, row, column, x: side * MUSEUM_WALL_X, y, z };
}

/**
 * Props live in the central aisle. This invariant keeps their footprint away
 * from the photo walls and makes accidental visual occlusion testable.
 */
export function isMuseumPropPositionSafe(
  x: number,
  z: number,
  layout: MuseumRoomLayout,
  center: number,
  occupiedWallZs: readonly number[] = []
): boolean {
  const centralAisle = Math.abs(x) <= 3.25;
  const roomHalfDepth = layout.depth / 2 - 1.1;
  const insideRoom = z >= center - roomHalfDepth && z <= center + roomHalfDepth;
  const clearOfPhotoSightlines = occupiedWallZs.every((wallZ) => Math.abs(z - wallZ) >= 2);
  return centralAisle && insideRoom && clearOfPhotoSightlines;
}
