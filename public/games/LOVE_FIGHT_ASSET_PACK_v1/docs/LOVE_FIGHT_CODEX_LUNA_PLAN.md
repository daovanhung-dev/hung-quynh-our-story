# LOVE FIGHT — CODEX LUNA IMPLEMENTATION PLAN

> **Repository:** `daovanhung-dev/hung-quynh-our-story`  
> **Route đích:** `/love-fight`  
> **Website hiện tại:** Angular standalone app, deploy GitHub Pages  
> **Game runtime đề xuất:** Phaser 4.x nhúng trong Angular  
> **Người chơi chính:** Quỳnh  
> **Mục tiêu cảm xúc:** Quỳnh dỗi → xử chồng trong game → cả hai làm lành → xem lại thật nhiều ảnh kỷ niệm.

---

# 0. NGUYÊN TẮC BẮT BUỘC CHO LUNA

1. Đọc toàn bộ repo trước khi sửa code.
2. Không phá các route hiện có: `/`, `/events`, `/museum`, `/birthday`, `/timeline`, `/memory/:id`, `/japan-notes`, `/love-treasure`, `/unsaid`.
3. Feature mới phải là standalone feature, lazy-loaded.
4. User sẽ tự đặt `public/games/sf2.zip` nếu muốn. File này chỉ là **reference tùy chọn**, game LOVE FIGHT phải chạy bình thường khi không có file đó.
5. Không copy nhân vật, sprite, UI, logo, stage, sound, code hoặc ROM data từ Street Fighter/Capcom.
6. Không binary-patch ROM trực tiếp trong browser. Nếu sau này cần ROM patch thật, phải có exact ROM set/hash và workflow offline riêng.
7. Mục tiêu là tái hiện **cảm giác game đối kháng arcade 2D cổ điển**: nhịp round, hit-stop, input buffer, jump arc, camera framing, HUD đối đầu; không phải clone proprietary frame data.
8. Không máu, không thương tích, không bạo lực thực tế. Các “vũ khí” là đồ gia dụng cartoon/chibi.
9. Không gọi thanh chỉ số là HP. Dùng:
   - Quỳnh: `Cơn Dỗi`
   - Hùng: `Độ Dỗ Dành`
10. Hùng **không đánh vật lý Quỳnh**. Hùng chỉ né, sợ, xin lỗi, tặng quà, bắn tim, gửi hoa, trà sữa, thư tình, ôm, v.v.
11. Quỳnh luôn giận/dỗi trong toàn bộ trận đấu; chỉ chuyển sang vui khi bước vào ending.
12. Hùng luôn sợ hãi/rụt rè/xin lỗi cho đến ending; không được biến thành boss tự tin/ngạo mạn.
13. Hai ending đều kết thúc hòa giải.
14. Trước khi báo DONE phải pass build Pages + test + E2E tối thiểu.

---

# 1. MỤC TIÊU SẢN PHẨM

Tên game:

**LOVE FIGHT — Dỗi nhau để yêu nhau hơn**

Thông điệp:

> “Không có ai thua. Chỉ có hai đứa làm lành.”

Trải nghiệm phải khiến Quỳnh cảm giác:

- có quyền “xử chồng” vui vẻ;
- game phản hồi nhanh như fighting game thật;
- Hùng trong game đúng tinh thần đang dỗ vợ;
- kết thúc luôn là lời xin lỗi + kỷ niệm thật của hai người.

---

# 2. USER FLOW BẮT BUỘC

```text
/events
  ↓
Card: DỖ VỢ — LOVE FIGHT
  ↓
/love-fight
  ↓
Intro
  ↓
Chọn outfit Quỳnh
  ↓
Chọn pool outfit Hùng
  ↓
Chọn số round: 1 / 3 / 5
  ↓
Chọn vũ khí Quỳnh
  ↓
Random 4 tuyệt chiêu dỗ dành cho Hùng
  ↓
VS screen
  ↓
Round intro
  ↓
Fight
  ↓
Match result
  ├─ Ending A: Hùng dỗ hết Cơn Dỗi
  └─ Ending B: Quỳnh thắng
  ↓
Reconciliation cinematic
  ↓
Photo rain bằng ảnh thật trong kho ký ức
  ↓
Gallery + CTA Timeline / Replay
```

---

# 3. GIẢI QUYẾT YÊU CẦU OUTFIT VỪA CHỌN VỪA RANDOM

Yêu cầu có hai ý tưởng hơi chồng nhau: Quỳnh chọn outfit của cả hai, nhưng outfit Hùng lại random.

