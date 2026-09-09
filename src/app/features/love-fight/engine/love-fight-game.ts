import * as Phaser from 'phaser';
import type { LoveFightInput } from './input-controller';
import { LoveFightScene } from './love-fight-scene';
import { LoveFightAudioService } from '../services/love-fight-audio.service';
import { LoveFightSessionService } from '../services/love-fight-session.service';

export class LoveFightGame {
  private game: Phaser.Game | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly session: LoveFightSessionService,
    private readonly audio: LoveFightAudioService
  ) {}

  start(): void {
    if (this.game) return;
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: this.host,
      width: 960,
      height: 540,
      backgroundColor: '#24131f',
      render: { antialias: true, pixelArt: false },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 540
      },
      scene: [new LoveFightScene(this.session, this.audio)]
    });
  }

  queueInput(action: LoveFightInput): void {
    const scene = this.game?.scene.getScene('LoveFightScene') as LoveFightScene | undefined;
    scene?.queueInput(action);
  }

  setVirtualInput(action: LoveFightInput, active: boolean): void {
    const scene = this.game?.scene.getScene('LoveFightScene') as LoveFightScene | undefined;
    scene?.setVirtualInput(action, active);
  }

  destroy(): void {
    this.game?.destroy(true);
    this.game = null;
  }
}
