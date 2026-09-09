import { WEAPONS } from '../data/love-fight-assets';
import type { QuynhAction, SpecialDefinition } from '../models/love-fight.model';
import { cooldownReady } from '../models/love-fight-rules';
import { LoveFightAudioService } from '../services/love-fight-audio.service';
import { LoveFightSessionService } from '../services/love-fight-session.service';

export interface CombatEffects {
  pose(fighter: 'quynh' | 'hung', action: string, durationMs: number): void;
  effect(textureKey: string, fighter: 'quynh' | 'hung'): void;
  hitStop(durationMs: number): void;
}

export class LoveFightCombatController {
  private quynhCooldownUntil = 0;
  private readonly hungCooldowns = new Map<string, number>();

  constructor(
    private readonly session: LoveFightSessionService,
    private readonly audio: LoveFightAudioService,
    private readonly effects: CombatEffects
  ) {}

  tryQuynhAction(action: QuynhAction, distance: number, now: number, useWeapon = false): boolean {
    if (!cooldownReady(now, this.quynhCooldownUntil) || this.session.state() !== 'playing') return false;
    const weapon = WEAPONS.find((item) => item.id === this.session.setup().weaponId) || WEAPONS[0];
    const isWeapon = useWeapon;
    const cooldown = isWeapon ? weapon?.cooldownMs || 480 : action === 'KICK' ? 280 : 190;
    const damage = isWeapon ? weapon?.courageDamage || 9 : action === 'KICK' ? 12 : 8;
    this.quynhCooldownUntil = now + cooldown;
    this.effects.pose('quynh', action, isWeapon ? 250 : action === 'KICK' ? 190 : 150);
    this.audio.play(isWeapon && this.session.setup().weaponId === 'slipper' ? 'slipper' : 'softHit');
    if (distance <= (isWeapon ? 260 : 190)) {
      this.session.damageCourage(damage);
      this.effects.hitStop(isWeapon ? 70 : 45);
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
    if (!cooldownReady(now, this.quynhCooldownUntil) || this.session.state() !== 'playing') return false;
    this.quynhCooldownUntil = now + 360;
    this.effects.pose('quynh', 'STEP', 180);
    return true;
  }

  triggerHungDefensive(action: 'DODGE' | 'RECOIL', now: number): void {
    if (this.session.state() !== 'playing') return;
    this.effects.pose('hung', action, action === 'DODGE' ? 230 : 300);
    this.session.setCombatSnapshot({ hungAction: action });
    if (action === 'RECOIL') this.effects.hitStop(40);
    void now;
  }
}
