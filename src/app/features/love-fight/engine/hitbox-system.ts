export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface TimedHitbox {
  readonly activeFromMs: number;
  readonly activeToMs: number;
  readonly damage: number;
  readonly box: Rect;
}

export interface FighterBoxes {
  readonly push: Rect;
  readonly hurt: readonly Rect[];
  readonly attacks: Readonly<Record<string, readonly TimedHitbox[]>>;
}

export const normalizedFighterBoxes = (x: number, y: number): FighterBoxes => ({
  push: { x: x - 34, y: y - 270, width: 68, height: 270 },
  hurt: [{ x: x - 42, y: y - 278, width: 84, height: 278 }],
  attacks: {
    light: [{ activeFromMs: 70, activeToMs: 150, damage: 8, box: { x: x + 12, y: y - 215, width: 126, height: 70 } }],
    heavy: [{ activeFromMs: 100, activeToMs: 210, damage: 12, box: { x: x + 6, y: y - 190, width: 168, height: 78 } }],
    weapon: [{ activeFromMs: 120, activeToMs: 260, damage: 10, box: { x: x + 2, y: y - 235, width: 210, height: 100 } }]
  }
});

export const rectanglesOverlap = (first: Rect, second: Rect): boolean => (
  first.x < second.x + second.width &&
  first.x + first.width > second.x &&
  first.y < second.y + second.height &&
  first.y + first.height > second.y
);
