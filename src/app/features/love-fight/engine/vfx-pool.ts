import * as Phaser from 'phaser';

export class LoveFightVfxPool {
  private readonly available: Phaser.GameObjects.Graphics[] = [];
  private readonly active = new Set<Phaser.GameObjects.Graphics>();

  constructor(private readonly scene: Phaser.Scene, private readonly capacity = 28) {}

  acquire(): Phaser.GameObjects.Graphics {
    const graphics = this.available.pop() || this.scene.add.graphics();
    graphics.clear();
    graphics.setVisible(true);
    graphics.setActive(true);
    graphics.setAlpha(1);
    graphics.setScale(1);
    graphics.setRotation(0);
    this.active.add(graphics);
    return graphics;
  }

  release(graphics: Phaser.GameObjects.Graphics): void {
    if (!this.active.delete(graphics)) return;
    this.scene.tweens.killTweensOf(graphics);
    graphics.clear();
    graphics.setVisible(false);
    graphics.setActive(false);
    if (this.available.length < this.capacity) this.available.push(graphics);
    else graphics.destroy();
  }

  clear(): void {
    this.active.forEach((graphics) => this.release(graphics));
  }

  destroy(): void {
    this.clear();
    this.available.splice(0).forEach((graphics) => graphics.destroy());
  }
}

export class LoveFightSpritePool {
  private readonly available: Phaser.GameObjects.Image[] = [];
  private readonly active = new Set<Phaser.GameObjects.Image>();

  constructor(private readonly scene: Phaser.Scene, private readonly capacity = 18) {}

  acquire(textureKey: string): Phaser.GameObjects.Image {
    const sprite = this.available.pop() || this.scene.add.image(0, 0, textureKey);
    sprite.setTexture(textureKey);
    sprite.setVisible(true);
    sprite.setActive(true);
    sprite.setAlpha(1);
    sprite.setScale(1);
    sprite.setOrigin(0.5, 0.5);
    sprite.setRotation(0);
    sprite.setFlipX(false);
    this.active.add(sprite);
    return sprite;
  }

  release(sprite: Phaser.GameObjects.Image): void {
    if (!this.active.delete(sprite)) return;
    this.scene.tweens.killTweensOf(sprite);
    sprite.setVisible(false);
    sprite.setActive(false);
    if (this.available.length < this.capacity) this.available.push(sprite);
    else sprite.destroy();
  }

  clear(): void {
    this.active.forEach((sprite) => this.release(sprite));
  }

  destroy(): void {
    this.clear();
    this.available.splice(0).forEach((sprite) => sprite.destroy());
  }
}
