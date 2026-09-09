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
import { advanceCombo, createComboState, comboExpired, type ComboState } from './combo-rules';
import { cameraZoomFor, followCameraX, clampCameraX } from './camera-rules';
import { createMotionState, DEFAULT_MOTION_CONFIG, isDashReady, stepMotion, interpolate, type MotionState } from './motion-rules';
import { LoveFightSpritePool, LoveFightVfxPool } from './vfx-pool';

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const WORLD_WIDTH = 1280;
const GROUND_Y = 452;
const FIXED_STEP_MS = 1000 / 60;
const FIGHTER_SCALE = 0.67;
const STAGE_MIN_X = 92;
const STAGE_MAX_X = WORLD_WIDTH - 92;
type QuynhAttack = 'PUNCH' | 'KICK' | 'SLIPPER_THROW' | 'BROOM_SWING' | 'PILLOW_SMASH';
interface PendingQuynhAttack {
  readonly action: QuynhAttack;
  readonly distance: number;
  readonly durationMs: number;
  readonly nextCombo: ComboState;
  readonly useWeapon: boolean;
  readonly feedback: string;
  readonly expiresAtMs: number;
}

export class LoveFightScene extends Phaser.Scene implements CombatEffects, ProjectileHost {
  private readonly session: LoveFightSessionService;
  private readonly audio: LoveFightAudioService;
  private qSprite!: Phaser.GameObjects.Image;
  private hSprite!: Phaser.GameObjects.Image;
  private inputController!: LoveFightInputController;
  private combat!: LoveFightCombatController;
  private projectiles!: LoveFightProjectileSystem;
  private vfxPool!: LoveFightVfxPool;
  private spritePool!: LoveFightSpritePool;
  private camera!: Phaser.Cameras.Scene2D.Camera;
  private qMotion: MotionState = createMotionState(270, 0, 1);
  private qPreviousX = 270;
  private hX = 690;
  private hPreviousX = 690;
  private hVelocityX = 0;
  private accumulator = 0;
  private simulationMs = 0;
  private elapsedMs = 0;
  private lastHudUpdateMs = 0;
  private lastAiMs = 0;
  private hitStopUntilMs = 0;
  private lastRound = 1;
  private qAttackUntilMs = 0;
  private qAttackStartedMs = 0;
  private qLandingUntilMs = 0;
  private hSquashUntilMs = 0;
  private hPoseBob = 0;
  private hungDefensiveCooldownUntilMs = 0;
  private hungSpecialHistory: string[] = [];
  private readonly poseUntil = new Map<'quynh' | 'hung', number>();
  private randomSeed = 0x1f123bb5;
  private combo: ComboState = createComboState();
  private pendingQuynhAttacks: PendingQuynhAttack[] = [];
  private cameraX = 0;
  private cameraZoom = 1;
  private readonly reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(session: LoveFightSessionService, audio: LoveFightAudioService) {
    super({ key: 'LoveFightScene' });
    this.session = session;
    this.audio = audio;
  }

  preload(): void {
    const setup = this.session.setup();
    const quynh = setup.quynhOutfitId;
    const hung = this.session.selectedHungOutfitId();
    this.load.image('q-outfit', `games/love-fight/characters/quynh/${quynh}.webp`);
    this.load.image('h-outfit', `games/love-fight/characters/hung/${hung}.webp`);
    loadQuynhActionTextures(this.load);
    loadHungActionTextures(this.load);
    SPECIALS.forEach((special) => this.load.image(`effect-${special.id}`, special.effectSrc));
  }

