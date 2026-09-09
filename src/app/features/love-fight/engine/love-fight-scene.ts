import * as Phaser from 'phaser';
import { SPECIALS } from '../data/love-fight-assets';
import { LoveFightCombatController, type CombatEffects } from './combat-controller';
import { loadHungActionTextures, loadQuynhActionTextures, actionTextureKey } from './animation-registry';
import { LoveFightInputController, type LoveFightInput } from './input-controller';
import { normalizedFighterBoxes, rectanglesOverlap } from './hitbox-system';
import { decideHungAction } from './hung-ai-controller';
import { LoveFightProjectileSystem, type ProjectileHost } from './projectile-system';
import { LoveFightAudioService } from '../services/love-fight-audio.service';
import { LoveFightSessionService } from '../services/love-fight-session.service';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const GROUND_Y = 452;
const FIXED_STEP_MS = 1000 / 60;
const FIGHTER_SCALE = 0.67;

export class LoveFightScene extends Phaser.Scene implements CombatEffects, ProjectileHost {
  private readonly session: LoveFightSessionService;
  private readonly audio: LoveFightAudioService;
  private qSprite!: Phaser.GameObjects.Image;
  private hSprite!: Phaser.GameObjects.Image;
  private inputController!: LoveFightInputController;
  private combat!: LoveFightCombatController;
  private projectiles!: LoveFightProjectileSystem;
  private qX = 270;
  private hX = 690;
  private qY = 0;
  private qVelocityY = 0;
  private accumulator = 0;
  private simulationMs = 0;
  private elapsedMs = 0;
  private lastHudUpdateMs = 0;
  private lastAiMs = 0;
  private hitStopUntilMs = 0;
  private lastRound = 1;
  private qAttackUntilMs = 0;
  private hungSpecialHistory: string[] = [];
  private readonly poseUntil = new Map<'quynh' | 'hung', number>();
  private randomSeed = 0x1f123bb5;

  constructor(session: LoveFightSessionService, audio: LoveFightAudioService) {
    super({ key: 'LoveFightScene' });
    this.session = session;
    this.audio = audio;
  }

  preload(): void {
    const setup = this.session.setup();
    const quynh = setup.quynhOutfitId;
    const hung = this.session.selectedHungOutfitId();
    const quynhSrc = `games/love-fight/characters/quynh/${quynh}.webp`;
    const hungSrc = `games/love-fight/characters/hung/${hung}.webp`;
    this.load.image('q-outfit', quynhSrc);
    this.load.image('h-outfit', hungSrc);
    loadQuynhActionTextures(this.load);
    loadHungActionTextures(this.load);
    SPECIALS.forEach((special) => this.load.image(`effect-${special.id}`, special.effectSrc));
  }

  create(): void {
    this.drawBackdrop();
    this.qSprite = this.add.image(this.qX, GROUND_Y, 'q-outfit').setOrigin(0.5, 1).setScale(FIGHTER_SCALE);
    this.hSprite = this.add.image(this.hX, GROUND_Y, 'h-outfit').setOrigin(0.5, 1).setScale(FIGHTER_SCALE);
    this.inputController = new LoveFightInputController(this);
    this.projectiles = new LoveFightProjectileSystem(this);
    this.combat = new LoveFightCombatController(this.session, this.audio, this);
    this.updateFacing();
  }

  override update(_time: number, delta: number): void {
    if (!this.combat || !this.inputController) return;
    this.inputController.update();
    if (this.inputController.consume('pause')) this.session.togglePause();

    if (this.session.roundNumber() !== this.lastRound) {
      this.lastRound = this.session.roundNumber();
      this.resetPositions();
    }
    if (this.session.state() !== 'playing' || this.session.paused()) return;

    this.accumulator += Math.min(delta, 120);
    while (this.accumulator >= FIXED_STEP_MS) {
      this.accumulator -= FIXED_STEP_MS;
      if (this.simulationMs >= this.hitStopUntilMs) this.fixedStep();
      this.simulationMs += FIXED_STEP_MS;
    }
  }

  queueInput(action: LoveFightInput): void {
    this.inputController?.queue(action);
  }

  setVirtualInput(action: LoveFightInput, active: boolean): void {
    this.inputController?.setVirtual(action, active);
  }

  pose(fighter: 'quynh' | 'hung', action: string, durationMs: number): void {
    const sprite = fighter === 'quynh' ? this.qSprite : this.hSprite;
    const prefix = fighter === 'quynh' ? 'q' : 'h';
    const key = actionTextureKey(prefix, action);
    if (this.textures.exists(key)) {
      sprite.setTexture(key);
      sprite.setScale(FIGHTER_SCALE);
    }
    this.poseUntil.set(fighter, this.simulationMs + durationMs);
    this.session.setCombatSnapshot(fighter === 'quynh' ? { quynhAction: action } : { hungAction: action });
  }

