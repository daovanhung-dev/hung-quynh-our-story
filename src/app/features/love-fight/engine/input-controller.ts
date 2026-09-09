import * as Phaser from 'phaser';

export type LoveFightInput = 'left' | 'right' | 'jump' | 'crouch' | 'light' | 'heavy' | 'weapon' | 'dodge' | 'pause';

interface KeyLike {
  readonly isDown: boolean;
}

const KEY_BINDINGS: Readonly<Record<LoveFightInput, number>> = {
  left: Phaser.Input.Keyboard.KeyCodes.A,
  right: Phaser.Input.Keyboard.KeyCodes.D,
  jump: Phaser.Input.Keyboard.KeyCodes.W,
  crouch: Phaser.Input.Keyboard.KeyCodes.S,
  light: Phaser.Input.Keyboard.KeyCodes.J,
  heavy: Phaser.Input.Keyboard.KeyCodes.K,
  weapon: Phaser.Input.Keyboard.KeyCodes.L,
  dodge: Phaser.Input.Keyboard.KeyCodes.SPACE,
  pause: Phaser.Input.Keyboard.KeyCodes.ESC
};

export class LoveFightInputController {
  private readonly keys: Partial<Record<LoveFightInput, KeyLike>> = {};
  private readonly held = new Set<LoveFightInput>();
  private readonly virtualHeld = new Set<LoveFightInput>();
  private readonly justPressed = new Set<LoveFightInput>();
  private readonly queued = new Set<LoveFightInput>();

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) return;
    (Object.entries(KEY_BINDINGS) as [LoveFightInput, number][]).forEach(([action, code]) => {
      this.keys[action] = keyboard.addKey(code);
    });
  }

  update(): void {
    (Object.keys(KEY_BINDINGS) as LoveFightInput[]).forEach((action) => {
      const down = Boolean(this.keys[action]?.isDown);
      if (down && !this.held.has(action)) this.justPressed.add(action);
      if (down) this.held.add(action);
      else this.held.delete(action);
    });
  }

  isDown(action: LoveFightInput): boolean {
    return this.held.has(action) || this.virtualHeld.has(action);
  }

  consume(action: LoveFightInput): boolean {
    if (this.justPressed.delete(action) || this.queued.delete(action)) return true;
    return false;
  }

  queue(action: LoveFightInput): void {
    this.queued.add(action);
  }

  setVirtual(action: LoveFightInput, active: boolean): void {
    if (active) this.virtualHeld.add(action);
    else this.virtualHeld.delete(action);
  }

  destroy(): void {
    this.held.clear();
    this.virtualHeld.clear();
    this.justPressed.clear();
    this.queued.clear();
  }
}
