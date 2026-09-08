
# IMPLEMENTATION PLAN — HINT #3: “NHỮNG ĐIỀU ANH CHƯA NÓI”

> Dự án: `daovanhung-dev/hung-quynh-our-story`
> Mục tiêu thực thi: GPT-5.6 Luna có thể đọc file này và triển khai tuần tự, không cần tự suy đoán kiến trúc.
> Phạm vi: thêm Easter egg thứ 3 vào Birthday Letter bằng tương tác gấp thư thành trái tim origami, sau đó mở hidden view `/unsaid`.

---

# 1. MỤC TIÊU CUỐI CÙNG

Triển khai Hint #3 theo flow:

```text
Birthday
   ↓
Celebration
   ↓
Gift
   ↓
Envelope
   ↓
Letter
   │
   ├── Normal flow
   │      ↓
   │   Timeline
   │
   └── Secret interaction
          ↓
      Gấp lá thư
      thành trái tim
          ↓
        /unsaid
          ↓
  “Những điều anh chưa nói”
```

Hai hint cũ phải giữ nguyên:

```text
Hint #1:
Hold “Bỏ qua” 3 giây
→ /japan-notes

Hint #2:
Hold “Mở lá thư” 3 giây
→ /love-treasure
```

Hint #3 tuyệt đối không dùng lại cơ chế long-press 3 giây.

---

# 2. NGUYÊN TẮC BẮT BUỘC

## 2.1. Không phá normal flow

Nếu người dùng không phát hiện Hint #3 thì website phải hoạt động giống hệt hiện tại:

```text
Letter
→ “Đi cùng anh nhé”
→ /timeline
```

Không thay text.
Không thay hành vi.
Không thay route.
Không làm chậm flow chính.

## 2.2. Không thay đổi 2 hint cũ

Không sửa behavior của:

```text
BirthdayCelebrationComponent
GiftRevealComponent
/japan-notes
/love-treasure
```

trừ khi thật sự bắt buộc cho compile/test, nhưng mặc định không được động vào.

## 2.3. Không thêm backend

Không Supabase.
Không API.
Không database.
Không local server.
Không package animation ngoài.

Chỉ dùng:

```text
Angular
TypeScript
CSS/SCSS
Pointer Events
IntersectionObserver
Angular Router
Signals
```

## 2.4. Không sửa generated memory

Tuyệt đối không sửa:

```text
src/app/generated/memories.generated.ts
```

---

# 3. FILE ĐƯỢC PHÉP SỬA / TẠO

## 3.1. File sửa

```text
src/app/app.routes.ts

src/app/features/birthday/birthday-experience.component.ts

e2e/our-story.spec.ts
```

Có thể sửa thêm:

```text
src/styles.scss
```

chỉ nếu cần style dùng chung thực sự.

## 3.2. File mới

```text
src/app/features/birthday/components/
└── letter-origami-hint/
    └── letter-origami-hint.component.ts

src/app/features/unsaid/
└── unsaid.page.ts

src/app/core/content/
└── unsaid.content.ts
```

Tùy nhu cầu có thể tách thêm:

```text
src/app/features/unsaid/
├── unsaid.page.ts
└── components/
    └── folded-note.component.ts
```

Nhưng chỉ tách khi code page quá lớn.

---

# 4. SOURCE PHẢI ĐỌC TRƯỚC KHI CODE

Luna phải đọc tối thiểu:

```text
src/app/features/birthday/birthday-experience.component.ts
src/app/app.routes.ts
src/app/app.component.ts
src/app/core/constants/birthday.config.ts
e2e/our-story.spec.ts
src/styles.scss
```

Sau đó xác nhận:

```text
1. Letter đang render trực tiếp trong BirthdayExperienceComponent.
2. .love-letter đang tồn tại.
3. Normal flow dùng goToTimeline().
4. /birthday?stage=letter đang hoạt động.
5. Hidden routes /japan-notes và /love-treasure đã tồn tại.
6. App nav không lộ hidden route.
7. E2E hiện có kiểm normal flow và hidden hold.
8. prefers-reduced-motion đã được dùng ở các feature khác.
```

Không bắt đầu refactor trước khi xác nhận các điểm trên.

---

# 5. KIẾN TRÚC HINT #3

Không nhét gesture logic trực tiếp vào:

```text
birthday-experience.component.ts
```

Tách thành:

```text
LetterOrigamiHintComponent
```

Parent chỉ chịu trách nhiệm:

```text
Letter
↓
render hint component
↓
nhận activeChange
↓
nhận completed
↓
navigate /unsaid
```

Component hint chịu trách nhiệm:

```text
detect cuối thư
gesture
fold state
origami overlay
keyboard
escape
reduced motion
emit complete
```

---

# 6. CONTENT CHO /UNSAID

Tạo:

```text
src/app/core/content/unsaid.content.ts
```

## 6.1. Interface

```ts
export interface UnsaidNote {
  readonly id: string;
  readonly text: string;
}
```

## 6.2. Data

