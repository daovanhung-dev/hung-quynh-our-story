import type { OutfitDefinition, SpecialDefinition, WeaponDefinition } from '../models/love-fight.model';

const root = 'games/love-fight';
const character = (fighter: 'quynh' | 'hung', file: string): string => `${root}/characters/${fighter}/${file}`;
const weapon = (file: string): string => `${root}/weapons/${file}`;
const effect = (file: string): string => `${root}/effects/${file}`;

const quynhOutfitNames = [
  'Đồ ngủ thỏ', 'Hoodie hồng', 'Váy hẹn hò', 'Váy đen', 'Sporty', 'Blouse & skirt',
  'Cardigan ấm', 'School style', 'Pajama hồng', 'Coat & scarf', 'Váy hoa', 'Semi-formal hồng'
] as const;

const hungOutfitNames = [
  'Áo thun jeans', 'Sơ mi xanh', 'Sinh viên', 'Hoodie xám', 'Homewear gấu', 'Sweater',
  'Date semi-formal', 'Polo', 'Sporty', 'Jacket xanh', 'Pajama xanh', 'Suit + hoa'
] as const;

export const QUYNH_OUTFITS: readonly OutfitDefinition[] = quynhOutfitNames.map((name, index) => {
  const id = `Q${String(index + 1).padStart(2, '0')}`;
  return {
    id,
    fighter: 'quynh',
    name,
    previewSrc: character('quynh', `${id}.webp`),
    battleSrc: character('quynh', `${id}.webp`)
  };
});

export const HUNG_OUTFITS: readonly OutfitDefinition[] = hungOutfitNames.map((name, index) => {
  const id = `H${String(index + 1).padStart(2, '0')}`;
  return {
    id,
    fighter: 'hung',
    name,
    previewSrc: character('hung', `${id}.webp`),
    battleSrc: character('hung', `${id}.webp`)
  };
});

export const WEAPONS: readonly WeaponDefinition[] = [
  ['slipper', 'Dép huyền thoại', 9, 420, 'SLIPPER_THROW'],
  ['high_heel', 'Cao gót cảnh cáo', 12, 500, 'PUNCH'],
  ['broom', 'Chổi yêu thương', 11, 550, 'BROOM_SWING'],
  ['pillow', 'Gối dỗi', 8, 480, 'PILLOW_SMASH'],
  ['hairbrush', 'Lược thần tốc', 7, 350, 'PUNCH'],
  ['plush_hammer', 'Búa bông', 13, 600, 'KICK'],
  ['phone', 'Điện thoại gọi chồng', 6, 300, 'PUNCH'],
  ['spoon', 'Thìa cảnh cáo', 7, 340, 'PUNCH'],
  ['rolling_pin', 'Cán bột', 12, 580, 'KICK'],
  ['teddy_bear', 'Gấu bông', 8, 450, 'PILLOW_SMASH'],
  ['handbag', 'Túi xách', 10, 500, 'BROOM_SWING'],
  ['paper_fan', 'Quạt giấy', 9, 380, 'SLIPPER_THROW']
].map(([id, name, courageDamage, cooldownMs, action]) => ({
  id: id as string,
  name: name as string,
  iconSrc: weapon(`${id as string}.webp`),
  courageDamage: courageDamage as number,
  cooldownMs: cooldownMs as number,
  action: action as string
}));