  effect(textureKey: string, fighter: 'quynh' | 'hung'): void {
    this.projectiles.launch(textureKey, fighter === 'quynh' ? this.qX : this.hX, GROUND_Y, fighter === 'quynh' ? 1 : -1);
  }

  hitStop(durationMs: number): void {
    this.hitStopUntilMs = Math.max(this.hitStopUntilMs, this.simulationMs + durationMs);
  }

  addEffect(textureKey: string, x: number, y: number, direction: number): void {
    if (!this.textures.exists(textureKey)) return;
    const sprite = this.add.image(x, y - 130, textureKey).setAlpha(0).setScale(0.52).setFlipX(direction < 0);
    this.tweens.add({
      targets: sprite,
      x: x + direction * 135,
      y: y - 168,
      alpha: 1,
      duration: 260,
      ease: 'Cubic.easeOut',
      yoyo: true,
      hold: 100,
      onComplete: () => sprite.destroy()
    });
  }

  private fixedStep(): void {
    this.elapsedMs += FIXED_STEP_MS;
    this.inputController.update();
    this.updateQuynhMovement();
    this.updatePoseRestoration();
    this.resolvePushBoxes();
    this.handleQuynhActions();
    this.updateHungAi();
    this.updateFacing();

    if (this.elapsedMs - this.lastHudUpdateMs >= 100) {
      this.lastHudUpdateMs = this.elapsedMs;
      this.session.setTimer(60 - this.elapsedMs / 1000);
      this.session.setCombatSnapshot({ quynhX: this.qX, hungX: this.hX });
      if (this.session.timerSec() <= 0) this.session.resolveTimeout();
    }
  }

  private updateQuynhMovement(): void {
    const direction = (this.inputController.isDown('right') ? 1 : 0) - (this.inputController.isDown('left') ? 1 : 0);
    const crouching = this.inputController.isDown('crouch') && this.qY === 0;
    if (crouching && !this.poseUntil.has('quynh')) this.qSprite.setScale(FIGHTER_SCALE * 0.86);
    else if (!this.poseUntil.has('quynh')) this.qSprite.setScale(FIGHTER_SCALE);
    if (direction) {
      this.qX = Phaser.Math.Clamp(this.qX + direction * 4.6, 90, 870);
      this.pose('quynh', 'STEP', 120);
    }
    if (this.inputController.consume('jump') && this.qY === 0) this.qVelocityY = -13.5;
    if (this.qY !== 0 || this.qVelocityY !== 0) {
      this.qY += this.qVelocityY;
      this.qVelocityY += 0.68;
      if (this.qY >= 0) {
        this.qY = 0;
        this.qVelocityY = 0;
      }
      this.qSprite.y = GROUND_Y + this.qY;
    }
  }

  private handleQuynhActions(): void {
    const distance = Math.abs(this.hX - this.qX);
    if (this.inputController.consume('light')) {
      if (this.combat.tryQuynhAction('PUNCH', distance, this.simulationMs)) this.qAttackUntilMs = this.simulationMs + 220;
    }
    if (this.inputController.consume('heavy')) {
      if (this.combat.tryQuynhAction('KICK', distance, this.simulationMs)) this.qAttackUntilMs = this.simulationMs + 280;
    }
    if (this.inputController.consume('weapon')) {
      const weapon = this.session.setup().weaponId;
      const action = ({
        slipper: 'SLIPPER_THROW', high_heel: 'PUNCH', broom: 'BROOM_SWING', pillow: 'PILLOW_SMASH',
        hairbrush: 'PUNCH', plush_hammer: 'KICK', phone: 'PUNCH', spoon: 'PUNCH', rolling_pin: 'KICK',
        teddy_bear: 'PILLOW_SMASH', handbag: 'BROOM_SWING', paper_fan: 'SLIPPER_THROW'
      } as Record<string, 'SLIPPER_THROW' | 'BROOM_SWING' | 'PILLOW_SMASH' | 'PUNCH' | 'KICK'>)[weapon] || 'SLIPPER_THROW';
      if (this.combat.tryQuynhAction(action, distance, this.simulationMs, true)) this.qAttackUntilMs = this.simulationMs + 320;
    }
    if (this.inputController.consume('dodge')) {
      this.combat.triggerDodge(this.simulationMs);
      this.qX = Phaser.Math.Clamp(this.qX - (this.qX < this.hX ? 58 : -58), 90, 870);
    }
  }