  create(): void {
    this.camera = this.cameras.main;
    this.camera.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.drawBackdrop();
    this.vfxPool = new LoveFightVfxPool(this, 32);
    this.spritePool = new LoveFightSpritePool(this, 22);
    this.qSprite = this.add.image(this.qMotion.x, GROUND_Y, 'q-outfit').setOrigin(0.5, 1).setScale(FIGHTER_SCALE).setDepth(10);
    this.hSprite = this.add.image(this.hX, GROUND_Y, 'h-outfit').setOrigin(0.5, 1).setScale(FIGHTER_SCALE).setDepth(10);
    this.inputController = new LoveFightInputController(this);
    this.projectiles = new LoveFightProjectileSystem(this);
    this.combat = new LoveFightCombatController(this.session, this.audio, this);
    this.session.setEngineReady(true);
    this.updateFacing();
    this.publishSnapshot();
  }

  override update(_time: number, delta: number): void {
    if (!this.combat || !this.inputController) return;
    this.inputController.update();
    if (this.inputController.consume('pause')) this.session.togglePause();

    if (this.session.roundNumber() !== this.lastRound) {
      this.lastRound = this.session.roundNumber();
      this.resetPositions();
    }
    if (this.session.state() === 'playing' && !this.session.paused()) {
      // Phaser versions expose the frame delta in milliseconds; tolerate a seconds-based
      // adapter as well so the simulation never silently slows to a crawl.
      const frameDeltaMs = delta > 0 && delta < 1 ? delta * 1000 : delta;
      this.accumulator += Math.min(frameDeltaMs, 120);
      while (this.accumulator >= FIXED_STEP_MS) {
        this.accumulator -= FIXED_STEP_MS;
        if (this.simulationMs >= this.hitStopUntilMs) this.fixedStep();
        this.simulationMs += FIXED_STEP_MS;
      }
    }
    this.renderMotion(this.accumulator / FIXED_STEP_MS);
    this.updateCamera();
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
    const x = fighter === 'quynh' ? this.qMotion.x : this.hX;
    this.projectiles.launch(textureKey, x, GROUND_Y + (fighter === 'quynh' ? this.qMotion.y : 0), fighter === 'quynh' ? 1 : -1);
  }

  hitStop(durationMs: number): void {
    this.hitStopUntilMs = Math.max(this.hitStopUntilMs, this.simulationMs + durationMs);
  }

  targetDistance(): number {
    return Math.abs(this.hX - this.qMotion.x);
  }

  hitConfirm(action: string, finisher: boolean): void {
    this.spawnHitSpark((this.qMotion.x + this.hX) / 2, GROUND_Y - (finisher ? 175 : 150));
    if (finisher) this.spawnSpeedLines((this.qMotion.x + this.hX) / 2, GROUND_Y - 180, this.qMotion.facing);
    this.cameraKick(finisher);
    this.session.announceFeedback(finisher ? 'FINISHER HIT!' : `${action === 'PUNCH' ? 'LIGHT' : action} HIT!`, 'good', finisher ? 1000 : 700);
  }

  addEffect(textureKey: string, x: number, y: number, direction: number): void {
    if (!this.textures.exists(textureKey) || !this.spritePool) return;
    const sprite = this.spritePool.acquire(textureKey);
    sprite.setPosition(x, y - 20);
    sprite.setDepth(16);
    sprite.setAlpha(0);
    sprite.setScale(0.52);
    sprite.setFlipX(direction < 0);
    this.tweens.add({
      targets: sprite,
      x: x + direction * 135,
      y: y - 58,
      alpha: 1,
      scale: 0.72,
      duration: this.reducedMotion ? 120 : 260,
      ease: 'Cubic.easeOut',
      yoyo: true,
      hold: this.reducedMotion ? 0 : 100,
      onComplete: () => this.spritePool.release(sprite)
    });
  }

  shutdown(): void {
    this.session.setEngineReady(false);
    this.inputController?.destroy();
    this.vfxPool?.destroy();
    this.spritePool?.destroy();
    this.poseUntil.clear();
  }