```ts
export const UNSAID_NOTES: readonly UnsaidNote[] = [
  {
    id: 'late-night-messages',
    text: 'Có những lúc em ngủ rồi, anh vẫn đọc lại tin nhắn của em thêm một chút.'
  },
  {
    id: 'you-are-okay',
    text: 'Có những ngày anh rất mệt, nhưng chỉ cần biết em ổn là lòng anh nhẹ đi một chút.'
  },
  {
    id: 'ordinary-days',
    text: 'Anh thích cả những ngày mình chẳng làm gì đặc biệt, vì có em thì ngày bình thường cũng đáng nhớ.'
  },
  {
    id: 'future-plans',
    text: 'Anh đã bắt đầu đặt em vào những kế hoạch mà trước đây chỉ có một mình anh.'
  },
  {
    id: 'understand-you',
    text: 'Anh biết mình không phải lúc nào cũng hiểu em đúng ngay lần đầu.'
  },
  {
    id: 'love-better',
    text: 'Nhưng anh muốn luôn là người chịu học cách yêu em tốt hơn.'
  },
  {
    id: 'hard-days',
    text: 'Sau này có thể mình còn giận nhau, mệt mỏi, bận rộn và ở rất xa nhau.'
  },
  {
    id: 'choose-you',
    text: 'Nhưng nếu được chọn lại, anh vẫn muốn bước về phía em.'
  }
] as const;
```

## 6.3. Final copy

```ts
export const UNSAID_FINAL = {
  prelude: 'Thật ra điều anh muốn nói nhất rất đơn giản.',
  main: 'Anh vẫn muốn chọn em.',
  after: 'Hôm nay, ngày mai, và cả những ngày rất bình thường sau này.'
} as const;
```

---

# 7. ROUTE /UNSAID

Sửa:

```text
src/app/app.routes.ts
```

Thêm trước wildcard:

```ts
{
  path: 'unsaid',
  loadComponent: () =>
    import('./features/unsaid/unsaid.page')
      .then((m) => m.UnsaidPage)
},
```

Route order:

```text
/
/birthday
/timeline
/memory/:id
/japan-notes
/love-treasure
/unsaid
/**
```

Không thêm `/unsaid` vào navbar.

Không thêm CTA công khai dẫn tới `/unsaid`.

---

# 8. LETTER ORIGAMI HINT COMPONENT

Tạo:

```text
src/app/features/birthday/components/
letter-origami-hint/
letter-origami-hint.component.ts
```

Standalone:

```ts
@Component({
  selector: 'app-letter-origami-hint',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

## 8.1. Outputs

```ts
@Output()
readonly activeChange = new EventEmitter<boolean>();

@Output()
readonly completed = new EventEmitter<void>();
```

Không inject Router.

---

# 9. STATE MACHINE

Không dùng quá nhiều boolean.

Dùng state rõ ràng:

```ts
type FoldStep = 0 | 1 | 2 | 3 | 4;
```

Signals:

```ts
protected readonly armed = signal(false);
protected readonly origamiMode = signal(false);
protected readonly foldStep = signal<FoldStep>(0);
protected readonly dragProgress = signal(0);
protected readonly heartComplete = signal(false);
protected readonly reducedMotion = signal(false);
```

Pointer state:

```ts
private activePointerId?: number;

private pointerStartX = 0;
private pointerStartY = 0;

private previousBodyOverflow = '';
```

Nếu cần lưu target:

```ts
private activeHandle?: HTMLElement;
```

---

# 10. HINT CHỈ ARMED KHI ĐỌC GẦN HẾT THƯ

Không hiển thị nếp gấp ngay khi user vào Letter.

Trong component tạo sentinel:

```html
<div
  #hintSentinel
  class="origami-sentinel"
  aria-hidden="true">
</div>
```

Sentinel đặt gần cuối `.love-letter`.

Dùng:

```ts
IntersectionObserver
```

Threshold đề xuất:

```ts
threshold: 0.55
```

Khi sentinel đủ visible:

```ts
this.armed.set(true);
```

Observer chỉ cần arm một lần.

Sau khi armed:

```ts
observer.disconnect();
```

---

# 11. VISUAL HINT BAN ĐẦU

Khi chưa armed:

```text
crease opacity = 0
pointer-events = none
```

Khi armed:

```text
crease opacity ≈ 0.20–0.30
pointer-events = auto
```

Visual:

```text
góc dưới phải của lá thư hơi gập lên
```

Không hiện chữ:

```text
Kéo tôi
Hint
Secret
Mở bí mật
```

Không icon:

```text
🔒
👆
💡
```

---

# 12. TOUCH TARGET

Visual crease có thể nhỏ.

Nhưng hit area:

```text
min-width: 52px
min-height: 52px
```

Không nhỏ hơn:

```text
44 × 44 px
```

---

# 13. CƠ CHẾ UNLOCK

Hint #3 không tính thời gian giữ.

Phải dùng gesture kéo đúng hướng.

Tổng cộng:

```text
4 folds
```

State:

```text
0 → 1 → 2 → 3 → 4
```

---

# 14. FOLD #1 — GÓC PHẢI

Target:

```text
bottom-right
```

Gesture:

```text
↖
```

Điều kiện:

```text
dx < 0
dy < 0
```

Threshold phải responsive.

Ví dụ:

```ts
const rect = element.getBoundingClientRect();