Luna triển khai như sau:

## Quỳnh
- Chọn chính xác 1 outfit Q01–Q12.
- Outfit được khóa cho toàn match.

## Hùng
- Hiện đủ H01–H12.
- Quỳnh có thể chọn tối đa 3 outfit làm **pool random**.
- Mặc định không chọn gì → pool = toàn bộ 12.
- Đến VS screen mới random 1 outfit từ pool.
- Có toggle nhỏ `🔒 Khóa đúng bộ này`, mặc định OFF.

Như vậy Quỳnh vẫn “được chọn đồ cho chồng”, nhưng Hùng vẫn có yếu tố random vui.

---

# 4. STATE MACHINE

Tạo state machine riêng, không nhồi toàn bộ logic vào Angular page.

```ts
type LoveFightState =
  | 'boot'
  | 'intro'
  | 'outfit-select'
  | 'round-select'
  | 'weapon-select'
  | 'vs'
  | 'round-intro'
  | 'playing'
  | 'round-result'
  | 'match-result'
  | 'ending-a'
  | 'ending-b'
  | 'photo-rain'
  | 'gallery';
```

Mọi transition phải deterministic và test được.

---

# 5. COMBAT MODEL

## 5.1 Cơn Dỗi — Quỳnh

- Start mỗi round: `100`
- Min: `0`
- Max: `100`
- Hùng dùng tuyệt chiêu dỗ dành → giảm `anger`
- Khi `anger <= 0`: Hùng dỗ thành công → Hùng thắng round

## 5.2 Độ Dỗ Dành — Hùng

- Start mỗi round: `100`
- Quỳnh tấn công → giảm `courage`
- Khi `courage <= 0`: Hùng quỳ xin lỗi/tặng hoa → Quỳnh thắng round

## 5.3 Không dùng chữ KO

Quỳnh thắng round:

`CHỒNG XIN THUA 😭🌹`

Hùng thắng round:

`VỢ BỚT DỖI RỒI ❤️`

---

# 6. ROUND

Cho chọn:

- 1 round
- 3 rounds
- 5 rounds

Luật:

- 1 → first to 1
- 3 → first to 2
- 5 → first to 3

Timer mặc định: 60 giây.

Timeout:

- so sánh % meter đã làm giảm;
- bên đạt progress cao hơn thắng round;
- nếu bằng nhau thì ưu tiên Quỳnh để game vẫn có cảm giác “vợ luôn có quyền xử chồng”.

---

# 7. QUỲNH — MOVESET

Quỳnh do người chơi điều khiển.

Base actions:

- walk left/right
- jump
- crouch
- punch
- kick
- dodge/back-step
- weapon special

Biểu cảm:

- angry idle
- angry attack
- angry victory
- hit reaction vẫn dỗi
- chỉ happy khi ending bắt đầu

---

# 8. HÙNG — AI MOVESET

Hùng không punch/kick Quỳnh.

Allowed actions:

```text
TIMID_IDLE
RECOIL
DODGE
PLEAD
HEART_CAST
APOLOGY_CLOUD
LOVE_LETTER
MILK_TEA
CHOCOLATE
BOUQUET
HUG_AURA
RING_PROMISE
KNEEL_APOLOGY
```

AI priority:

1. Quỳnh đang đánh gần → né/recoil.
2. Courage < 25 → tăng xác suất kneel/bouquet.
3. Khoảng cách xa → heart/apology cloud/love letter.
4. Khoảng cách vừa → milk tea/chocolate/plead.
5. Anger < 30 → ưu tiên bouquet/hug/reconciliation.
6. Không dùng cùng 1 special quá 2 lần liên tiếp.

Hùng phải nhìn **sợ và đang dỗ vợ**, không được tự tin chiến đấu.

---

# 9. BALANCE GỢI Ý

## Quỳnh → giảm Độ Dỗ Dành

- light prop: 6–9
- normal prop: 9–12
- heavy prop: 12–14

## Hùng → giảm Cơn Dỗi

- apology cloud: 10
- heart projectile: 12
- chocolate: 14
- love letter: 15
- milk tea: 16
- bouquet: 18
- ring promise: 20
- hug aura: 22
- reconciliation special: 30

Cooldown lấy từ `assets.manifest.json`.

---

# 10. VŨ KHÍ QUỲNH

Có 12 item:

1. Dép huyền thoại
2. Cao gót cảnh cáo
3. Chổi yêu thương
4. Gối dỗi
5. Lược thần tốc
6. Búa bông
7. Điện thoại gọi chồng
8. Thìa cảnh cáo
9. Cán bột
10. Gấu bông
11. Túi xách
12. Quạt giấy

Tất cả hiệu ứng cartoon:

- sao
- tim
- bụi comic
- motion line

Không blood/gore.

---

# 11. TUYỆT CHIÊU DỖ DÀNH HÙNG

Pool 12:

1. Tim bay xin lỗi
2. Bó hoa hòa giải
3. Chocolate làm lành
4. Trà sữa chuộc lỗi
5. Thư xin lỗi
6. Lời hứa lấp lánh
7. Ôm thật lâu
8. Nụ hôn hòa giải
9. Xin lũi vợ...
10. Hồi phục tình yêu
11. Lấp lánh dỗ dành
12. Hai trái tim làm lành

Mỗi match random 4 special active.

Hiện 4 icon trong HUD góc Hùng để Quỳnh biết “chồng đang có bài gì để dỗ”.

---

# 12. ENDING A — HẾT DỖI

Trigger:

- Hùng thắng match; hoặc
- final round anger xuống 0.

Sequence:

1. Freeze combat 180 ms.
2. Fade HUD.
3. Quỳnh angry → `Q_ENDING_HAPPY`.
4. Hùng timid → `H_ENDING_HAPPY`.
5. Hùng tiến lại gần.
6. Heart bloom + flower petals.
7. Hai nhân vật ôm nhau.
8. Hiển thị đúng copy:

> **Vợ yêu ơi! Chồng trân thành xin lũi em! Vợ iu gọi ngay cho ck iu nhó, ck iu xin lũi vợ ạ !!!**

9. Sau 3–5 giây → Photo Rain.

---

# 13. ENDING B — QUỲNH THẮNG

Trigger:

Quỳnh đạt số round thắng cần thiết.

Sequence:

1. Hùng dùng `H_DEFEAT_BOUQUET`.
2. Hùng quỳ, không bị thương.
3. Hùng đưa bó hoa.
4. Quỳnh giữ `Q_VICTORY_ANGRY` ~1 giây.
5. Quỳnh chuyển sang `Q_ENDING_HAPPY`.
6. Nhận hoa.
7. Hai người tiến gần.
8. Kiss-sparkle / heart cover.
9. Hiển thị đúng copy:

> **Có lẽ đối khi chúng ta còn chưa hiểu nhau một chút thoi nhưng có lẽ sau cuộc cãi vã, anh vẫn bên em, anh vẫn mãi yêu em!!!**

10. Photo Rain.

Không tự sửa chính tả copy nếu user chưa yêu cầu.

---

# 14. PHOTO RAIN — DÙNG ẢNH THẬT TỪ WEBSITE

Không scan thư mục ảnh lần nữa.

Website đã có `MemoryService`, dùng trực tiếp:

```ts
memoryService.getRandomImageMedia(24)
```

cho ending.

Gallery cuối:

```ts
memoryService.getAllImageMedia()
```

Ưu tiên source:

```ts
media.thumbnailSrc || media.displaySrc || media.mediumSrc || media.src
```

Không load ảnh HEIC/original cực lớn vào animation nếu đã có thumbnail/display variant.

Photo Rain:

- desktop: 4–5 cột
- mobile: 2–3 cột
- ±7° rotation
- stagger 80–180 ms
- tối đa 8 DOM cards đang animate cùng lúc trên mobile
- reduced-motion → fade grid, không mưa ảnh

CTA cuối:

- `Hết dỗi chưa vợ iu? 🥺❤️`
- `Chơi lại và xử chồng tiếp 😤`
- `Xem chuyện của chúng mình ❤️` → `/timeline`

---

# 15. ANGULAR + PHASER ARCHITECTURE

Repo hiện chưa có game framework.

Đề xuất:

```bash
npm install phaser
```

Pin exact version vào lockfile. Không CDN.

Feature tree:

```text
src/app/features/love-fight/
├── love-fight.page.ts
├── love-fight.page.html
├── love-fight.page.scss
├── components/
│   ├── outfit-select.component.ts
│   ├── round-select.component.ts
│   ├── weapon-select.component.ts
│   ├── vs-screen.component.ts
│   ├── ending-overlay.component.ts
│   └── photo-rain.component.ts
├── engine/
│   ├── love-fight-game.ts
│   ├── love-fight-scene.ts
│   ├── combat-controller.ts
│   ├── combat-state-machine.ts
│   ├── animation-registry.ts
│   ├── hitbox-system.ts
│   ├── projectile-system.ts
│   ├── input-controller.ts
│   └── hung-ai-controller.ts
├── models/
│   ├── love-fight.model.ts
│   └── combat.model.ts
├── data/
│   ├── outfits.data.ts
│   ├── weapons.data.ts
│   └── specials.data.ts
└── services/
    ├── love-fight-session.service.ts
    └── love-fight-audio.service.ts
```

Angular quản:

- setup screens
- selections
- state shell
- ending overlay
- memory gallery
- route/navigation

Phaser quản:

- frame loop
- fighters
- physics
- collision
- hitbox
- AI
- projectiles
- combat particles

Destroy Phaser instance sạch trong `ngOnDestroy`.

---

# 16. ROUTE

Thêm trước wildcard:

```ts
{
  path: 'love-fight',
  loadComponent: () =>
    import('./features/love-fight/love-fight.page').then((m) => m.LoveFightPage)
},
```

Phải hoạt động dưới GitHub Pages base href:

`/hung-quynh-our-story/`

Không hardcode `/assets/...` kiểu root absolute gây lỗi Pages.

---

# 17. ASSET DESTINATION TRONG REPO

Copy runtime WebP/PNG vào:

```text
public/games/love-fight/
├── manifest/
├── characters/
│   ├── quynh/
│   └── hung/
├── weapons/
├── effects/
├── ui/
└── audio/
```

Raw sheet có thể để ngoài public:

```text
docs/design/love-fight/
```

Không copy ZIP asset pack vào `public/`.

---

# 18. SF2.ZIP CONTRACT

User dự kiến có:

```text
public/games/sf2.zip
```

Luna làm dev helper:

```text
scripts/check-sf2-reference.mjs
```

Script chỉ:

- check tồn tại
- size
- SHA-256
- in thông tin

Không:

- upload
- rewrite
- extract vào repo
- copy file vào release artifact
- dùng asset từ ROM

LOVE FIGHT không được phụ thuộc file này để boot.

Nếu sau này làm ROM patch thật: cần separate offline plan dựa trên exact ROM hash.

---

# 19. FIGHTER FEEL TARGET

- fixed simulation 60 Hz
- input buffer 80–120 ms
- light startup tương đương 4–6 frames
- heavy/weapon startup 7–12 frames
- hit-stop 50–90 ms cho đòn mạnh
- camera shake rất nhẹ cho heavy prop
- jump: rise nhanh, fall hơi chậm hơn
- auto-facing
- push boxes
- active hitbox window rõ ràng
- không infinite stun
- grace ≥400 ms sau recoil lớn

Mục tiêu: responsive arcade feel, không copy timing độc quyền chính xác từ game gốc.

---

# 20. CONTROL

Desktop:

```text
A / D       move
W           jump
S           crouch
J           punch/light
K           kick/heavy
L           weapon
Space       dodge/back-step
Esc         pause
```

Hùng = AI.

Mobile:

- left virtual joystick
- right: `ĐÁNH`, `ĐÁ`, `ĐỒ NGHỀ`, `NÉ`
- touch target ≥52 CSS px

Gamepad optional:

- D-pad/left stick move
- A light
- B heavy
- X weapon
- Y dodge

---

# 21. HUD

```text
[Quỳnh] CƠN DỖI ███████████     60     ███████████ ĐỘ DỖ DÀNH [Hùng]
          ♥ ♥                                   ♥ ♥
```

- Quỳnh: pink/wine
- Hùng: blue/cream
- heart = round win
- không chữ HP
- không KO

---

# 22. ASSET ANIMATION STRATEGY

Bộ asset v1 là key pose, không phải full frame animation.

MVP:

- idle: breathing tween 1–2%
- step: x tween + sprite swap
- punch: swap 100–140 ms + impulse
- kick: swap 150–200 ms
- weapon: pose + projectile/arc tween
- recoil: x push + 2–4° rotation
- plead: hold 400–700 ms
- heart cast: cast pose + effect projectile
- ending: 600–1400 ms cinematic tween

Không giả run cycle bằng cách spam các pose không liên quan.

V2 có thể thay bằng true spritesheets qua `animation-registry.ts` mà không đổi combat logic.

---

# 23. AUDIO

Asset pack có SFX placeholder nguyên bản:

- ui_select.wav
- ui_confirm.wav
- soft_hit.wav
- slipper_whoosh.wav
- heart_cast.wav
- apology_chime.wav
- bouquet_chime.wav
- ending_reconcile.wav

Audio chỉ start sau user gesture.

Mute persist:

```text
loveFight.audio.muted
```

Không dùng audio Street Fighter/Capcom.

---

# 24. PERFORMANCE

Target desktop: 60 FPS.

Mobile: ổn định 50–60 FPS.

Rules:

- runtime ưu tiên WebP
- preload selected outfit + common poses, không preload tất cả original PNG full-res
- lazy-load ending photos
- particle pool
- max ~60 particles normal
- max ~20 reduced-motion
- không chạy Angular change detection mỗi frame
- Phaser giữ combat state; Angular chỉ nhận event coarse-grained

---

# 25. ACCESSIBILITY

Honor `prefers-reduced-motion`:

- disable shake
- particle giảm ≥70%
- photo rain → fade grid
- không zoom flash nhanh

Setup screens:

- keyboard focus
- ARIA label
- visible focus ring
- contrast tốt

---

# 26. SESSION STORAGE

Match setup:

```text
loveFight.quynhOutfit
loveFight.hungOutfitPool
loveFight.rounds
loveFight.weapon
```

Preferences localStorage:

```text
loveFight.audio.muted
loveFight.lastWeapon
loveFight.lastQuynhOutfit
```

Không lưu dữ liệu riêng tư nhạy cảm.

---

# 27. TYPES TỐI THIỂU

```ts
export interface OutfitDefinition {
  id: string;
  fighter: 'quynh' | 'hung';
  name: string;
  previewSrc: string;
  battleSrc: string;
}

export interface WeaponDefinition {
  id: string;
  name: string;
  iconSrc: string;
  courageDamage: number;
  cooldownMs: number;
  action: string;
}

export interface SpecialDefinition {
  id: string;
  name: string;
  effectSrc: string;
  angerReduction: number;
  cooldownMs: number;
  aiWeight: number;
}

export interface MatchSetup {
  quynhOutfitId: string;
  hungOutfitPool: readonly string[];
  hungLockedOutfitId?: string;
  weaponId: string;
  rounds: 1 | 3 | 5;
}
```

---

# 28. HITBOX

Không dùng alpha pixel collision.

```ts
interface FighterBoxes {
  push: Rect;
  hurt: Rect[];
  attacks: Partial<Record<string, TimedHitbox[]>>;
}
```

MVP normalized pushbox:

```text
x: 30%–70% sprite width
y: 15%–95% sprite height
```

Tune trực tiếp sau khi load sprite.

---

# 29. HÙNG AI PSEUDOCODE

```ts
function decideHungAction(ctx: AiContext): HungAction {
  if (ctx.incomingAttack && ctx.distance < 180) {
    return Math.random() < 0.7 ? 'dodge' : 'recoil';
  }

  if (ctx.courage <= 25 && ctx.canUse('bouquet')) {
    return 'bouquet';
  }

  if (ctx.anger <= 25 && ctx.canUse('hug_aura')) {
    return 'hug_aura';
  }

  if (ctx.distance > 330) {
    return weighted(['heart_projectile', 'apology_cloud', 'love_letter']);
  }

  if (ctx.distance > 160) {
    return weighted(['milk_tea', 'chocolate_box', 'plead']);
  }

  return weighted(['dodge', 'plead', 'bouquet']);
}
```

---

# 30. EVENT HUB CARD

Thêm card mới trong `/events`:

**Title:**

`Dỗ Vợ — LOVE FIGHT`

**Subtitle:**

`Vợ đang dỗi? Vào đây xử chồng một trận rồi mình làm lành ❤️`

**CTA:**

`Xử chồng ngay 😤`

Route:

`/love-fight`

---

# 31. TEST PLAN

## Unit

- state transitions
- 1/3/5 round threshold
- meter clamp
- cooldown
- Hùng AI không bao giờ trả physical punch/kick
- Ending A condition
- Ending B condition
- asset IDs unique

## Component

- 12 Quỳnh outfit cards
- 12 Hùng outfit cards
- 12 weapons
- Hùng pool mặc định = all
- round selector persist
- keyboard navigation

## E2E Playwright

1. open `/love-fight`
2. choose Q outfit
3. choose H pool
4. choose 1 round
5. choose slipper
6. start match
7. dev-hook force anger = 0
8. assert Ending A exact copy
9. replay
10. force Quỳnh victory
11. assert Ending B exact copy
12. assert photo gallery renders images
13. timeline CTA works