const specialDefinitions: readonly [string, string, string, string, number, number, number][] = [
  ['heart_projectile', 'Tim bay xin lỗi', 'HEART_CAST', 'heart_projectile.webp', 12, 1400, 5],
  ['bouquet', 'Bó hoa hòa giải', 'BOUQUET', 'bouquet.webp', 18, 3800, 3],
  ['chocolate_box', 'Chocolate làm lành', 'CHOCOLATE', 'chocolate_box.webp', 14, 3000, 4],
  ['milk_tea', 'Trà sữa chuộc lỗi', 'HEART_CAST', 'milk_tea.webp', 16, 3200, 4],
  ['love_letter', 'Thư xin lỗi', 'PLEAD', 'love_letter.webp', 15, 3000, 3],
  ['ring_box', 'Lời hứa lấp lánh', 'PLEAD', 'ring_box.webp', 20, 5500, 2],
  ['hug_aura', 'Ôm thật lâu', 'PLEAD', 'hug_aura.webp', 22, 5000, 2],
  ['kiss_sparkle', 'Nụ hôn hòa giải', 'HEART_CAST', 'kiss_sparkle.webp', 24, 6000, 2],
  ['apology_cloud', 'Xin lũi vợ...', 'PLEAD', 'apology_cloud.webp', 10, 2000, 5],
  ['healing_burst', 'Hồi phục tình yêu', 'HEART_CAST', 'healing_burst.webp', 17, 4000, 3],
  ['shining_stars', 'Lấp lánh dỗ dành', 'HEART_CAST', 'shining_stars.webp', 13, 2800, 4],
  ['reconciled_double_heart', 'Hai trái tim làm lành', 'ENDING_HAPPY', 'reconciled_double_heart.webp', 30, 8000, 1]
];

export const SPECIALS: readonly SpecialDefinition[] = specialDefinitions.map(([id, name, action, file, angerReduction, cooldownMs, aiWeight]) => ({
  id,
  name,
  action,
  effectSrc: effect(file),
  angerReduction,
  cooldownMs,
  aiWeight
}));

export const QUYNH_ACTION_SOURCES = {
  IDLE_ANGRY: character('quynh', 'Q_IDLE_ANGRY.webp'),
  STEP: character('quynh', 'Q_STEP.webp'),
  PUNCH: character('quynh', 'Q_PUNCH.webp'),
  KICK: character('quynh', 'Q_KICK.webp'),
  SLIPPER_THROW: character('quynh', 'Q_SLIPPER_THROW.webp'),
  BROOM_SWING: character('quynh', 'Q_BROOM_SWING.webp'),
  PILLOW_SMASH: character('quynh', 'Q_PILLOW_SMASH.webp'),
  HIT: character('quynh', 'Q_HIT.webp'),
  VICTORY_ANGRY: character('quynh', 'Q_VICTORY_ANGRY.webp'),
  ENDING_HAPPY: character('quynh', 'Q_ENDING_HAPPY.webp')
} as const;

export const HUNG_ACTION_SOURCES = {
  TIMID_IDLE: character('hung', 'H_IDLE_TIMID.webp'),
  RECOIL: character('hung', 'H_RECOIL.webp'),
  DODGE: character('hung', 'H_DODGE.webp'),
  PLEAD: character('hung', 'H_PLEAD.webp'),
  HEART_CAST: character('hung', 'H_HEART_CAST.webp'),
  BOUQUET: character('hung', 'H_BOUQUET.webp'),
  CHOCOLATE: character('hung', 'H_CHOCOLATE.webp'),
  KNEEL_APOLOGY: character('hung', 'H_KNEEL_APOLOGY.webp'),
  DEFEAT_BOUQUET: character('hung', 'H_DEFEAT_BOUQUET.webp'),
  ENDING_HAPPY: character('hung', 'H_ENDING_HAPPY.webp')
} as const;

export const ALL_HUNG_OUTFIT_IDS = HUNG_OUTFITS.map((outfit) => outfit.id);

export const LOVE_FIGHT_AUDIO = {
  select: `${root}/audio/ui_select.wav`,
  confirm: `${root}/audio/ui_confirm.wav`,
  softHit: `${root}/audio/soft_hit.wav`,
  slipper: `${root}/audio/slipper_whoosh.wav`,
  heart: `${root}/audio/heart_cast.wav`,
  apology: `${root}/audio/apology_chime.wav`,
  bouquet: `${root}/audio/bouquet_chime.wav`,
  ending: `${root}/audio/ending_reconcile.wav`
} as const;