const threshold = Math.max(
  44,
  Math.min(rect.width, rect.height) * 0.14
);
```

Pass nếu:

```ts
dx <= -threshold &&
dy <= -(threshold * 0.7)
```

---

# 15. FOLD #2 — GÓC TRÁI

Target:

```text
bottom-left
```

Gesture:

```text
↗
```

Pass:

```ts
dx >= threshold &&
dy <= -(threshold * 0.7)
```

---

# 16. FOLD #3 — CẠNH DƯỚI

Target:

```text
bottom-center
```

Gesture:

```text
↑
```

Pass:

```ts
dy <= -threshold
```

Cho tolerance ngang:

```ts
Math.abs(dx) <= threshold * 1.2
```

---

# 17. FOLD #4 — CẠNH TRÊN

Target:

```text
top-center
```

Gesture:

```text
↓
```

Pass:

```ts
dy >= threshold
```

Có thể tolerance:

```ts
Math.abs(dx) <= threshold * 1.2
```

Sau khi thành công:

```ts
this.foldStep.set(4);
this.heartComplete.set(true);
```

---

# 18. DRAG PROGRESS

Không chỉ snap cuối.

Trong pointermove tính:

```text
0 → 1
```

để CSS phản ứng realtime.

Ví dụ:

```ts
progress = clamp(correctDirectionalDistance / threshold, 0, 1)
```

Set:

```ts
this.dragProgress.set(progress);
```

CSS có thể dùng:

```text
--drag-progress
```

để tăng rotate / translate nhẹ.

Không dùng progress để navigate.

---

# 19. POINTER CAPTURE

Bắt buộc dùng:

```ts
target.setPointerCapture(event.pointerId);
```

Khi pointerdown lưu:

```ts
this.activePointerId = event.pointerId;
this.pointerStartX = event.clientX;
this.pointerStartY = event.clientY;
```

Chỉ xử lý pointermove đúng pointer ID.

---

# 20. POINTER CLEANUP

Handle đầy đủ:

```text
pointerup
pointercancel
lostpointercapture
```

Nếu fold fail:

```text
dragProgress = 0
foldStep giữ nguyên
```

Nếu success:

```text
foldStep += 1
dragProgress = 0
```

Không để gesture kẹt.

---

# 21. KHÔNG BIẾN CẢ ARTICLE DÀI THÀNH ORIGAMI

Không transform nguyên:

```text
.love-letter
```

vì content dài và khó kiểm soát mobile.

Sau Fold #1:

```text
real letter
↓ fade out
normalized origami overlay
```

Overlay:

```css
position: fixed;
inset: 0;
z-index: cao;
display: grid;
place-items: center;
```

Background:

```text
warm translucent backdrop
```

---

# 22. ORIGAMI MODE

Khi Fold #1 thành công:

```ts
this.origamiMode.set(true);
this.activeChange.emit(true);
```

Normalized paper:

```text
desktop width ≈ 390px
mobile width = min(82vw, 360px)
aspect-ratio ≈ 3 / 4
```

Không duplicate nội dung lá thư thật.

---

# 23. PAPER REPRESENTATION

Render dạng tượng trưng:

```text
H ♡ Q

Cho Quỳnh,
người anh thương.

────────────

████ ███████ █████
████████ █████████
████ █████████ ███
██████████ ███████

05 · 09 · 2026
```

Các dòng giả tạo bằng CSS.

Lợi ích:

```text
DOM nhẹ
animation dễ
không duplicate accessibility text
không phải clone article
```

---

# 24. PAPER LAYERS

Template ví dụ:

```html
<div
  class="origami-paper"
  [class.fold-step-1]="foldStep() >= 1"
  [class.fold-step-2]="foldStep() >= 2"
  [class.fold-step-3]="foldStep() >= 3"
  [class.fold-step-4]="foldStep() >= 4"
>
  <div class="paper-base"></div>

  <div class="fold-layer fold-right"></div>
  <div class="fold-layer fold-left"></div>
  <div class="fold-layer fold-bottom"></div>
  <div class="fold-layer fold-top"></div>

  <!-- active fold handle -->
