import * as Phaser from 'phaser';

export type LoveFightInput = 'left' | 'right' | 'jump' | 'crouch' | 'light' | 'heavy' | 'weapon' | 'dodge' | 'pause';

interface KeyLike {
  readonly isDown: boolean;
}

interface KeyboardLikeEvent {
  readonly keyCode: number;
}

export const INPUT_BUFFER_MS = 100;

const KEY_BINDINGS: Readonly<Record<LoveFightInput, readonly number[]>> = {
  left: [Phaser.Input.Keyboard.KeyCodes.A, Phaser.Input.Keyboard.KeyCodes.LEFT],
  right: [Phaser.Input.Keyboard.KeyCodes.D, Phaser.Input.Keyboard.KeyCodes.RIGHT],
  jump: [Phaser.Input.Keyboard.KeyCodes.W, Phaser.Input.Keyboard.KeyCodes.UP],
  crouch: [Phaser.Input.Keyboard.KeyCodes.S, Phaser.Input.Keyboard.KeyCodes.DOWN],
  light: [Phaser.Input.Keyboard.KeyCodes.J],
  heavy: [Phaser.Input.Keyboard.KeyCodes.K],
  weapon: [Phaser.Input.Keyboard.KeyCodes.L],
  dodge: [Phaser.Input.Keyboard.KeyCodes.SPACE],
  pause: [Phaser.Input.Keyboard.KeyCodes.ESC]
};

export class LoveFightInputController {
  private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin | null;
  private readonly keys: Partial<Record<LoveFightInput, readonly KeyLike[]>> = {};
  private readonly held = new Set<LoveFightInput>();
  private readonly virtualHeld = new Set<LoveFightInput>();
  private readonly inputBuffer: Array<{ readonly action: LoveFightInput; readonly createdAt: number }> = [];
  private readonly onKeyDown = (event: KeyboardLikeEvent): void => {
    const action = this.actionForCode(event.keyCode);
    if (!action) return;
    if (!this.held.has(action)) this.buffer(action);
    this.held.add(action);
  };
  private readonly onKeyUp = (event: KeyboardLikeEvent): void => {
    const action = this.actionForCode(event.keyCode);
    if (!action) return;
    if (!this.keys[action]?.some((key) => key.isDown)) this.held.delete(action);
  };

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    this.keyboard = keyboard;
    if (!keyboard) return;
    (Object.entries(KEY_BINDINGS) as [LoveFightInput, readonly number[]][]).forEach(([action, codes]) => {
      this.keys[action] = codes.map((code) => keyboard.addKey(code));
    });
    keyboard.on('keydown', this.onKeyDown);
    keyboard.on('keyup', this.onKeyUp);
  }

  update(): void {
    const now = this.now();
    (Object.keys(KEY_BINDINGS) as LoveFightInput[]).forEach((action) => {
      const down = Boolean(this.keys[action]?.some((key) => key.isDown));
      if (down && !this.held.has(action)) {
        this.buffer(action, now);
      }
      if (down) this.held.add(action);
      else this.held.delete(action);
    });
    this.inputBuffer.splice(0, this.inputBuffer.length, ...this.inputBuffer.filter((item) => now - item.createdAt <= INPUT_BUFFER_MS || this.isDown(item.action)));
  }

  isDown(action: LoveFightInput): boolean {
    return this.held.has(action) || this.virtualHeld.has(action);
  }

  consume(action: LoveFightInput): boolean {
    const index = this.inputBuffer.findIndex((item) => item.action === action);
    if (index < 0) return false;
    this.inputBuffer.splice(index, 1);
    return true;
  }

  queue(action: LoveFightInput): void {
    this.buffer(action);
  }

  setVirtual(action: LoveFightInput, active: boolean): void {
    if (active) this.virtualHeld.add(action);
    else this.virtualHeld.delete(action);
  }

  destroy(): void {
    this.keyboard?.off('keydown', this.onKeyDown);
    this.keyboard?.off('keyup', this.onKeyUp);
    this.held.clear();
    this.virtualHeld.clear();
    this.inputBuffer.length = 0;
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  private actionForCode(code: number): LoveFightInput | undefined {
    return (Object.entries(KEY_BINDINGS) as [LoveFightInput, readonly number[]][]).find(([, codes]) => codes.includes(code))?.[0];
  }

  private buffer(action: LoveFightInput, createdAt = this.now()): void {
    this.inputBuffer.push({ action, createdAt });
  }
}