  private fixedStep(): void {
    this.elapsedMs += FIXED_STEP_MS;
    this.qPreviousX = this.qMotion.x;
    this.hPreviousX = this.hX;
    this.updateQuynhMovement();
    this.updatePoseRestoration();
    this.resolvePushBoxes();
    this.flushPendingQuynhAttack();
    this.handleQuynhActions();
    this.combat.update(this.simulationMs);
    this.updateQuynhActionPhase();
    this.updateHungAi();
    this.resolvePushBoxes();
    this.updateFacing();

    if (comboExpired(this.combo, this.simulationMs)) {
      this.combo = createComboState();
      this.session.setCombatSnapshot({ comboCount: 0 });
    }
    if (this.elapsedMs - this.lastHudUpdateMs >= 80) {
      this.lastHudUpdateMs = this.elapsedMs;
      this.session.setTimer(60 - this.elapsedMs / 1000);
      this.publishSnapshot();
      if (this.session.timerSec() <= 0) this.session.resolveTimeout();
    }
  }

  private updateQuynhMovement(): void {
    const horizontal = (this.inputController.isDown('right') ? 1 : 0) - (this.inputController.isDown('left') ? 1 : 0);
    const direction = (horizontal || (this.qMotion.x < this.hX ? 1 : -1)) as -1 | 1;
    const result = stepMotion(this.qMotion, {
      horizontal: Math.max(-1, Math.min(1, horizontal)) as -1 | 0 | 1,
      crouching: this.inputController.isDown('crouch'),
      jumpPressed: this.inputController.consume('jump'),
      dashPressed: this.inputController.consume('dodge'),
      dashDirection: direction
    }, FIXED_STEP_MS, this.simulationMs, { ...DEFAULT_MOTION_CONFIG, minX: STAGE_MIN_X, maxX: STAGE_MAX_X });
    this.qMotion = result.state;

    if (result.events.jumped) {
      this.spawnDust(this.qMotion.x, GROUND_Y + 2, 0xf8d1d8);
      this.pose('quynh', 'STEP', 120);
    }
    if (result.events.landed) {
      this.qLandingUntilMs = this.simulationMs + 150;
      this.spawnDust(this.qMotion.x, GROUND_Y + 2, 0xffc1cf);
    }
    if (result.events.dashed) {
      this.combat.triggerDodge(this.simulationMs);
      this.spawnDashTrail();
      const towardHung = this.qMotion.facing === (this.hX >= this.qPreviousX ? 1 : -1);
      this.session.announceFeedback(towardHung && Math.abs(this.hX - this.qPreviousX) <= 230 ? 'NÉ ĐẸP!' : 'DASH!', 'good', 500);
      this.session.setCombatSnapshot({ isDashing: true });
    }
    if (horizontal && this.qMotion.grounded && !this.poseUntil.has('quynh')) this.pose('quynh', 'STEP', 105);
  }

  private handleQuynhActions(): void {
    const distance = Math.abs(this.hX - this.qMotion.x);
    if (this.inputController.consume('light')) {
      const result = advanceCombo(this.combo, 'light', this.simulationMs);
      if (result.action !== 'rejected') this.combo = result.state;
      this.submitQuynhAction('PUNCH', distance, 170, result.state, result.action === 'light-2' ? 'LIGHT 2' : 'LIGHT 1');
    }
    if (this.inputController.consume('heavy')) {
      const result = advanceCombo(this.combo, 'heavy', this.simulationMs);
      if (result.action !== 'rejected') this.combo = result.state;
      this.submitQuynhAction('KICK', distance, result.action === 'heavy-finisher' ? 320 : 230, result.action === 'heavy-finisher' ? result.state : this.combo, result.action === 'heavy-finisher' ? 'FINISHER' : 'HEAVY');
    }
    if (this.inputController.consume('weapon')) {
      const result = advanceCombo(this.combo, 'weapon', this.simulationMs);
      if (result.action !== 'rejected') this.combo = result.state;
      const weapon = this.session.setup().weaponId;
      const action = ({
        slipper: 'SLIPPER_THROW', high_heel: 'PUNCH', broom: 'BROOM_SWING', pillow: 'PILLOW_SMASH',
        hairbrush: 'PUNCH', plush_hammer: 'KICK', phone: 'PUNCH', spoon: 'PUNCH', rolling_pin: 'KICK',
        teddy_bear: 'PILLOW_SMASH', handbag: 'BROOM_SWING', paper_fan: 'SLIPPER_THROW'
      } as Record<string, 'SLIPPER_THROW' | 'BROOM_SWING' | 'PILLOW_SMASH' | 'PUNCH' | 'KICK'>)[weapon] || 'SLIPPER_THROW';
      this.submitQuynhAction(action, distance, 330, result.action === 'weapon-chain' ? result.state : this.combo, result.action === 'weapon-chain' ? 'WEAPON CHAIN' : 'WEAPON', true);
    }
  }