  private updateHungAi(): void {
    if (this.simulationMs - this.lastAiMs < 650) return;
    this.lastAiMs = this.simulationMs;
    const distance = Math.abs(this.hX - this.qX);
    const decision = decideHungAction({
      incomingAttack: this.simulationMs < this.qAttackUntilMs,
      distance,
      courage: this.session.courage(),
      anger: this.session.anger(),
      activeSpecials: this.session.activeSpecials().filter((special) => this.hungSpecialHistory.filter((id) => id === special.id).length < 2),
      canUse: () => true,
      random: () => this.random()
    });
    if (decision.kind === 'special') {
      if (this.combat.tryHungSpecial(decision.special, this.simulationMs)) {
        this.hungSpecialHistory = [...this.hungSpecialHistory, decision.special.id].slice(-4);
      }
    } else if (decision.kind === 'dodge') {
      this.combat.triggerHungDefensive('DODGE', this.simulationMs);
      this.hX = Phaser.Math.Clamp(this.hX + (this.hX > this.qX ? 58 : -58), 90, 870);
    } else if (decision.kind === 'recoil') {
      this.combat.triggerHungDefensive('RECOIL', this.simulationMs);
      this.hX = Phaser.Math.Clamp(this.hX + (this.hX > this.qX ? 28 : -28), 90, 870);
    } else {
      this.pose('hung', 'PLEAD', 500);
    }
  }

  private updatePoseRestoration(): void {
    (['quynh', 'hung'] as const).forEach((fighter) => {
      const until = this.poseUntil.get(fighter);
      if (!until || this.simulationMs < until) return;
      const sprite = fighter === 'quynh' ? this.qSprite : this.hSprite;
      sprite.setTexture(fighter === 'quynh' ? 'q-outfit' : 'h-outfit').setScale(FIGHTER_SCALE);
      this.poseUntil.delete(fighter);
      this.session.setCombatSnapshot(fighter === 'quynh' ? { quynhAction: 'IDLE_ANGRY' } : { hungAction: 'TIMID_IDLE' });
    });
  }

  private resolvePushBoxes(): void {
    const qBox = normalizedFighterBoxes(this.qX, GROUND_Y).push;
    const hBox = normalizedFighterBoxes(this.hX, GROUND_Y).push;
    if (!rectanglesOverlap(qBox, hBox)) return;
    const midpoint = (this.qX + this.hX) / 2;
    this.qX = midpoint - 38;
    this.hX = midpoint + 38;
  }

  private updateFacing(): void {
    this.qSprite.setFlipX(this.qX > this.hX);
    this.hSprite.setFlipX(this.hX < this.qX);
  }

  private resetPositions(): void {
    this.qX = 270;
    this.hX = 690;
    this.qY = 0;
    this.qVelocityY = 0;
    this.elapsedMs = 0;
    this.lastAiMs = 0;
    this.hitStopUntilMs = 0;
    this.hungSpecialHistory = [];
    this.qSprite.setPosition(this.qX, GROUND_Y).setTexture('q-outfit').setScale(FIGHTER_SCALE);
    this.hSprite.setPosition(this.hX, GROUND_Y).setTexture('h-outfit').setScale(FIGHTER_SCALE);
  }

  private drawBackdrop(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x24131f, 0x24131f, 0x0e1826, 0x0e1826, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    graphics.fillStyle(0xf4b7c6, 0.16);
    graphics.fillCircle(760, 94, 58);
    graphics.fillStyle(0x140c17, 1);
    graphics.fillRect(0, 330, GAME_WIDTH, 122);
    for (let index = 0; index < 18; index += 1) {
      const x = index * 62;
      const height = 26 + ((index * 31) % 74);
      graphics.fillRect(x, 330 - height, 42, height);
      graphics.fillStyle(0xeeb2c0, 0.3);
      for (let window = 0; window < 3; window += 1) graphics.fillRect(x + 8 + window * 11, 340 - height, 4, 7);
      graphics.fillStyle(0x140c17, 1);
    }
    graphics.fillStyle(0x7f3b4b, 0.65);
    graphics.fillRect(0, GROUND_Y + 2, GAME_WIDTH, 4);
    graphics.fillStyle(0xf9d7de, 0.13);
    graphics.fillRect(0, GROUND_Y + 6, GAME_WIDTH, GAME_HEIGHT - GROUND_Y - 6);
    graphics.lineStyle(1, 0xffffff, 0.08);
    for (let index = 0; index < 10; index += 1) graphics.lineBetween(index * 110, GROUND_Y + 6, index * 110 + 65, GAME_HEIGHT);
  }

  private random(): number {
    this.randomSeed = (1664525 * this.randomSeed + 1013904223) >>> 0;
    return this.randomSeed / 0x100000000;
  }
}