</div>
```

Dùng:

```text
clip-path
transform
transform-origin
transition
```

Không cần mô phỏng origami vật lý chính xác 100%.

Ưu tiên:

```text
cinematic
smooth
stable
mobile friendly
```

---

# 25. STATE KHÔNG PHỤ THUỘC ANIMATIONEND

Sai:

```text
animationend
→ tăng foldStep
```

Đúng:

```text
gesture pass
→ state update ngay
→ CSS animate theo state
```

Như vậy:

```text
prefers-reduced-motion
```

không phá logic.

---

# 26. LOCK BODY SCROLL

Khi origamiMode bắt đầu:

```ts
this.previousBodyOverflow = document.body.style.overflow;
document.body.style.overflow = 'hidden';
```

Khi:

```text
cancel
complete
destroy
```

restore:

```ts
document.body.style.overflow = this.previousBodyOverflow;
```

Không để website bị lock scroll sau khi thoát.

---

# 27. ESCAPE

Origami component tự handle:

```ts
@HostListener('document:keydown.escape', ['$event'])
```

Nếu active:

```ts
event.preventDefault();
event.stopPropagation();
```

Sau đó:

```text
cancel origami
```

Reset:

```ts
origamiMode = false
foldStep = 0
dragProgress = 0
heartComplete = false
activeChange.emit(false)
restore body scroll
```

---

# 28. XỬ LÝ CONFLICT ESCAPE VỚI PARENT

`BirthdayExperienceComponent` hiện có global Escape.

Thêm:

```ts
protected readonly origamiActive = signal(false);
```

Trong parent escape:

```ts
if (this.origamiActive()) return;
```

Origami:

```html
<app-letter-origami-hint
  (activeChange)="origamiActive.set($event)"
  (completed)="openUnsaid()"
/>
```

---

# 29. KEYBOARD ACCESSIBILITY

Mỗi active fold handle là button.

Ví dụ aria-label:

```text
Gấp góc phải của lá thư
Gấp góc trái của lá thư
Gấp cạnh dưới của lá thư
Gấp cạnh trên của lá thư
```

Không dùng aria-label tiết lộ:

```text
Mở bí mật
Unlock Easter egg
Đi tới /unsaid
```

---

# 30. KEYBOARD FOLD

Khi handle focus:

```text
Enter
Space
```

→ complete đúng một fold.

Không long press.

Không delay 3 giây.

Ví dụ:

```text
Enter → fold 1
Enter → fold 2
Enter → fold 3
Enter → fold 4
```

---

# 31. PREFERS REDUCED MOTION

Detect bằng:

```ts
window.matchMedia('(prefers-reduced-motion: reduce)')
```

CSS:

```css
@media (prefers-reduced-motion: reduce) {
  /* bỏ rotate dài / bounce / floating */
}
```

Nhưng phải giữ:

```text
gesture
state
keyboard
navigation
```

Không disable feature.

---

# 32. HEART COMPLETE

Sau Fold #4:

```text
paper
↓
compress
↓
heart
```

Không cần SVG phức tạp.

Có thể dùng:

```text
clip-path
pseudo-elements
CSS transforms
```

Tone:

```text
wine
cream
champagne
```

---

# 33. EASTER EGG TRONG EASTER EGG

Sau khi heart complete:

Heart xoay nhẹ:

```text
~180°
```

Mặt sau:

```text
04.01.2026
still folding our story
```

Hiện khoảng:

```text
700–900 ms
```

Sau đó quay lại.

Nếu reduced motion:

```text
show text trực tiếp
```

không cần rotate.

---

# 34. COPY TRƯỚC KHI NAVIGATE

Sau heart complete hiển thị:

```text
Có những điều anh không viết trong lá thư này.

Nhưng anh vẫn muốn em biết.

H ♡ Q
```

Không navigate ngay lập tức.

Delay hợp lý:

```text
1200–1600 ms
```

Không quá:

```text
2000 ms
```

Sau đó:

```ts
this.completed.emit();
```

---

# 35. INTEGRATE VÀO BIRTHDAY EXPERIENCE

Import:

```ts
LetterOrigamiHintComponent
```

Thêm vào imports.

Trong `.love-letter`, đặt sau footer hoặc ở phần cuối article:

```html
<app-letter-origami-hint
  (activeChange)="origamiActive.set($event)"
  (completed)="openUnsaid()"
/>
```

---

# 36. NAVIGATION METHOD

Trong parent:

```ts
protected openUnsaid(): void {
  this.journey.complete();
  void this.router.navigateByUrl('/unsaid');
}
```

Pattern giữ giống:

```text
openJapanNotes()
openLoveTreasure()
```

---

# 37. NORMAL FLOW PHẢI GIỮ NGUYÊN

Button:

```text
Đi cùng anh nhé
```

vẫn gọi:

```ts
goToTimeline()
```

Không thay đổi.

---

# 38. /UNSAID PAGE — DESIGN

Concept:

```text
quiet
paper
minimal
intimate
```

Không dùng:

```text
galaxy
vinyl
music player
fireworks
Japan visual
photo gallery
MemoryService
```

Mục tiêu:

```text
Hint #3 có identity riêng
```

---

# 39. /UNSAID HERO

Hero:

```text
H ♡ Q

NHỮNG ĐIỀU ANH CHƯA NÓI

Có vài điều
anh chưa viết vào lá thư.
```

Animation nhẹ.

Không splash dài.

---

# 40. FOLDED NOTES

Render 8 note.

Desktop:

```text
2 columns
```

Tablet:

```text
2 columns
```

Mobile:

```text
1 column
```

Closed note:

```text
┌──────────────────┐
│                  │
│      H ♡ Q       │
│                  │◢
└──────────────────┘
```

Không lộ text.

---

# 41. NOTE INTERACTION

Ở `/unsaid`, note không phải secret trigger.

Click/tap bình thường:

```text
closed
↓
open
↓
text reveal
```

Keyboard:

```text
Enter / Space
```

cũng mở.

---

# 42. NOTE STATE

Dùng:

```ts
protected readonly openedNotes =
  signal<ReadonlySet<string>>(new Set());
