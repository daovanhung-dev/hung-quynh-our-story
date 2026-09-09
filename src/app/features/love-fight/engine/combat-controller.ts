import { WEAPONS } from '../data/love-fight-assets';
import type { QuynhAction, SpecialDefinition } from '../models/love-fight.model';
import { cooldownReady } from '../models/love-fight-rules';
import { isHitboxActive, type TimedHitbox } from './hitbox-system';
import { LoveFightAudioService } from '../services/love-fight-audio.service';
import { LoveFightSessionService } from '../services/love-fight-session.service';

export interface CombatEffects {
  pose(fighter: 'quynh' | 'hung', action: string, durationMs: number): void;
  effect(textureKey: string, fighter: 'quynh' | 'hung'): void;
  hitStop(durationMs: number): void;
  /** Re-check the hurtbox at the exact active frame, after movement/defense has resolved. */
  targetDistance?(): number;
  /** Presentation callback fired only when an attack really connects. */
  hitConfirm?(action: QuynhAction, finisher: boolean): void;
}

export class LoveFightCombatController {
  private quynhCooldownUntil = 0;
  private quynhDodgeCooldownUntil = 0;
  private readonly hungCooldowns = new Map<string, number>();
  private lastQuynhActionAccepted = false;
  private hungInvulnerableUntil = 0;
  private pendingHit: {
    readonly startedAtMs: number;
    readonly hitbox: TimedHitbox;
    readonly maxDistance: number;
    readonly action: QuynhAction;
    readonly finisher: boolean;
    readonly hitStopMs: number;
  } | null = null;

  constructor(
    private readonly session: LoveFightSessionService,
    private readonly audio: LoveFightAudioService,
    private readonly effects: CombatEffects
  ) {}

  tryQuynhAction(action: QuynhAction, distance: number, now: number, useWeapon = false, finisher = false): boolean {
    this.lastQuynhActionAccepted = false;
    if (!this.isQuynhReady(now) || this.session.state() !== 'playing') return false;
    const weapon = WEAPONS.find((item) => item.id === this.session.setup().weaponId) || WEAPONS[0];
    const isWeapon = useWeapon;
    const cooldown = isWeapon ? weapon?.cooldownMs || 480 : action === 'KICK' ? 280 : 190;
    const damage = isWeapon ? weapon?.courageDamage || 9 : action === 'KICK' ? 12 : 8;
    this.quynhCooldownUntil = now + cooldown;
    this.lastQuynhActionAccepted = true;
    this.effects.pose('quynh', action, isWeapon ? 250 : action === 'KICK' ? 190 : 150);
    this.audio.play(isWeapon && this.session.setup().weaponId === 'slipper' ? 'slipper' : 'softHit');
    const maxDistance = isWeapon ? 260 : 190;
    if (distance <= maxDistance) {
      const activeFromMs = isWeapon ? 120 : action === 'KICK' ? 100 : 70;
      const activeToMs = isWeapon ? 260 : action === 'KICK' ? 210 : 150;
      this.pendingHit = {
        startedAtMs: now,
        hitbox: { activeFromMs, activeToMs, damage, box: { x: 0, y: 0, width: 1, height: 1 } },
        maxDistance,
        action,
        finisher,
        hitStopMs: finisher ? 70 : isWeapon ? 55 : action === 'KICK' ? 52 : 45
      };
      return true;
    }
    return false;
  }

  tryHungSpecial(special: SpecialDefinition, now: number): boolean {
    const availableAt = this.hungCooldowns.get(special.id) || 0;
    if (!cooldownReady(now, availableAt) || this.session.state() !== 'playing') return false;
    this.hungCooldowns.set(special.id, now + special.cooldownMs);
    this.effects.pose('hung', special.action, 520);
    this.effects.effect(`effect-${special.id}`, 'hung');
    this.session.reduceAnger(special.angerReduction);
    this.audio.play(special.id === 'bouquet' ? 'bouquet' : special.id === 'heart_projectile' ? 'heart' : 'apology');
    this.effects.hitStop(35);
    return true;
  }

  triggerDodge(now: number): boolean {
    if (!cooldownReady(now, this.quynhDodgeCooldownUntil) || this.session.state() !== 'playing') return false;
    this.quynhDodgeCooldownUntil = now + 220;
    this.effects.pose('quynh', 'STEP', 180);
    return true;
  }

  isQuynhReady(now: number): boolean {
    return cooldownReady(now, this.quynhCooldownUntil);
  }

  wasQuynhActionAccepted(): boolean {
    return this.lastQuynhActionAccepted;
  }

  update(now: number): void {
    const pending = this.pendingHit;
    if (!pending) return;
    const age = now - pending.startedAtMs;
    if (isHitboxActive(pending.hitbox, age)) {
      this.pendingHit = null;
      const stillInRange = !this.effects.targetDistance || this.effects.targetDistance() <= pending.maxDistance;
      if (!stillInRange || now < this.hungInvulnerableUntil) return;
      this.session.damageCourage(pending.hitbox.damage);
      this.effects.hitConfirm?.(pending.action, pending.finisher);
      this.effects.hitStop(pending.hitStopMs);
    } else if (age >= pending.hitbox.activeToMs) {
      this.pendingHit = null;
    }
  }

  triggerHungDefensive(action: 'DODGE' | 'RECOIL', now: number): void {
    if (this.session.state() !== 'playing') return;
    this.effects.pose('hung', action, action === 'DODGE' ? 230 : 300);
    this.session.setCombatSnapshot({ hungAction: action });
    if (action === 'DODGE') this.hungInvulnerableUntil = Math.max(this.hungInvulnerableUntil, now + 120);
    if (action === 'RECOIL') this.effects.hitStop(40);
  }
}