  private submitQuynhAction(action: QuynhAttack, distance: number, durationMs: number, nextCombo: ComboState, feedback: string, useWeapon = false): void {
    if (!this.combat.isQuynhReady(this.simulationMs)) {
      // Keep the command inside the combo window while the previous animation recovers.
      this.pendingQuynhAttacks.push({ action, distance, durationMs, nextCombo, useWeapon, feedback, expiresAtMs: this.simulationMs + 420 });
      return;
    }
    if (this.executeQuynhAction(action, distance, durationMs, nextCombo, useWeapon)) {
      if (feedback !== 'HEAVY' && feedback !== 'WEAPON') this.showCombo(nextCombo.count, feedback);
      this.session.announceFeedback(feedback === 'FINISHER' ? 'FINISHER!' : feedback, feedback === 'FINISHER' ? 'good' : 'neutral', 650);
    }
  }

  private executeQuynhAction(action: QuynhAttack, distance: number, durationMs: number, nextCombo: ComboState, useWeapon = false): boolean {
    const hit = this.combat.tryQuynhAction(action, distance, this.simulationMs, useWeapon, nextCombo.count >= 3);
    if (!this.combat.wasQuynhActionAccepted()) return false;
    this.combo = nextCombo;
    this.qAttackUntilMs = this.simulationMs + durationMs;
    this.qAttackStartedMs = this.simulationMs;
    this.qMotion = { ...this.qMotion, actionPhase: 'anticipation' };
    this.spawnAttackArc(action, distance);
    void hit;
    return true;
  }

  private flushPendingQuynhAttack(): void {
    while (this.pendingQuynhAttacks.length && this.simulationMs > (this.pendingQuynhAttacks[0]?.expiresAtMs || 0)) this.pendingQuynhAttacks.shift();
    const pending = this.pendingQuynhAttacks[0];
    if (!pending) return;
    if (!this.combat.isQuynhReady(this.simulationMs)) return;
    this.pendingQuynhAttacks.shift();
    if (this.executeQuynhAction(pending.action, pending.distance, pending.durationMs, pending.nextCombo, pending.useWeapon) && pending.feedback !== 'HEAVY' && pending.feedback !== 'WEAPON') {
      this.showCombo(pending.nextCombo.count, pending.feedback);
      this.session.announceFeedback(pending.feedback === 'FINISHER' ? 'FINISHER!' : pending.feedback, pending.feedback === 'FINISHER' ? 'good' : 'neutral', 650);
    }
  }

