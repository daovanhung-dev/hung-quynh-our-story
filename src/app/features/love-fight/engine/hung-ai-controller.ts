import type { SpecialDefinition } from '../models/love-fight.model';

export type HungAiDecision =
  | { readonly kind: 'dodge' }
  | { readonly kind: 'recoil' }
  | { readonly kind: 'plead' }
  | { readonly kind: 'special'; readonly special: SpecialDefinition };

export interface HungAiContext {
  readonly incomingAttack: boolean;
  readonly distance: number;
  readonly courage: number;
  readonly anger: number;
  readonly activeSpecials: readonly SpecialDefinition[];
  readonly canUse: (special: SpecialDefinition) => boolean;
  readonly random?: () => number;
}

const weightedPick = (items: readonly SpecialDefinition[], random: () => number): SpecialDefinition | undefined => {
  const total = items.reduce((sum, item) => sum + item.aiWeight, 0);
  if (!total) return undefined;
  let cursor = random() * total;
  for (const item of items) {
    cursor -= item.aiWeight;
    if (cursor <= 0) return item;
  }
  return items.at(-1);
};

export function decideHungAction(context: HungAiContext): HungAiDecision {
  const random = context.random || Math.random;
  const usable = context.activeSpecials.filter(context.canUse);

  if (context.incomingAttack && context.distance < 180) {
    return random() < 0.7 ? { kind: 'dodge' } : { kind: 'recoil' };
  }

  const bouquet = usable.find((item) => item.id === 'bouquet');
  if (context.courage <= 25 && bouquet) return { kind: 'special', special: bouquet };

  const hug = usable.find((item) => item.id === 'hug_aura');
  if (context.anger <= 25 && hug) return { kind: 'special', special: hug };

  if (context.distance > 330) {
    const special = weightedPick(usable.filter((item) => ['heart_projectile', 'apology_cloud', 'love_letter'].includes(item.id)), random);
    if (special) return { kind: 'special', special };
  }

  if (context.distance > 160) {
    const special = weightedPick(usable.filter((item) => ['milk_tea', 'chocolate_box', 'plead'].includes(item.id)), random);
    if (special) return { kind: 'special', special };
  }

  const nearby = weightedPick(usable.filter((item) => ['bouquet', 'apology_cloud'].includes(item.id)), random);
  return nearby ? { kind: 'special', special: nearby } : (random() < 0.5 ? { kind: 'dodge' } : { kind: 'plead' });
}