---

# 32. DEV DEBUG HOOK

Development only:

```ts
window.__LOVE_FIGHT_DEBUG__ = {
  setAnger(n),
  setCourage(n),
  forceEndingA(),
  forceEndingB(),
  skipToFight(),
};
```

Không expose production.

---

# 33. ACCEPTANCE CRITERIA

## Setup

- [ ] 12 outfit Quỳnh
- [ ] 12 outfit Hùng
- [ ] Hùng random outfit pool
- [ ] 1/3/5 round
- [ ] 12 weapons
- [ ] random 4 Hùng specials

## Character behavior

- [ ] Quỳnh luôn dỗi trước ending
- [ ] Hùng luôn sợ/rụt rè/xin lỗi trước ending
- [ ] Hùng không đánh vật lý
- [ ] attack VFX cartoon/non-graphic

## Gameplay

- [ ] responsive desktop
- [ ] mobile touch
- [ ] meter/round/timer
- [ ] pause/mute
- [ ] không infinite stun

## Ending A

- [ ] Quỳnh happy
- [ ] Hùng happy/relieved
- [ ] exact apology copy
- [ ] photo rain

## Ending B

- [ ] Hùng quỳ + hoa
- [ ] Quỳnh nhận hoa
- [ ] kiss/heart reconciliation
- [ ] exact love copy
- [ ] photo rain

## Build

- [ ] existing routes không hỏng
- [ ] `npm test` pass
- [ ] Playwright pass
- [ ] `npm run build:pages` pass
- [ ] direct Pages route `/love-fight` pass

---

# 34. CODING ORDER BẮT BUỘC

## Phase 1 — Plumbing

1. install Phaser
2. route
3. blank LoveFight page
4. runtime asset manifest
5. build Pages smoke test

## Phase 2 — Setup UX

1. outfit Quỳnh
2. Hùng outfit pool
3. round
4. weapon
5. VS
6. session state

## Phase 3 — Combat MVP

1. canvas
2. fighter positions/facing
3. move/jump
4. Quỳnh punch/kick
5. Hùng dodge/recoil
6. meters
7. round result

## Phase 4 — Items & AI

1. weapon system
2. Hùng special deck
3. AI
4. cooldown
5. hit-stop/VFX

## Phase 5 — Endings

1. Ending A
2. Ending B
3. exact copy
4. ending SFX

## Phase 6 — Memory payoff

1. inject MemoryService
2. photo rain
3. gallery
4. timeline CTA

## Phase 7 — Polish

1. mobile controls
2. gamepad
3. reduced motion
4. accessibility
5. performance
6. sound

## Phase 8 — Test & Deploy

1. unit
2. component
3. E2E
4. Pages build
5. artifact verify
6. worklog

---

# 35. WORKLOG CUỐI CÙNG CỦA LUNA

Luna phải xuất:

```text
LOVE FIGHT IMPLEMENTATION REPORT
- Branch / commit
- Files added
- Files modified
- Package changes
- Route added
- Assets copied
- States implemented
- Quỳnh actions
- Hùng AI specials
- Ending A PASS/FAIL
- Ending B PASS/FAIL
- Photo gallery PASS/FAIL
- Desktop PASS/FAIL
- Mobile PASS/FAIL
- npm test PASS/FAIL
- npm run build:pages PASS/FAIL
- Playwright PASS/FAIL
- Known limitations
```

Không được ghi DONE nếu ending hoặc Pages build còn lỗi.

---

# 36. LIKENESS PASS

Asset v1 đi kèm là **generic chibi prototype**, không phải chân dung được xác minh của Hùng/Quỳnh.

Để tạo likeness thật, user cần đưa ảnh tham chiếu rõ của Hùng và Quỳnh trực tiếp trong chat hiện tại. Sau đó regenerate:

- face/hair identity sheet
- outfit dựa trên quần áo thật trong ảnh
- action pose giữ đúng cùng identity

Không tự thực hiện biometric identification từ repo media.

---

# 37. DEFINITION OF DONE

Feature chỉ được coi là hoàn thiện khi Quỳnh có thể mở link GitHub Pages trên điện thoại, chọn đồ/round/vũ khí, chơi một trận đối kháng chibi responsive với Hùng AI luôn sợ và dỗ vợ, đạt một trong hai ending hòa giải, đọc lời xin lỗi/tình yêu, rồi thấy thật nhiều ảnh kỷ niệm của hai người mà không cần công cụ developer.