```

Khi open:

```ts
const next = new Set(this.openedNotes());
next.add(id);
this.openedNotes.set(next);
```

Không mutate trực tiếp Set hiện tại.

---

# 43. NOTE KHÔNG ĐÓNG LẠI

Sau khi open:

```text
click lại
→ giữ open
```

Lý do:

```text
finale phụ thuộc số note đã mở
```

---

# 44. PROGRESS KÍN ĐÁO

Không dùng:

```text
5/8 complete
Progress
Level
```

Dùng 8 chấm:

```text
○ ○ ○ ○ ○ ○ ○ ○
```

Mở note:

```text
● ● ○ ○ ○ ○ ○ ○
```

Có accessible label riêng:

```text
2 trên 8 lời nhắn đã được mở
```

---

# 45. ALL OPENED

Computed:

```ts
protected readonly allOpened = computed(
  () => this.openedNotes().size === UNSAID_NOTES.length
);
```

Khi true:

```text
reveal finale
```

---

# 46. FINALE

Hiển thị:

```text
Thật ra điều anh muốn nói nhất rất đơn giản.
```

Sau đó:

# Anh vẫn muốn chọn em.

Tiếp:

```text
Hôm nay, ngày mai,
và cả những ngày rất bình thường sau này.
```

Cuối:

```text
H ♡ Q
04 · 01 · 2026 → ∞
```

---

# 47. NAVIGATION CUỐI /UNSAID

Primary:

```text
Quay lại lá thư
```

→

```text
/birthday?stage=letter
```

Secondary:

```text
Đi đến những kỷ niệm
```

→

```text
/timeline
```

Không link `/unsaid` ra bên ngoài.

---

# 48. KHÔNG LƯU PROGRESS

Không:

```text
localStorage
sessionStorage
cookies
```

Mỗi lần vào `/unsaid`:

```text
notes đóng lại
```

Mỗi lần quay lại letter:

```text
origami reset
```

Easter egg replayable.

---

# 49. E2E HELPER

Trong:

```text
e2e/our-story.spec.ts
```

Tạo helper:

```ts
async function openBirthdayLetter(page: Page): Promise<void>
```

Flow:

```text
/birthday
↓
Mở món quà của em
↓
Mở món quà
↓
Mở lá thư
↓
Mở phong thư
↓
Letter
```

Không duplicate flow.

---

# 50. TEST 1 — NORMAL FLOW

```text
open letter
click “Đi cùng anh nhé”
expect /timeline
expect NOT /unsaid
```

Test cũ phải vẫn pass.

---

# 51. TEST 2 — HINT CHƯA ARMED

Sau khi Letter load:

```text
crease not interactive
origami mode false
```

Không được auto-open.

---

# 52. TEST 3 — HINT ARMED SAU KHI SCROLL

Scroll tới footer/sentinel:

```ts
await sentinel.scrollIntoViewIfNeeded();
```

Expect:

```text
armed = true
crease interactive
```

---

# 53. TEST 4 — DRAG KHÔNG ĐỦ

Pointerdown.

Move ~15px.

Pointerup.

Expect:

```text
foldStep = 0
origamiMode = false
URL unchanged
```

---

# 54. TEST 5 — SAI HƯỚNG

Bottom-right kéo:

```text
↘
```

Expect:

```text
không fold
```

---

# 55. TEST 6 — POINTERCANCEL

```text
pointerdown
pointermove
pointercancel
```

Expect:

```text
dragProgress reset
foldStep unchanged
```

---

# 56. TEST 7 — MOUSE FULL UNLOCK

Thực hiện:

```text
BR ↖
BL ↗
BOTTOM ↑
TOP ↓
```

Expect:

```text
heart complete
→ /unsaid
```

---

# 57. TEST 8 — TOUCH FULL UNLOCK

Repeat bằng:

```text
pointerType: touch
```

Expect:

```text
/unsaid
```

---

# 58. TEST 9 — ESC CANCEL

Sau fold #1:

```text
origamiMode = true
```

Press:

```text
Escape
```

Expect:

```text
overlay gone
Letter visible
URL vẫn /birthday
body scroll restored
foldStep reset
```

---

# 59. TEST 10 — KEYBOARD ENTER

Focus active handle.

Press:

```text
Enter × 4
```

Expect:

```text
/unsaid
```

---

# 60. TEST 11 — KEYBOARD SPACE

Ít nhất 1 fold phải test:

```text
Space
```

Expect fold state tăng.

---

# 61. TEST 12 — REDUCED MOTION

```ts
await page.emulateMedia({
  reducedMotion: 'reduce'
});
```

Unlock bằng keyboard hoặc pointer.

Expect:

```text
feature vẫn hoạt động
/unsaid vẫn mở
không phụ thuộc animationend
```

---

# 62. TEST 13 — DIRECT /UNSAID

```text
goto /unsaid
```

Expect:

```text
heading “Những điều anh chưa nói”
8 folded notes
```

---

# 63. TEST 14 — OPEN NOTE

Click note đầu.

Expect:

```text
note mở
text visible
progress 1/8
```

Click lại:

```text
vẫn open
```

---

# 64. TEST 15 — KEYBOARD NOTE

Focus note thứ 2.

Press:

```text
Enter
```

Expect note mở.

---

# 65. TEST 16 — ALL NOTES FINALE

Open đủ 8.

Expect:

```text
“Anh vẫn muốn chọn em.”
```

visible.

Expect:

```text
04 · 01 · 2026 → ∞
```

visible.

---

# 66. TEST 17 — RETURN TO LETTER

Trong `/unsaid` click:

```text
Quay lại lá thư
```

Expect:

```text
/birthday?stage=letter
heading “Cho Quỳnh”
```

---

# 67. TEST 18 — GO TO TIMELINE

Click:

```text
Đi đến những kỷ niệm
```

Expect:

```text
/timeline
```

---

# 68. TEST 19 — MOBILE TOUCH TARGETS

Ở mobile viewport kiểm:

```text
origami handle >= 44×44
folded note >= 44×44
nav buttons >= 44×44
```

---

# 69. TEST 20 — NO HORIZONTAL OVERFLOW

Dùng helper hiện có:

```ts
expectNoHorizontalOverflow(page)
```

Áp dụng ít nhất:

```text
/birthday letter origami mode
/unsaid
```

ở mobile.

---

# 70. TEST 21 — BODY SCROLL RESTORE

Test:

```text
enter origami
ESC
```

Sau đó evaluate:

```ts
document.body.style.overflow
```

phải trở về giá trị ban đầu.

---

# 71. TEST 22 — HIDDEN ROUTE KHÔNG LỘ NAV

Ở app header:

Expect không có:

```text
Unsaid
Những điều anh chưa nói
```

link.

---

# 72. UNIT / STATIC CHECKS

Chạy:

```bash
npm run check:scripts
```

Dù Hint #3 không sửa scripts, pipeline hiện tại yêu cầu repo sạch.

---

# 73. TEST COMMANDS

Sau implementation:

```bash
npm test
```

Sau đó:

```bash
npm run test:e2e
```

Không bỏ qua test fail cũ.

---

# 74. BUILD DEVELOPMENT

```bash
npm run build:dev
```

Expect:

```text
success
```

Không warning nghiêm trọng mới do Hint #3.

---

# 75. BUILD PRODUCTION / GITHUB PAGES

Chạy:

```bash
npm run build:pages
```

Phải đảm bảo:

```text
base href đúng
404.html tồn tại
.nojekyll tồn tại
/unsaid route hoạt động qua SPA fallback
```

---

# 76. VERIFY ARTIFACT

Nếu project có script:

```bash
npm run verify:artifact
```

phải pass.

---

# 77. TEST STATIC ROUTE /UNSAID

Sau build production, phục vụ `dist/our-story`.

Verify:

```text
/unsaid
```

load được khi vào từ app.

Và khi direct navigation thông qua GitHub Pages fallback không thành 404 trắng.

---

# 78. KHÔNG TẠO PUBLIC LINK CHO HINT

Không thêm:

```text
Home CTA → /unsaid
Timeline CTA → /unsaid
Navbar → /unsaid
Footer → /unsaid
```

Chỉ secret path từ origami.

---

# 79. VISUAL REQUIREMENTS — LETTER HINT

### Desktop

```text
crease nhỏ
không che text
không che CTA
không làm layout nhảy
```

### Mobile

```text
crease không tràn viewport
overlay vừa màn hình
fold target dễ thao tác
```

---

# 80. VISUAL REQUIREMENTS — /UNSAID

Phong cách:

```text
paper / letter / intimate
```

Color family ưu tiên tái sử dụng:

```text
var(--paper)
var(--surface)
var(--wine)
var(--ink)
var(--champagne)
var(--text-secondary)
var(--text-muted)
```

Không hardcode một palette hoàn toàn khác nếu không cần.

---

# 81. ANIMATION BUDGET

Không làm:

```text
heavy particle system
canvas
3D engine
WebGL
continuous JS animation
```

Ưu tiên:

```text
CSS transitions
CSS transforms
opacity
clip-path
```

Goal:

```text
mobile smooth
low power friendly
```

---

# 82. PERFORMANCE

Origami gesture:

```text
pointermove
```

chỉ update signal cần thiết.

Không:

```text
querySelectorAll trong mỗi pointermove
layout recalculation dư thừa
setInterval
setTimeout loop
```

Cache:

```text
rect/threshold
```

tại pointerdown nếu phù hợp.

---

# 83. MEMORY LEAK PREVENTION

Trong `ngOnDestroy`:

```text
disconnect IntersectionObserver
restore body scroll
clear timeout navigation
release references
activeChange.emit(false) nếu cần
```

Nếu dùng:

```text
matchMedia.addEventListener
```

phải remove listener.

---

# 84. TIMEOUT CLEANUP

Nếu dùng timeout cho heart finale:

```ts
private completionTimer?: ReturnType<typeof setTimeout>;
```

Trong destroy/cancel:

```ts
clearTimeout
```

Không để component destroy rồi vẫn navigate.

---

# 85. ROUTING SAFETY

Sau complete:

```ts
activeChange.emit(false);
restoreBodyScroll();
completed.emit();
```

Thứ tự ưu tiên:

```text
cleanup trước
navigation sau
```

Không navigate khi body còn lock scroll.

---

# 86. ARIA / ACCESSIBILITY

Origami overlay:

```text
role="dialog"
aria-modal="true"
aria-label="Gấp lá thư"
```

Khi mở:

```text
focus active fold handle
```

Khi cancel:

```text
focus trở lại hint trigger / letter area
```

Không bắt buộc full focus trap nếu implementation phức tạp, nhưng tối thiểu không để focus rơi ra background bằng tab dễ dàng.

Nếu làm focus trap đơn giản:

```text
chỉ active fold handle + cancel button ẩn/quiet
```

---

# 87. ACCESSIBLE CANCEL

Không chỉ ESC.

Trong origami overlay phải có một control accessible:

```text
button
aria-label="Quay lại lá thư"
```

Visual có thể cực nhỏ:

```text
×
```

hoặc:

```text
Quay lại
```

Không cần làm nó nổi bật.

---

# 88. HINT KHÔNG ĐƯỢC QUÁ DỄ

Không animate crease liên tục.

Không bounce.

Không pulse mạnh.

Không tooltip.

Chỉ:

```text
subtle fold + hover response
```

---

# 89. HINT KHÔNG ĐƯỢC QUÁ KHÓ

Sau khi user chạm vào crease:

- first drag phải có visual response realtime.
- nếu kéo đúng hướng, paper phải phản ứng.
- nếu fail, paper trở lại nhẹ nhàng.

Không để user tưởng element hỏng.

---

# 90. RESPONSIVE BREAKPOINTS

Tối thiểu kiểm:

```text
390×844
430×932
768×1024
1440×900
```

Không horizontal overflow.

---

# 91. DO NOT REFACTOR UNRELATED CODE

Không vì triển khai Hint #3 mà:

```text
tách toàn bộ BirthdayExperience
rewrite styles
đổi MemoryService
đổi router architecture
đổi build pipeline
đổi naming cũ
```

Chỉ refactor cục bộ nếu cần.

---

# 92. ERROR HANDLING

Nếu Pointer Events không hoạt động tốt:

```text
keyboard vẫn dùng được
```

Nếu IntersectionObserver không tồn tại:

fallback:

```ts
this.armed.set(true);
```

Không crash page.

---

# 93. COPY KHÔNG ĐƯỢC THAY ĐỔI TÙY Ý

Luna không tự viết lại nội dung romantic nếu không cần.

Dùng đúng content trong file plan này, trừ khi source hiện tại có wording cần đồng bộ.

---

# 94. COMMIT STRATEGY ĐỀ XUẤT

Có thể chia:

```text
feat(unsaid): add hidden unsaid route and content

