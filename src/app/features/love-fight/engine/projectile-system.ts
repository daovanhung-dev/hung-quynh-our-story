export interface ProjectileHost {
  addEffect(textureKey: string, x: number, y: number, direction: number): void;
}

export class LoveFightProjectileSystem {
  constructor(private readonly host: ProjectileHost) {}

  launch(textureKey: string, startX: number, startY: number, direction: number): void {
    this.host.addEffect(textureKey, startX + direction * 24, startY - 142, direction);
  }
}