  private updateHungAi(): void {
    const distance = Math.abs(this.hX - this.qMotion.x);
    const towardQuynh = this.hX > this.qMotion.x ? -1 : 1;
    const retreat = this.hX > this.qMotion.x ? 1 : -1;
    const desiredDirection = distance < 240 ? retreat : distance > 380 ? towardQuynh : 0;
    const targetVelocity = desiredDirection * 128;
    const acceleration = desiredDirection ? 7.2 : 10;
    this.hVelocityX += (targetVelocity - this.hVelocityX) * Math.min(1, acceleration * (FIXED_STEP_MS / 1000));
    this.hX = Phaser.Math.Clamp(this.hX + this.hVelocityX * (FIXED_STEP_MS / 1000), STAGE_MIN_X, STAGE_MAX_X);
    if (Math.abs(this.hVelocityX) > 18 && !this.poseUntil.has('hung')) this.hPoseBob += FIXED_STEP_MS;

    if (this.simulationMs - this.lastAiMs < 180) return;
    this.lastAiMs = this.simulationMs;
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
        this.spawnHeartBurst(this.hX, GROUND_Y - 210, decision.special.id === 'bouquet' ? 0xffd18c : 0xff8fab);
        this.session.announceFeedback(`HÙNG: ${decision.special.name}`, 'good', 700);
      }
    } else if (decision.kind === 'dodge' && this.simulationMs >= this.hungDefensiveCooldownUntilMs) {
      this.combat.triggerHungDefensive('DODGE', this.simulationMs);
      this.hungDefensiveCooldownUntilMs = this.simulationMs + 280;
      this.hX = Phaser.Math.Clamp(this.hX + retreat * 58, STAGE_MIN_X, STAGE_MAX_X);
      this.spawnDashTrail(true);
      this.session.announceFeedback('HÙNG NÉ!', 'warning', 600);
    } else if (decision.kind === 'recoil') {
      this.combat.triggerHungDefensive('RECOIL', this.simulationMs);
      this.hX = Phaser.Math.Clamp(this.hX + retreat * 28, STAGE_MIN_X, STAGE_MAX_X);
      this.hSquashUntilMs = this.simulationMs + 180;
      this.spawnDust(this.hX, GROUND_Y + 2, 0xc7e6f5);
    } else if (!this.poseUntil.has('hung')) {
      this.pose('hung', 'PLEAD', 500);
    }
  }

  private updateQuynhActionPhase(): void {
    if (this.qMotion.actionPhase === 'idle') return;
    const age = this.simulationMs - this.qAttackStartedMs;
    if (age >= this.qAttackUntilMs - this.qAttackStartedMs) {
      this.qMotion = { ...this.qMotion, actionPhase: 'idle' };
    } else if (age < 45) {
      this.qMotion = { ...this.qMotion, actionPhase: 'anticipation' };
    } else if (age < (this.qAttackUntilMs - this.qAttackStartedMs) * 0.65) {
      this.qMotion = { ...this.qMotion, actionPhase: 'active' };
    } else {
      this.qMotion = { ...this.qMotion, actionPhase: 'recovery' };
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
    const qBox = normalizedFighterBoxes(this.qMotion.x, GROUND_Y).push;
    const hBox = normalizedFighterBoxes(this.hX, GROUND_Y).push;
    if (!rectanglesOverlap(qBox, hBox)) return;
    const midpoint = (this.qMotion.x + this.hX) / 2;
    if (this.qMotion.x <= this.hX) {
      this.qMotion = { ...this.qMotion, x: Phaser.Math.Clamp(midpoint - 39, STAGE_MIN_X, STAGE_MAX_X) };
      this.hX = Phaser.Math.Clamp(midpoint + 39, STAGE_MIN_X, STAGE_MAX_X);
    } else {
      this.qMotion = { ...this.qMotion, x: Phaser.Math.Clamp(midpoint + 39, STAGE_MIN_X, STAGE_MAX_X) };
      this.hX = Phaser.Math.Clamp(midpoint - 39, STAGE_MIN_X, STAGE_MAX_X);
    }
  }

  private updateFacing(): void {
    this.qSprite.setFlipX(this.qMotion.x > this.hX);
    this.hSprite.setFlipX(this.hX < this.qMotion.x);
  }

  private renderMotion(alpha: number): void {
    const qX = interpolate(this.qPreviousX, this.qMotion.x, alpha);
    const hX = interpolate(this.hPreviousX, this.hX, alpha);
    const qBob = this.qMotion.grounded && Math.abs(this.qMotion.velocityX) > 15 && !this.qMotion.crouching ? Math.sin(this.simulationMs / 55) * 3 : 0;
    const qBase = this.qMotion.crouching ? FIGHTER_SCALE * 0.84 : FIGHTER_SCALE;
    const landing = this.qLandingUntilMs > this.simulationMs ? 1 + Math.sin((this.qLandingUntilMs - this.simulationMs) / 150 * Math.PI) * 0.1 : 1;
    const recoil = this.hSquashUntilMs > this.simulationMs ? 1.1 : 1;
    if (!this.poseUntil.has('quynh')) this.qSprite.setScale(qBase * landing, qBase * (2 - landing));
    this.hSprite.setScale(FIGHTER_SCALE * recoil, FIGHTER_SCALE * (2 - recoil));
    this.qSprite.setPosition(qX, GROUND_Y + this.qMotion.y + qBob);
    this.hSprite.setPosition(hX, GROUND_Y + (Math.abs(this.hVelocityX) > 18 ? Math.sin(this.hPoseBob / 55) * 2 : 0));
    this.qSprite.setRotation(this.qMotion.dashing ? this.qMotion.facing * 0.08 : 0);
    this.hSprite.setRotation(0);
  }

  private updateCamera(): void {
    if (!this.camera) return;
    this.cameraX = clampCameraX(followCameraX(this.cameraX, this.qMotion.x, this.hX));
    this.cameraZoom = cameraZoomFor(Math.abs(this.hX - this.qMotion.x), this.combo.count);
    this.camera.scrollX = this.cameraX;
    this.camera.setZoom(this.cameraZoom);
    if (this.session.state() === 'playing' && this.elapsedMs - this.lastHudUpdateMs < 20) {
      this.session.setCombatSnapshot({ cameraX: this.cameraX, cameraZoom: this.cameraZoom });
    }
  }

  private publishSnapshot(): void {
    this.session.setCombatSnapshot({
      quynhX: this.qMotion.x,
      hungX: this.hX,
      velocityX: this.qMotion.velocityX,
      velocityY: this.qMotion.velocityY,
      isGrounded: this.qMotion.grounded,
      isCrouching: this.qMotion.crouching,
      isDashing: this.qMotion.dashing,
      comboCount: this.combo.count,
      dashReady: isDashReady(this.qMotion, this.simulationMs),
      cameraX: this.cameraX,
      cameraZoom: this.cameraZoom
    });
  }

  private showCombo(count: number, label: string): void {
    this.session.setCombatSnapshot({ comboCount: count });
    this.spawnText(`${count} HIT  ·  ${label}`, this.qMotion.x, GROUND_Y - 290, 0xffe4a4);
  }

  private spawnText(text: string, x: number, y: number, color: number): void {
    const label = this.add.text(x, y, text, { color: `#${color.toString(16).padStart(6, '0')}`, fontFamily: 'Arial', fontSize: '16px', fontStyle: 'bold', stroke: '#24131f', strokeThickness: 4 }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: label, y: y - 28, alpha: 0, duration: this.reducedMotion ? 180 : 520, ease: 'Cubic.easeOut', onComplete: () => label.destroy() });
  }

  private spawnDust(x: number, y: number, color: number): void {
    const graphics = this.vfxPool.acquire();
    graphics.setPosition(x, y).setDepth(8);
    graphics.fillStyle(color, 0.72);
    graphics.fillCircle(-18, 0, 7);
    graphics.fillCircle(0, -3, 10);
    graphics.fillCircle(20, 0, 6);
    this.tweens.add({ targets: graphics, x: x + 12, y: y - 13, alpha: 0, scale: 1.45, duration: this.reducedMotion ? 120 : 320, onComplete: () => this.vfxPool.release(graphics) });
  }

  private spawnDashTrail(hung = false): void {
    const x = hung ? this.hX : this.qMotion.x;
    const direction = hung ? (this.hX > this.qMotion.x ? 1 : -1) : this.qMotion.facing;
    const texture = hung ? 'h-outfit' : 'q-outfit';
    for (let index = 0; index < (this.reducedMotion ? 1 : 3); index += 1) {
      const sprite = this.spritePool.acquire(texture);
      sprite.setOrigin(0.5, 1).setPosition(x - direction * index * 24, GROUND_Y).setScale(FIGHTER_SCALE).setFlipX(hung ? this.hX < this.qMotion.x : this.qMotion.x > this.hX).setAlpha(0.22 - index * 0.045).setDepth(7);
      this.tweens.add({ targets: sprite, x: x - direction * (index * 24 + 30), alpha: 0, duration: 140 + index * 30, onComplete: () => this.spritePool.release(sprite) });
    }
    this.spawnSpeedLines(x, GROUND_Y - 130, direction);
  }

  private spawnSpeedLines(x: number, y: number, direction: number): void {
    const graphics = this.vfxPool.acquire();
    graphics.setPosition(x, y).setDepth(9);
    graphics.lineStyle(3, 0xfff2dc, 0.65);
    graphics.lineBetween(0, -30, direction * 70, -30);
    graphics.lineBetween(0, 0, direction * 92, 0);
    graphics.lineBetween(0, 25, direction * 60, 25);
    this.tweens.add({ targets: graphics, x: x + direction * 34, alpha: 0, duration: this.reducedMotion ? 100 : 230, onComplete: () => this.vfxPool.release(graphics) });
  }

  private spawnAttackArc(action: string, distance: number): void {
    const graphics = this.vfxPool.acquire();
    const direction = this.qMotion.x <= this.hX ? 1 : -1;
    graphics.setPosition(this.qMotion.x + direction * Math.min(85, Math.max(42, distance * 0.2)), GROUND_Y - 158).setDepth(18).setAlpha(0).setScale(0.72);
    graphics.lineStyle(action === 'KICK' ? 7 : 4, action === 'KICK' ? 0xffd38a : 0xfff4df, 0.85);
    graphics.arc(0, 0, action === 'KICK' ? 68 : 52, direction > 0 ? 210 : 330, direction > 0 ? 330 : 510, false);
    this.tweens.add({ targets: graphics, scale: 1.25, alpha: 1, delay: this.reducedMotion ? 0 : 42, duration: this.reducedMotion ? 70 : 90, yoyo: true, hold: this.reducedMotion ? 0 : 28, onComplete: () => this.vfxPool.release(graphics) });
  }

  private spawnHitSpark(x: number, y: number): void {
    const graphics = this.vfxPool.acquire();
    graphics.setPosition(x, y).setDepth(32);
    graphics.lineStyle(4, 0xfff1ba, 1);
    for (let index = 0; index < 8; index += 1) {
      const angle = index * Math.PI / 4;
      graphics.lineBetween(Math.cos(angle) * 10, Math.sin(angle) * 10, Math.cos(angle) * 34, Math.sin(angle) * 34);
    }
    this.tweens.add({ targets: graphics, scale: 1.35, alpha: 0, duration: this.reducedMotion ? 90 : 180, onComplete: () => this.vfxPool.release(graphics) });
  }

  private spawnHeartBurst(x: number, y: number, color: number): void {
    const graphics = this.vfxPool.acquire();
    graphics.setPosition(x, y).setDepth(25);
    graphics.fillStyle(color, 0.92);
    graphics.fillCircle(-22, 0, 7);
    graphics.fillCircle(0, -16, 9);
    graphics.fillCircle(22, 0, 6);
    graphics.fillStyle(0xffffff, 0.65);
    graphics.fillCircle(0, 4, 4);
    this.tweens.add({ targets: graphics, y: y - 48, scale: 1.45, alpha: 0, duration: this.reducedMotion ? 180 : 480, onComplete: () => this.vfxPool.release(graphics) });
  }

  private cameraKick(finisher: boolean): void {
    if (this.reducedMotion || !this.camera) return;
    this.camera.shake(finisher ? 80 : 55, finisher ? 0.006 : 0.003);
  }

  private resetPositions(): void {
    this.qMotion = createMotionState(270, 0, 1);
    this.qPreviousX = 270;
    this.hX = 690;
    this.hPreviousX = 690;
    this.hVelocityX = 0;
    this.elapsedMs = 0;
    this.simulationMs = 0;
    this.lastAiMs = 0;
    this.lastHudUpdateMs = 0;
    this.hitStopUntilMs = 0;
    this.qLandingUntilMs = 0;
    this.qAttackStartedMs = 0;
    this.hSquashUntilMs = 0;
    this.hungDefensiveCooldownUntilMs = 0;
    this.hungSpecialHistory = [];
    this.combo = createComboState();
    this.pendingQuynhAttacks = [];
    this.cameraX = 0;
    this.cameraZoom = 1;
    this.qSprite.setPosition(this.qMotion.x, GROUND_Y).setTexture('q-outfit').setScale(FIGHTER_SCALE);
    this.hSprite.setPosition(this.hX, GROUND_Y).setTexture('h-outfit').setScale(FIGHTER_SCALE);
    this.publishSnapshot();
  }

  private drawBackdrop(): void {
    const width = WORLD_WIDTH + GAME_WIDTH;
    const sky = this.add.graphics().setDepth(-10);
    sky.fillGradientStyle(0x24131f, 0x24131f, 0x0e1826, 0x0e1826, 1);
    sky.fillRect(0, 0, width, GAME_HEIGHT);

    const clouds = this.add.graphics().setScrollFactor(0.12).setDepth(-9);
    clouds.fillStyle(0xf4b7c6, 0.12);
    clouds.fillCircle(240, 104, 58);
    clouds.fillCircle(300, 112, 40);
    clouds.fillCircle(980, 76, 44);
    clouds.fillCircle(1030, 84, 30);

    const farBuildings = this.add.graphics().setScrollFactor(0.28).setDepth(-8);
    farBuildings.fillStyle(0x3c2033, 0.7);
    farBuildings.fillRect(0, 292, width, 160);
    for (let index = 0; index < 28; index += 1) {
      const x = index * 82;
      const height = 34 + ((index * 31) % 92);
      farBuildings.fillRect(x, 292 - height, 58, height);
      farBuildings.fillStyle(0xeeb2c0, 0.22);
      farBuildings.fillRect(x + 12, 304 - height, 5, 9);
      farBuildings.fillRect(x + 28, 304 - height, 5, 9);
      farBuildings.fillStyle(0x3c2033, 0.7);
    }

    const city = this.add.graphics().setScrollFactor(0.62).setDepth(-7);
    city.fillStyle(0x140c17, 0.96);
    city.fillRect(0, 330, width, 122);
    for (let index = 0; index < 24; index += 1) {
      const x = index * 62;
      const height = 26 + ((index * 31) % 74);
      city.fillRect(x, 330 - height, 42, height);
      city.fillStyle(0xeeb2c0, 0.3);
      for (let window = 0; window < 3; window += 1) city.fillRect(x + 8 + window * 11, 340 - height, 4, 7);
      city.fillStyle(0x140c17, 0.96);
    }

    const foreground = this.add.graphics().setDepth(-6);
    foreground.fillStyle(0x7f3b4b, 0.65);
    foreground.fillRect(0, GROUND_Y + 2, width, 4);
    foreground.fillStyle(0xf9d7de, 0.13);
    foreground.fillRect(0, GROUND_Y + 6, width, GAME_HEIGHT - GROUND_Y - 6);
    foreground.lineStyle(1, 0xffffff, 0.08);
    for (let index = 0; index < 15; index += 1) foreground.lineBetween(index * 110, GROUND_Y + 6, index * 110 + 65, GAME_HEIGHT);
  }

  private random(): number {
    this.randomSeed = (1664525 * this.randomSeed + 1013904223) >>> 0;
    return this.randomSeed / 0x100000000;
  }
}