feat(origami): add letter folding easter egg

test(hint): cover origami and unsaid flows
```

Hoặc một commit:

```text
feat(hint): add origami unsaid easter egg
```

Nếu Luna làm trực tiếp trên branch hiện tại, ưu tiên commit ít nhưng sạch.

---

# 95. DEFINITION OF DONE

Hint #3 chỉ được coi là hoàn thành khi toàn bộ điều kiện sau đúng:

- [ ] `/unsaid` route tồn tại.
- [ ] `/unsaid` không xuất hiện trên navbar.
- [ ] Birthday Letter normal flow vẫn đi `/timeline`.
- [ ] Hint #1 `/japan-notes` vẫn hoạt động.
- [ ] Hint #2 `/love-treasure` vẫn hoạt động.
- [ ] Hint #3 không dùng hold 3 giây.
- [ ] Hint chỉ armed gần cuối Letter.
- [ ] First fold dùng drag gesture.
- [ ] Có 4 fold rõ ràng.
- [ ] Mouse dùng được.
- [ ] Touch dùng được.
- [ ] Keyboard dùng được.
- [ ] ESC cancel được.
- [ ] Cancel restore body scroll.
- [ ] `prefers-reduced-motion` vẫn dùng được.
- [ ] Heart complete có visual finale.
- [ ] Complete navigate `/unsaid`.
- [ ] `/unsaid` có 8 folded notes.
- [ ] Notes mở bằng click/touch.
- [ ] Notes mở bằng keyboard.
- [ ] Mở đủ 8 note reveal finale.
- [ ] Có “Anh vẫn muốn chọn em.”
- [ ] Có `04 · 01 · 2026 → ∞`.
- [ ] Có action quay lại Letter.
- [ ] Có action tới Timeline.
- [ ] Không localStorage/sessionStorage cho Hint #3.
- [ ] Không thêm backend.
- [ ] Không thêm npm dependency.
- [ ] Không sửa generated memories.
- [ ] Unit tests pass.
- [ ] E2E tests pass.
- [ ] `npm run build:dev` pass.
- [ ] `npm run build:pages` pass.
- [ ] `npm run verify:artifact` pass nếu script tồn tại.
- [ ] GitHub Pages SPA fallback không hỏng.
- [ ] Không horizontal overflow mobile.
- [ ] Không memory leak.
- [ ] Không body scroll lock sau navigation.
- [ ] Không regression UI ở Birthday Letter.

---

# 96. THỨ TỰ THỰC THI BẮT BUỘC CHO LUNA

Luna nên thực hiện đúng thứ tự sau:

```text
STEP 01
Read source + xác nhận architecture.

STEP 02
Tạo unsaid.content.ts.

STEP 03
Tạo /unsaid route.

STEP 04
Tạo UnsaidPage tối thiểu và đảm bảo route compile.

STEP 05
Tạo LetterOrigamiHintComponent skeleton.

STEP 06
Implement IntersectionObserver + armed state.

STEP 07
Implement first crease + fold #1.

STEP 08
Implement origami overlay.

STEP 09
Implement folds #2–#4.

STEP 10
Implement pointer capture + cancel.

STEP 11
Implement keyboard interaction.

STEP 12
Implement ESC + body scroll cleanup.

STEP 13
Implement reduced motion.

STEP 14
Implement heart completion + copy.

STEP 15
Integrate vào BirthdayExperience.

STEP 16
Implement /unsaid folded notes.

STEP 17
Implement final reveal.

STEP 18
Implement navigation back Letter / Timeline.

STEP 19
Run unit tests.

STEP 20
Add E2E helpers.

STEP 21
Add normal-flow regression tests.

STEP 22
Add origami mouse/touch tests.

STEP 23
Add keyboard/escape/reduced-motion tests.

STEP 24
Add /unsaid tests.

STEP 25
Run full E2E.

STEP 26
Run build:dev.

STEP 27
Run build:pages.

STEP 28
Run artifact verification.

STEP 29
Review diff.

STEP 30
Chỉ kết thúc khi Definition of Done đạt 100%.
```

---

# 97. OUTPUT BÁO CÁO SAU KHI LUNA HOÀN THÀNH

Luna phải báo cáo theo format:

```markdown
## Implemented
- ...

## Files created
- ...

## Files modified
- ...

## Tests added
- ...

## Verification
- npm test: PASS/FAIL
- npm run test:e2e: PASS/FAIL
- npm run build:dev: PASS/FAIL
- npm run build:pages: PASS/FAIL
- npm run verify:artifact: PASS/FAIL

## Remaining issues
- None
```

Không chỉ nói:

```text
Done
Implemented successfully
```

Phải có bằng chứng command/test.

---

# 98. ƯU TIÊN KHI CÓ MÂU THUẪN

Nếu phải lựa chọn giữa:

```text
animation đẹp
vs
interaction ổn định
```

chọn:

```text
interaction ổn định
```

Nếu giữa:

```text
origami vật lý chính xác
vs
mobile responsive
```

chọn:

```text
mobile responsive
```

Nếu giữa:

```text
secret cực khó phát hiện
vs
user có khả năng khám phá
```

chọn:

```text
subtle nhưng có phản hồi khi chạm
```

Nếu giữa:

```text
refactor lớn
vs
patch cục bộ
```

chọn:

```text
patch cục bộ
```

---

# 99. KẾT QUẢ UX MONG MUỐN

Người dùng bình thường:

```text
đọc thư
↓
Đi cùng anh nhé
↓
Timeline
```

Người tò mò:

```text
đọc gần cuối thư
↓
nhìn thấy một góc giấy hơi gập
↓
thử kéo
↓
lá thư bắt đầu gấp
↓
tiếp tục khám phá
↓
trái tim origami
↓
“Có những điều anh không viết trong lá thư này.”
↓
/unsaid
↓
8 mảnh giấy
↓
“Anh vẫn muốn chọn em.”
```

Đây phải là một Easter egg cảm xúc, không phải một mini-game gây khó chịu.

---

# 100. FINAL ACCEPTANCE STATEMENT

Khi hoàn thành, Hint #3 phải có bản sắc hoàn toàn khác:

```text
Hint #1
Long hold
→ Japan Notes
→ lời dặn

Hint #2
Long hold
→ Love Treasure
→ ảnh + galaxy + music

Hint #3
Origami gesture
→ Unsaid
→ những điều chưa nói
```

Không trùng mechanic.
Không trùng visual identity.
Không trùng nội dung.
Không phá flow chính.
Không tăng dependency.
Không phá GitHub Pages.

**Mục tiêu cuối cùng: tạo cảm giác đây là một bí mật thật sự được giấu trong chính lá thư, chứ không phải một button bí mật được thêm vào giao diện.**
