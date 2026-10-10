# MASTER IMPLEMENTATION PLAN — “CHỒNG NHỚ QUỲNH” ❤️🍁

> **Mã tài liệu:** `HQ-MISS-YOU-SECRET-PAGE-001`  
> **Phiên bản:** `1.0.0` · **Ngày soạn:** `2026-10-10`  
> **Dự án:** `hung-quynh-our-story`  
> **Repository:** <https://github.com/daovanhung-dev/hung-quynh-our-story>  
> **Production URL dự kiến:** <https://daovanhung-dev.github.io/hung-quynh-our-story/>  
> **Đích triển khai:** bổ sung **một trang hint bí mật về nỗi nhớ** vào website hiện có, KHÔNG xây lại website.  
> **Mức ưu tiên:** P0 = giữ nguyên thư, khóa mở đúng `HyeuQ`, bộ đếm ngày, phát nhạc thật, tương thích GitHub Pages; P1 = hình ảnh/hiệu ứng; P2 = polish.  
> **Các file bàn giao kèm theo:** `LOVE_LETTER_ORIGINAL.md` là bản thư nguồn, UTF-8, 30 dòng nội dung, SHA-256 `1752b77b6170143ff4ab77181da28d3a1a2e166d40c9901831f46bca58804186`.

---

## 0. MỆNH LỆNH DÀNH CHO CODEX — ĐỌC TRƯỚC KHI LÀM

Bạn là **Codex, Senior Angular Engineer + UX Motion Designer + QA Engineer**. Nhiệm vụ là **khảo sát kỹ mã nguồn, triển khai trọn vẹn, chạy test, tự sửa lỗi, báo cáo kết quả có bằng chứng**. Không chỉ viết kế hoạch rồi dừng lại.

### 0.1. Những ràng buộc không được vi phạm

1. **ĐỌC TOÀN BỘ** `AGENTS.md`, `.agent/`, `README*`, `docs/` liên quan, `package.json`, router, layout trang chính, hệ media, kho nhạc, kho ảnh, script build/deploy và test trước khi sửa. File nào không tồn tại phải ghi “không có” chứ không tự suy đoán.
2. **Không viết lại, sửa lỗi chính tả, diễn đạt lại, cắt gọn hay hoán vị một ký tự nào trong nội dung thư** ở Phụ lục A. Bảo toàn dấu, emoji, `**` làm đậm, dấu câu, cách xuống dòng và cách xưng hô. Tuyệt đối không dùng AI “biên tập thư cho hay hơn”.
3. **Không tạo website/repo mới**, không thay UI hiện tại ngoài vị trí đặt secret trigger cần thiết; không xóa, thay đổi các route Home, Birthday, Gift Reveal, Envelope, Love Letter, Timeline, Memory Detail, Photo Viewer hoặc feature khác đang hoạt động.
4. Không đoán đường dẫn file ảnh/nhạc. Chỉ sử dụng **asset thực tế** đã kiểm kê; nếu thiếu, thực hiện fallback đẹp và liệt kê rõ asset thiếu. Tuyệt đối không giả một audio đang phát hay bịa tên bài hát.
5. **Không hard-code số ngày**, phải tính theo *ngày lịch Việt Nam* kể từ **22/09/2026**. Mẫu đối chiếu: ngày **10/10/2026 = 18 ngày** (ngày bắt đầu = 0). Dùng **Asia/Ho_Chi_Minh** kể cả khi máy người xem ở Nhật; tự cập nhật khi qua nửa đêm Việt Nam.
6. Mã mở bí mật phải đúng chính xác `HyeuQ`: so sánh `===`, có phân biệt chữ hoa/thường, không trim, không lowercase, không auto-correct. Có thể bật `autocomplete="off"` và `spellcheck="false"`.
7. **Giải thích đúng giới hạn bảo mật:** GitHub Pages là static public hosting. Mật mã trong JavaScript và thư/ảnh bundled vào client **không bảo mật khỏi người biết xem source/network**. Đây là **Easter egg / surprise gate**, KHÔNG gọi là “được mã hóa” hay “chỉ Quỳnh mới xem được” theo nghĩa an ninh. Nếu chủ dự án muốn dữ liệu thật sự riêng tư thì chuyển letter/media sang backend có xác thực, không đưa bí mật vào public bundle.
8. Tôn trọng `prefers-reduced-motion`, giao diện cảm ứng, bàn phím, screen reader, tương phản và khả năng đọc thư. Không tự bật nhạc có tiếng khi mới vào trang.
9. Chạy đầy đủ các script **hiện hữu**, không tự chế kết quả “pass”, không commit credentials, không vô tình đưa dữ liệu nhạy cảm mới lên public repo.
10. Nếu một đầu vào thực sự thiếu (ảnh anime được phép sử dụng, kho audio trống, thiếu font…), vẫn hoàn thiện cấu trúc/logic/UI bằng fallback rõ ràng, ghi blocker và việc cần cung cấp; **không tự động dùng URL ảnh ngẫu nhiên hoặc ảnh của người lạ**.
11. Với mọi thay đổi, ghi vào `docs/worklog/YYYY-MM-DD-miss-you-secret-page.md` hoặc convention thực tế của repo.
12. Không push/deploy vào nhánh chính nếu chưa được phép. Hoàn thành code, test và báo cáo; tuân thủ workflow repo.

### 0.2. Quy tắc ra quyết định

- **Source thực tế > suy đoán tài liệu.** Các đường dẫn trong tài liệu chỉ là *tên gợi ý*; tìm structure thật rồi điều chỉnh.
- Nếu repo có player, animation, gallery/memory-index, route guard, component/theme dùng chung: **tái sử dụng**, không duplicate.
- Nếu thêm dependency phải nêu vì sao, alternatives, bundle impact; ưu tiên Angular/TypeScript/CSS/SVG sẵn có.
- Không hy sinh tính dễ đọc để đổi lấy hiệu ứng cầu kỳ.
- Mỗi phase dưới đây phải có **mục đích → file thay đổi → thao tác → kiểm tra → điều kiện hoàn thành**, ghi rõ ngay trong worklog.

---

## 1. TẦM NHÌN SẢN PHẨM VÀ CÂU CHUYỆN THỊ GIÁC

### 1.1. Big idea

Một góc phố Nhật Bản vào buổi chiều thu, ánh đèn đường vàng ấm, lá phong lặng lẽ rơi. Ở giữa màn hình là con số lớn đếm những ngày vợ chồng xa nhau; bên trái là lá thư dài viết bằng giọng rất riêng của Hùng; bên phải là chiếc đĩa vinyl đang quay, phát những bản nhạc quen thuộc từ kho dự án. Những bức ảnh của hai người nằm trong khung **trái tim cắt thật**, chậm rãi trôi như kỷ niệm. Dòng chữ Nhật **僕はずっと君だけを愛してる** khẽ sáng lên: **Chồng mãi yêu mình em**.

Cảm xúc chính: **tha thiết – nhớ nhung – dịu dàng – bình yên – trưởng thành**, buồn nhưng **không bi lụy**, chăm sóc chứ không giám sát. Không biến ghen tuông trong thư thành hiệu ứng gây áp lực hoặc thông báo trách móc.

### 1.2. Luồng người dùng cuối

`Home hiện có → khám phá nút bí mật → nhập HyeuQ → mở phong thư/ánh sáng → Secret Miss You Page → nhìn số ngày → nghe nhạc tùy chọn → đọc toàn bộ thư → xem ảnh trái tim → quay lại Home`.

Với người dùng trực tiếp vào URL bí mật chưa mở khóa trong tab hiện tại: **chuyển về Home/secret gate**. Với refresh sau khi mở khóa: có thể duy trì gate trong **sessionStorage của tab hiện tại**, không quảng bá đây là security control.

### 1.3. “Wow moments” phải tiết chế

1. **Reveal:** cánh phong thư ảo mở bằng CSS/SVG, layer blur tan nhẹ (~700–1100 ms).
2. **First glance:** con số ngày xa nhau hiện lên bằng fade + translate tối đa 20 px; có halo ấm, trái tim thở chậm.
3. **Ambient:** lá thu có chiều sâu 3 lớp (foreground/midground/background), không đè chữ thư.
4. **Music:** đĩa quay chỉ khi audio `playing` thật; kim đĩa dịch vào đúng vị trí, phong cách retro tinh tế.
5. **Personal memory:** ảnh thực tế hai người có heart mask, hover/focus làm sáng, mở lightbox điều hướng bàn phím.
6. **Final emotion:** cuối thư được giữ nguyên câu chữ; phần chữ ký trang trí (nếu có) nằm ngoài dữ liệu thư, tránh làm người dùng hiểu là Hùng đã viết thêm trong nguyên bản.

---

## 2. PHẠM VI, NHÓM TÍNH NĂNG VÀ THỨ TỰ ƯU TIÊN

| Mã | Hạng mục | Priority | Tiêu chí bắt buộc |
|---|---|---|---|
| GATE-01 | Trigger trên Home | P0 | Không phá hero/menu hiện có; có tên truy cập phù hợp |
| GATE-02 | Mật mã `HyeuQ` case-sensitive | P0 | Sai không mở, Enter/click hoạt động, feedback dễ thương |
| ROUTE-01 | Route hint | P0 | Hỗ trợ deep link/fallback GitHub Pages, Back hoạt động |
| DAY-01 | Days apart center | P0 | 22/09/2026 → hôm nay VN, kiểm thử timezone |
| LETTER-01 | Nội dung thư nguyên văn | P0 | Giữ đủ 30 dòng nguồn, bold, emoji, các đoạn |
| LETTER-02 | Panel thư đọc dài | P0 | Cuộn mượt, đẹp, không bắt scroll ngang |
| AUDIO-01 | Tìm nhạc từ dự án | P0 | Tồn tại file thật, không giả metadata |
| AUDIO-02 | Player vinyl | P0 | Play/pause, next/previous, seek, trạng thái lỗi |
| VIS-01 | Phố Nhật anime/manga | P1 | Asset hợp pháp/đã có, overlay đảm bảo contrast |
| VIS-02 | Lá thu rơi | P1 | Light motion, giảm chuyển động khi cần |
| VIS-03 | Ảnh heart-mask | P1 | Ảnh thật, object-position hợp lý, lightbox |
| VIS-04 | Câu Nhật | P0 | `僕はずっと君だけを愛してる` + bản dịch Việt |
| POLISH-01 | Chuyển cảnh, ánh sáng, responsive | P1 | Không gây layout shift hoặc che nút |
| QA-01 | Tests + artifact verification | P0 | Local/build/test/e2e/production URL path |
| POLISH-02 | Mini-player sticky, biểu cảm theo nhạc | P2 | Chỉ triển khai nếu P0/P1 ổn định |

**Ngoài phạm vi:** backend mới, user accounts, analytics theo dõi người đọc, tự gửi thông báo, thu thập vị trí, tự động truy cập Spotify/YouTube không phép, công nghệ 3D nặng chỉ để trang trí.

---

## 3. THIẾT KẾ UX/UI — DESKTOP FIRST NHƯNG MOBILE CÓ THỨ TỰ RIÊNG

### 3.1. Desktop: trang ba cột, trung tâm thực sự nổi bật

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Logo/trở về        Chồng nhớ Quỳnh 🍁                  Âm thanh ○   Giảm hiệu ứng ○        │
│          (lá phong bay và phố Nhật anime là toàn bộ background, KHÔNG che text)          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│ ╭──────────── LÁ THƯ ──────────╮ ╭──── NGÀY XA NHAU ────╮ ╭──────── MUSIC ──────────╮   │
│ │ Trang giấy có đường kẻ nhẹ  │ │      từ 22.09.2026   │ │  Những bài hát nhớ em    │   │
│ │ Gửi vợ iu của chồng...      │ │                     │ │        ◉ VINYL ◉         │   │
│ │                             │ │         18          │ │       ┌ COVER ┐         │   │
│ │ Vợ iu ơiiii! ...            │ │      ngày xa nhau   │ │       ▶ / ⏸ / ⏭          │   │
│ │                             │ │                     │ │   track / seek / volume  │   │
│ │ Chồng thương...             │ │   Việt Nam  • Nhật │ │        PLAYLIST         │   │
│ │                             │ │                     │ │                          │   │
│ │  (SCROLL CHỈ Ở PANEL NÀY)  │ │  僕はずっと君だけを   │ │                          │   │
│ │                             │ │       愛してる      │ │                          │   │
│ ╰─────────────────────────────╯ │ Chồng mãi yêu mình em│ ╰──────────────────────────╯   │
│                                 ╰──────────────────────╯                                │
│      ♥ Ảnh kỷ niệm trái tim ♥        lá thu rơi ở những khoảng trống, không trên thư     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

**Tỷ lệ khởi điểm:** trái `40%`, giữa `27%`, phải `33%`; gap fluid khoảng 16–28 px. Đặt `min-width` hợp lý; nếu viewport không còn đủ đọc thì chuyển 2/1 cột, **không ép 3 cột mini**.

**Hierarchy:** (1) con số → (2) thư → (3) player → (4) ảnh & background. Con số có cỡ fluid `clamp(4.5rem, 8vw, 9rem)` nhưng không tràn ở viewport vừa.

### 3.2. Tablet (ví dụ 768–1199 px)

- Hero ngày xa nhau chiếm hàng đầu hoặc 1/2 cùng vinyl.
- Thư được ưu tiên thành card rộng 100%, không để cột thư bé đến mức mỗi dòng 3–4 chữ.
- Navigation trở về nhìn thấy rõ; lớp ảnh không phủ player.
- Khi màn hình quá thấp, để trang cuộn tự nhiên thay vì ba card có ba thanh cuộn lồng nhau.

### 3.3. Mobile (≤767 px; tối thiểu test 320, 360, 375, 390 px)

1. Header ngắn gọn + trở về.
2. Con số ngày xa nhau chiếm vị trí đầu tiên.
3. Một ảnh trái tim chủ đạo, câu Nhật + bản dịch.
4. Vinyl player gọn, nút chơi lớn dễ chạm, playlist có thể mở rộng.
5. Lá thư nguyên văn rộng tối đa, cuộn cùng trang; không dùng ô thư cao 250 px bắt người đọc cuộn lồng nhau mãi.
6. Nếu mini-player sticky, chỉ hiển thị sau khi người đọc vượt qua card player; không che nội dung cuối thư và có nút đóng/gập.

### 3.4. Design tokens đề xuất — có thể hợp nhất với theme cũ

```css
:root {
  --miss-bg-ink: #22243a;          /* đêm xanh tím */
  --miss-bg-ink-soft: #353449;
  --miss-paper: #fff3e6;           /* giấy thư */
  --miss-paper-ink: #503940;
  --miss-blush: #efb4be;
  --miss-rose: #a85b70;
  --miss-maple: #df9559;
  --miss-autumn-gold: #f4cb8c;
  --miss-glow: rgba(255, 207, 180, 0.22);
  --miss-border: rgba(255, 242, 222, 0.22);
  --miss-radius-card: 28px;
  --miss-spacing: clamp(14px, 2vw, 28px);
}
```

**Font:** chữ Việt đọc dài dùng font hiện có có Unicode Việt đầy đủ; số ngày dùng serif-display/typography hiện có; tiếng Nhật dùng fallback `"Noto Sans JP", "Yu Gothic", sans-serif` nếu có. Không tải font từ nguồn lạ, đặc biệt font không có dấu Việt. Text body thư tối thiểu 16–18 px, line-height khoảng 1.7–1.9, max line measure ~65–78 ký tự khi layout cho phép.

---

## 4. QUY TẮC CỐT LÕI: THƯ PHẢI BẤT BIẾN

1. Nguồn chuẩn là **Phụ lục A của tài liệu này** và file `LOVE_LETTER_ORIGINAL.md` đi kèm. Hai bản phải khớp byte-for-byte sau khi trích xuất đúng phần nội dung.
2. Khuyến nghị copy file nguồn vào `src/assets/content/love-letter-miss-you.md` **hoặc đường dẫn phù hợp sau khảo sát repo**; nội dung không được biến đổi bởi Prettier, editor auto-fix, import markdown hay i18n processor.
3. Dùng render an toàn (text binding, không nhúng `innerHTML` từ raw markdown). Chỉ parse tối thiểu `**bold**` thành text segments + `<strong>` Angular template; phần còn lại render text đúng, giữ ngắt dòng với `white-space: pre-wrap` / phân đoạn. Không cần thư viện markdown đầy đủ nếu không có sẵn.
4. Nếu cần các đoạn `<p>` để đọc dễ, chỉ tách bằng newline; **không được đổi chữ**, không auto-chèn/chỉnh dấu hoặc bỏ emoji. Nếu thư hiển thị các ký hiệu `**` trên UI, fix renderer, **không sửa file thư**.
5. Không chèn câu giới thiệu mới, chữ ký, nhãn thời gian vào bên trong dữ liệu thư; muốn trang trí thì đặt riêng ngoài container thư.
6. Tạo test so sánh SHA-256 hoặc so sánh exact text nguyên văn trước và sau bước copy/build. File nguồn gốc có **SHA-256**: `1752b77b6170143ff4ab77181da28d3a1a2e166d40c9901831f46bca58804186` tính trên UTF-8 với `\n` (LF) và **có một newline cuối file**. Nếu chủ dự án sửa thư sau này, cập nhật checksum chỉ theo yêu cầu rõ ràng của chủ dự án; KHÔNG tự động rebaseline để che lỗi.
7. Không log nội dung thư lên analytics, network tracking, error monitoring, console debug production.

**Lệnh kiểm tra tại thư mục có file nguồn:**

```bash
sha256sum LOVE_LETTER_ORIGINAL.md
# Expected: 1752b77b6170143ff4ab77181da28d3a1a2e166d40c9901831f46bca58804186
cmp -s LOVE_LETTER_ORIGINAL.md src/assets/content/love-letter-miss-you.md
# Nếu chọn path khác: thay tham số thứ hai bằng đường dẫn đã dùng.
```

---

## 5. LOGIC THỜI GIAN CHUẨN VÀ KHÔNG LỆCH NGÀY

### 5.1. Yêu cầu chính xác

- Ngày bắt đầu: **22 tháng 9 năm 2026**, tính đó là **ngày 0**.
- Múi giờ bộ đếm: `Asia/Ho_Chi_Minh` (UTC+7), **không dùng múi giờ hệ điều hành của Quỳnh làm mốc tính**.
- Đếm theo **calendar day** chứ không `floor((now - startMs) / 86400000)` nếu lệch giờ trong ngày, vì như vậy có thể cập nhật muộn tùy thời điểm.
- `2026-09-22 00:00 VN` → **0**; `2026-09-23 00:00 VN` → **1**; `2026-10-09 VN` → **17**; `2026-10-10 VN` → **18**.
- Trước ngày bắt đầu: trả về `0` và có thể hiển thị trạng thái “Chưa đến ngày xa nhau” thay vì số âm.
- Khi sang ngày mới Việt Nam mà app vẫn mở: cập nhật ngay; khi tab resume từ background cũng cập nhật.

### 5.2. Gợi ý triển khai ngày lịch (TypeScript, không dependency mới)

```ts
const START = { year: 2026, month: 9, day: 22 } as const;
const DAY_MS = 86_400_000;

function vietnamCivilDate(now: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const get = (key: string) => Number(parts.find(p => p.type === key)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
}

function civilDaysUtc(d: { year: number; month: number; day: number }): number {
  return Date.UTC(d.year, d.month - 1, d.day) / DAY_MS;
}

export function getDaysApart(now: Date = new Date()): number {
  return Math.max(0, civilDaysUtc(vietnamCivilDate(now)) - civilDaysUtc(START));
}
```

**Nhấn mạnh:** `Date.UTC` ở đây chỉ để ánh xạ **ngày lịch** vào số nguyên; không phải đổi mốc hiển thị sang UTC. Test mock `now` nằm trong cả các thời điểm gần 00:00 Việt Nam và máy ở múi giờ khác nhau.

### 5.3. Cập nhật mỗi khi đổi ngày

- Khi mount: tính `getDaysApart(new Date())`.
- Cập nhật khi `document.visibilitychange` (tab active lại).
- Scheduler: tính delay đến đúng 00:00 Việt Nam tiếp theo (có thể tính bằng UTC timestamp vì VN cố định UTC+7), setTimeout tới mốc đó; **sau callback tính lại theo clock thực**, reschedule. Hoặc tick mỗi 30–60 giây trong trang là phương án đơn giản, nhưng không để stale qua midnight.
- Dọn timer/subscriptions trong `ngOnDestroy`/`DestroyRef`.
- Có thể hiển thị thêm 2 đồng hồ `Asia/Ho_Chi_Minh` và `Asia/Tokyo`, nhưng phần ngày xa nhau chỉ dựa vào VN.

### 5.4. Trình bày giữa màn hình

```text
          TỪ 22.09.2026
                18
            NGÀY XA NHAU
   “Mỗi ngày là một ngày gần em hơn.”

        僕はずっと君だけを愛してる
         Chồng mãi yêu mình em
```

- Giữa phải là visual focus; dùng `font-variant-numeric: tabular-nums` để con số không giật ngang.
- Có animation chuyển số khi ngày thay đổi nhưng phải render số thật ngay, không đợi animation.
- Không hiển thị tiến trình “% ngày phải xa nhau” vì chưa có ngày gặp lại được xác nhận.

---

## 6. CỔNG BÍ MẬT: TÍCH HỢP VÀO HOME HIỆN CÓ

### 6.1. Khám phá mà không lộ quá mức

- Đặt icon/phong thư **“Có điều chồng muốn nói với em…”** ở vị trí hợp lý theo UI Home hiện tại (không thay hero, không chiếm CTA chính).
- Khi click: mở dialog/modal secret gate đẹp, focus input tự nhiên. Không bắt người dùng rời Home chỉ để nhập nếu giao diện hiện tại đã có modal convention.
- Input phải cho gõ chính xác `HyeuQ`, có Enter submit, click nút “Mở trái tim”.
- Mật mã **không hiện sẵn** trong hint, aria-label, placeholder, src của hình ảnh, hoặc báo lỗi.

### 6.2. State machine của gate

```text
idle → typing → validating
                    ├─ wrong   → shake nhẹ + thông báo, vẫn ở Home
                    └─ correct → unlocking → navigate(/hint/miss-you)
```

Các test tối thiểu:
- `HyeuQ` ✅
- `hyeuq`, `Hyeuq`, `HYEUQ`, `HyeuQ `, ` HyeuQ`, chuỗi rỗng ❌
- Enter và button đều dùng cùng handler.
- Không double submit khi đang transition.
- Có nút đóng dialog, Escape đóng, tab focus trap nếu dialog custom.

### 6.3. Routing

- Dự kiến URL nội bộ: `/hint/miss-you`, nhưng route thật phải theo cấu trúc `app.routes.ts`/router hiện hữu.
- Tạo `canActivate` (hoặc guard tương đương) đọc sessionStorage flag mở gate **để tránh truy cập nhầm**. Có thể dùng `sessionStorage.setItem('hq.missYou.unlocked', '1')` sau khi nhập đúng. Không tự nhận đây là bảo vệ khỏi cố ý truy cập.
- Deep-link chưa unlock: redirect tới `/` kèm thông báo ngắn ở Home, không loop.
- Refresh trong cùng tab sau unlock: duy trì; tab mới mặc định yêu cầu nhập lại (sessionStorage có thể được sao chép trong một số ngữ cảnh trình duyệt, không phải security boundary).
- Hỗ trợ URL nested của GitHub Pages `.../hung-quynh-our-story/hint/miss-you`; không hard-code `/hint/miss-you` làm physical asset path.

### 6.4. Chuyển cảnh

- Success → nền tối dịu, trái tim nở, vignette blur tan, khóa scroll trong ~800 ms (không chặn bàn phím hoặc mất focus), sau đó trang hiện đầy đủ.
- Nếu reduced motion: chuyển tức thì, không flash; bảo toàn thao tác back.

---

## 7. LOVE LETTER PANEL — BÊN TRÁI

### 7.1. Visual

- Chất liệu giấy nâu kem có texture rất nhẹ, viền một nét ấm, drop shadow mềm; có dấu sáp/tem trái tim **ngoài text content**.
- Heading trang trí “Lá thư chồng gửi vợ iu” phía trên nội dung.
- Màu chữ nâu mực đủ contrast, không dùng font script quá khó đọc cho hơn 10 KB thư.
- Có thể có nét kẻ ngang cực mờ; tránh nền giấy sáng đến mức lóa.
- Scroll bar mảnh nhưng vẫn có affordance scroll; nút “Đọc từ đầu” xuất hiện khi đã đọc xa.

### 7.2. Scroll behavior

- Desktop màn hình đủ cao: panel `max-height` gần viewport (trừ navbar, padding) và `overflow-y:auto` bên trong; wheel/touch không bị ngăn khi panel chạm đáy.
- Mobile: nội dung thư tham gia **scroll trang chính**, không lồng cuộn; không lazy-hide toàn bộ thư theo từng trang gây khó copy/đọc.
- Bảo toàn vị trí đọc khi nhạc đổi bài hoặc resize nhỏ (khi khả thi), không remount panel mỗi khi audio tick.

### 7.3. Rendering an toàn

- Asset text UTF-8; chỉ parser `**` để tạo mạnh một số đoạn do tác giả đánh dấu; `textContent` render xong (khi ghép tất cả text segments) phải bằng bản nguồn **sau khi loại đúng cặp marker `**` dành riêng cho syntax bold**, không mất chữ khác.
- Không dùng `innerHTML` string từ markdown nếu không có sanitizer và lý do đủ mạnh.
- Set `white-space: pre-wrap` hoặc chia thành blocks với newline được bảo toàn. Nếu source single-newline, đừng tạo nhiều dòng trống giả vào data.
- Test Unicode Vietnamese NFC/emoji, các dấu ngoặc kép, ký tự `…` nếu có, `**` đúng đoạn.

---

## 8. VINYL MUSIC PLAYER — BÊN PHẢI

### 8.1. Điều tra kho nhạc trước khi code

- Kiểm kê tất cả file `.mp3`, `.m4a`, `.aac`, `.ogg`, `.wav`, `.flac` trong dự án và có thể trong asset được dẫn từ index/JSON hiện có.
- Chỉ chọn loại thực sự được trình duyệt hỗ trợ; bản không hỗ trợ phải ghi chú/đề xuất transcode đúng quyền sử dụng.
- Tìm data source metadata/playlist có sẵn: **tái sử dụng** nếu đã có, không sinh một playlist riêng đầy đường dẫn ảo.
- Nếu audio không tồn tại trong repository: vẫn dựng player và empty state “Kho nhạc chưa sẵn sàng”, ghi rõ `MISSING_AUDIO_ASSETS`, không gắn URL nhạc bừa.
- Không sử dụng audio vi phạm quyền phân phối trên website công khai; asset chỉ dùng khi được phép.

### 8.2. Data contract gợi ý

```ts
export interface LoveTrack {
  id: string;
  src: string;            // URL hợp lệ do asset resolver hiện có tạo
  title: string;          // lấy từ metadata hoặc filename có thật
  artist?: string;
  coverSrc?: string;
  duration?: number;      // runtime metadata là nguồn đúng
  mood?: 'nho-em' | 'dem-khuya' | 'yeu-xa' | 'ky-niem';
}
```

### 8.3. Audio engine

- Dùng một `HTMLAudioElement` trong component/service, không tạo player mới cho mỗi bài/mini-player.
- `play()` trả Promise → handle autoplay policy, permission/user interaction, errors. Không báo `playing=true` khi Promise reject.
- `timeupdate` → progress, `loadedmetadata` → duration, `ended` → next (nếu playlist), `error` → thông báo phát lỗi và nút retry.
- `src` phải đi qua resolver tương thích base href GitHub Pages (`/hung-quynh-our-story/`); tránh asset URL từ root `/assets/...` nếu build ở subpath.
- Track switching: stop và hủy event/resource của bài cũ khi cần, đặt đúng `currentTime`, giữ state nhất quán.
- Trạng thái browser background: chỉ audio do người dùng bắt đầu mới tiếp tục; nếu đổi route, áp dụng behavior nhất quán (ngừng khi rời trang hoặc giữ player toàn app nếu kiến trúc đã có — chọn một và document).

### 8.4. UI chi tiết

- Vinyl 240–340 px desktop (fluid), các vòng rãnh SVG/CSS, nhãn tâm là cover asset thật hoặc gradient fallback; kim đĩa có pivot riêng.
- **Quay chỉ khi thật sự phát** (`animation-play-state: running/paused`), giữ góc khi pause, không quay trong lúc loading hoặc audio error.
- Track label tên bài + nghệ sĩ, progress draggable/clickable, `mm:ss / mm:ss`, `play/pause`, `previous`, `next`, volume/mute (desktop), list playlist scroll nhẹ.
- Nút chính target touch ≥44×44 px; phím Space/Enter hoạt động trên nút native.
- A11y: `aria-label="Tạm dừng nhạc"`/`"Phát nhạc"`, thanh seek hiển thị progress, không chỉ dùng màu báo bài active.
- Nếu playlist chỉ 1 bài: disable prev/next đúng, không giả là có nhiều bài.

### 8.5. Cảm xúc đồng bộ âm nhạc

- Khi playing: lá rơi/halo có thể “thở” nhẹ, nhưng không sync fake beat từ random visualizer. Không thêm nháy sáng mạnh khi nhạc đổi bài.
- Track chuyển bài: crossfade volume chỉ làm nếu không gây xung đột playback/API và đã test; mặc định chuyển bình thường.
- Tắt âm thanh mặc định, chỉ bắt đầu khi Quỳnh chủ động click phát.

---

## 9. ẢNH KỶ NIỆM TRÁI TIM VÀ KHUNG NHẬT BẢN

### 9.1. Nguồn ảnh

- Kiểm tra `public/`, `src/assets/`, index sinh bởi `generate:memories`, các folder media/migration, manifest. **Ưu tiên ảnh thật Hùng–Quỳnh từ dữ liệu hiện có**.
- Không tải các ảnh người lạ thay cho ảnh hai người, không tự suy đoán ngày tháng metadata.
- Số ảnh khởi điểm desktop 4–6, mobile 1–3; mỗi ảnh có `src`, `alt`, tùy chọn `date`, `objectPosition`; không làm lu mờ trung tâm.
- Nếu không tìm được ảnh: shape trái tim bằng gradient/illustration abstract, component chuẩn bị adapter; ghi blocker rõ.

### 9.2. Cắt theo hình trái tim **thật**

- Dùng SVG `clipPath` hoặc `mask` chuẩn (`viewBox` thống nhất) — tránh chỉ dùng border-radius làm “trái tim giả”.
- Preserve `object-fit:cover`, tùy chỉnh `object-position` khi khuôn mặt ở rìa, không méo hình.
- Dùng width/height hoặc aspect-ratio giữ khung, lazy-load ảnh phụ, eager 1 ảnh hero nếu thực sự first fold.
- Có fallback broken-image, xử lý alt khi hình bị lỗi.

### 9.3. Lightbox

- Click/tap hoặc Enter trên ảnh focusable → lightbox ảnh đầy đủ, next/prev nếu nhiều, Escape đóng, overlay click đóng, focus return về ảnh đã mở.
- Không phủ lớp ảnh nổi lên nút player, thư hay route navigation (z-index stack rõ).

### 9.4. Phố Nhật mùa thu — anime / manga mood

Art direction cụ thể:
- **Scene:** phố Nhật nhỏ lát đường sạch, biển hàng quán xa xa, dây điện, đèn vàng, vài cửa tiệm và lá momiji đỏ cam, trời tím hoàng hôn/đêm sớm, một góc trời rộng, phối cảnh có chiều sâu.
- **Style:** anime 2D painted background, delicate manga linework, ánh sáng điện ảnh nhẹ; tuyệt đối không dùng nhân vật anime bản quyền hay lấy cảnh từ phim nổi tiếng.
- **Composition:** chừa negative space ở ba card; chi tiết kiến trúc đậm tập trung quanh mép/đáy để không che letter/counter/player.
- **Asset strategy:** trước hết tìm asset dự án có quyền dùng; nếu chưa có thì người phụ trách dùng công cụ tạo asset phù hợp hoặc asset tự vẽ/có license. Kế hoạch này **không tự coi asset đã được sinh ra**.
- **Background render:** full-bleed `<picture>` có responsive webp/avif + backdrop `linear-gradient` cho readability, vignettes ở mép, tối ưu kích thước, no background video mặc định.

---

## 10. HỆ THỐNG HIỆU ỨNG MÙA THU VÀ MANGA

### 10.1. Các lớp theo z-index

```text
Z0   Anime street background/picture
Z1   overlay gradient + cinematic vignette
Z2   leaf particles / small bokeh (aria-hidden)
Z3   floating heart photos (không bắt click khi đè nội dung)
Z4   header, letter, counter, player — luôn rõ ràng
Z5   dialog/lightbox/toast
```

Nếu floating heart tương tác cần thay cách định vị để nó không nằm trên vùng nút; không dùng toàn layer `pointer-events:auto` bao phủ page.

### 10.2. Lá rơi

- Đề xuất **CSS keyframes + 12–20 leaf instances** desktop ở trạng thái high-motion, 6–10 tablet, 3–6 mobile; con số tune theo máy thật.
- Random properties được tạo **một lần khi mount**, tránh random lại mỗi Angular change detection; mỗi lá có left, size, duration, delay, sway, blur, opacity.
- Không cần Canvas/Three.js nếu DOM/CSS đáp ứng 60 fps; tránh thêm Three.js chỉ cho lá rơi (trang khác có Three.js không đồng nghĩa phải dùng).
- Transform/opacity GPU-friendly; tuyệt đối không animate `top/left/width/height` từng frame.
- Render leaf/particles `aria-hidden="true"`, tắt trên reduced motion; có toggle tắt/bật hiệu ứng tùy chọn, lưu theo current session hoặc local pref không chứa dữ liệu riêng tư.

### 10.3. Manga / anime feeling

- Các đường nét viền mảnh, lấp lánh rất thưa, vignette frame, vài đường gió khu phố.
- Hạn chế speed-lines, motion blur mạnh, flash, particle quá dày vì không phù hợp cảm giác nhớ nhung sâu lắng.
- Có thể thêm 1 câu ký ức nhỏ ở đầu, **không thay đổi chính thư**: “Một góc trời Nhật, một người đang nhớ em ở Việt Nam.”

### 10.4. Reveal & scroll motion

- Reveal 700–1100 ms trên desktop, giảm còn 350–650 ms mobile hoặc disable nếu reduced motion.
- Intersection Observer reveal card chỉ dùng nếu có fallback hiển thị tức thì, không để người dùng thấy màn hình trống vì JS lỗi.
- Không dùng hiệu ứng typewriter cho **toàn bộ bức thư** dài; đó là anti-pattern khiến khó đọc, khó copy.

---

## 11. THÀNH PHẦN VÀ KIẾN TRÚC ĐỀ XUẤT

> **ĐƯỜNG DẪN BÊN DƯỚI CHỈ LÀ SƠ ĐỒ THAM KHẢO.** Codex bắt buộc đối chiếu `src/` thật, áp dụng convention Angular repo; không tạo song song folder `app/` nếu repo đã có organization khác.

```text
src/
  app/
    ... app.routes.ts (đang có — thêm route/guard)
    features/
      miss-you/
        miss-you-page.component.ts
        miss-you-page.component.html
        miss-you-page.component.scss
        secret-gate.component.ts
        secret-gate.component.html
        secret-gate.component.scss
        services/
          days-apart.service.ts
          love-letter-content.service.ts
          love-music-player.service.ts
          heart-photos.service.ts
        components/
          days-apart-hero/
          love-letter-panel/
          vinyl-player/
          floating-heart-photos/
          autumn-leaves/
          anime-backdrop/
        models/
          love-track.model.ts
          heart-photo.model.ts
        guards/
          miss-you-unlock.guard.ts
        tests/                 # theo convention test repo
          days-apart.spec.ts
          secret-gate.spec.ts
          letter-integrity.spec.ts
          vinyl-player.spec.ts
  assets/...
    content/love-letter-miss-you.md
    images/miss-you/japan-autumn.*  # chỉ khi asset thật có
    ...                        # nhạc/ảnh tận dụng media pipeline cũ

e2e/
  miss-you-secret-page.spec.ts

docs/
  BD/HUNG_QUYNH_MISS_YOU_CODEX_PLAN.md
  worklog/YYYY-MM-DD-miss-you-secret-page.md
```

### Component contracts

| Component | Input / state | Event / output | Quan trọng |
|---|---|---|---|
| SecretGate | user input, isUnlocking | `unlocked` | so sánh exact, focus + route |
| MissYouPage | route allowed | close/back | orchestration, không chứa toàn bộ logic |
| DaysApartHero | start civil date | derived days | pure fn tested + two clocks |
| LoveLetterPanel | immutable raw letter | scrollTop only | không thay nội dung khi re-render |
| VinylPlayer | tracks thật, activeId | play/pause/seek/select | actual audio element + teardown |
| FloatingHeartPhotos | real photo metadata | open photo | heart SVG mask + alt |
| AutumnLeaves | density, reducedMotion | none | CSS-only / lightweight |
| AnimeBackdrop | local asset/fallback | none | contrast + image availability |

---

## 12. CODEx EXECUTION ROADMAP — CHI TIẾT TỪNG BƯỚC

> **Không bỏ qua bước kiểm kê để “coding luôn”.** Hoàn thành P0 và chạy tests trước khi thêm hiệu ứng P1. Sau mỗi phase cập nhật worklog. Khi có xung đột giữa tài liệu và source, ưu tiên convention source nhưng không phá requirement bất biến.

### PHASE 0 — Baseline & branch isolation

**Mục tiêu:** biết chính xác trạng thái repo và không làm mất công việc trước đó.

1. `pwd && git status --short && git branch --show-current && git log -1 --oneline`.
2. Kiểm tra files: `ls -la; find . -maxdepth 2 -type f \( -name 'AGENTS.md' -o -name 'README*' -o -name 'package.json' \)`.
3. Đọc `AGENTS.md` (nếu có), `.agent/`, package scripts, Angular config, angular routes, GitHub Pages workflow, media docs, test và worklog.
4. Kiểm tra Node: `node -v && npm -v`; **snapshot public repo ngày soạn** có `engines.node >=22.22.3`, Angular `^22.1.5`. Nếu môi trường Node cũ, nâng Node đúng theo project trước khi dùng `npm ci`; không sửa engines xuống 20 để né lỗi.
5. Nếu working tree có thay đổi chưa commit: **không xóa/ghi đè**. Tạo branch theo workflow của user/repo khi an toàn; nếu không thể branch, giữ nguyên và phân biệt file mình sửa.
6. Chạy baseline theo scripts thật:

```bash
npm ci
npm run check:scripts
npm test
npm run build:pages
# npm run test:e2e nếu có browser deps/runner sẵn
```

7. Ghi `BASELINE.md` vào worklog: command, exit code, lỗi có sẵn, test status và mọi thay đổi chưa commit.

**Done khi:** có sơ đồ repo + báo cáo baseline; biết chắc nơi lắp route, content, media.

### PHASE 1 — Audit toàn diện media, router, Home

1. Tìm folder/router: `rg --files src | sort` và `rg -n "Routes|provideRouter|RouterOutlet|routerLink" src`.
2. Tìm Home/current landing: component, template, style, design tokens, CTA/menu gốc; chụp screenshot baseline desktop/mobile.
3. Xác minh kho media: 

```bash
find . -type f \( -iname '*.mp3' -o -iname '*.m4a' -o -iname '*.aac' -o -iname '*.ogg' -o -iname '*.wav' -o -iname '*.flac' \) -not -path './node_modules/*'
find public src -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.webp' -o -iname '*.avif' -o -iname '*.heic' \) 2>/dev/null | head -100
rg -n "audio|playlist|track|memory-index|memories|media|asset" src public scripts docs
```

4. Đọc `scripts/generate-media-variants.mjs`, `scripts/generate-memory-index.mjs`, `scripts/prepare-static-host.mjs`, `scripts/verify-static-artifact.mjs` nếu có, hiểu `baseHref`/asset resolver và output.
5. Lập `ASSET_AUDIT` trong worklog: tên file thực tế, loại, size, có dùng được không, có quyền publish không, điểm xuất hiện, mapping đến feature.
6. Quyết định component & routing paths **dựa trên repo**; nêu mọi chỗ tái sử dụng và tránh code duplicate.

**Done khi:** không còn dùng đường dẫn asset giả, biết ảnh/nhạc nào thực sự hoạt động.

### PHASE 2 — Freeze thư và test bất biến

1. Copy `LOVE_LETTER_ORIGINAL.md` thành asset raw content theo convention sau audit.
2. So sánh byte SHA-256 trước và sau copy.
3. Implement letter loader hoặc import bundler phù hợp (HTTP get từ `assets` với base href chính xác, hoặc raw import nếu build hỗ trợ).
4. Viết unit test integrity: 30 dòng, 10,220 bytes UTF-8, hash chuẩn; chỉ cần kiểm tra cả hash + nội dung không blank.
5. Viết parser an toàn để bold đúng các đoạn có `**...**`; visual DOM text equal to source after stripping markup delimiter.
6. Test trên máy thật để emoji không thành `�`, font không bị mất dấu.

**Done khi:** content 100% khớp, render không hiện `**`, không có XSS/raw `innerHTML`.

### PHASE 3 — Days apart engine + test timezone

1. Tạo pure utility `getDaysApart(date)` dựa trên mốc 22/09/2026 và VN civil date (§5).
2. Test 0 ngày, ngày tiếp theo, 09/10 = 17, 10/10 = 18, ngày trước start, 23:59:59/00:00 VN, người xem ở Japan/US.
3. Tạo service/signal/observable quản lý timer và visibility; teardown đầy đủ.
4. Dựng `DaysApartHero` trong layout giữa, hiển thị mốc bắt đầu, số lớn, 2 clocks nhỏ, câu Nhật và dịch Việt.
5. Manual test đổi system clock mock; không lệch vì cấu hình máy ở Nhật.

**Done khi:** số đúng theo calendar day, update không reload, không memory leak.

### PHASE 4 — SecretGate and routing

1. Tạo trigger nhỏ trên Home **mà không thay cấu trúc Home**.
2. Dialog có text hints nhẹ, focus management, close, Enter handler, error state.
3. Exact compare `'HyeuQ'`, đặt in client code chỉ vì là surprise gate, không gọi đây là data security.
4. Unlock success → sessionStorage flag → Angular navigate route hint.
5. Guard redirect direct URL chưa unlock, prevent redirect loop, show return/back behavior.
6. Test mọi biến thể mật mã; kiểm tra refresh, tab mới, browser back/forward, GitHub Pages deep link.

**Done khi:** đúng route, không có bỏ qua gate vô tình từ UI; không phá navigation cũ.

### PHASE 5 — Dựng static layout 3 cột / mobile

1. Tạo page shell với background gradient fallback (chưa animation) và UI 3 vùng.
2. Dựng paper letter, center hero, player card — static placeholder **chỉ cho bố cục** (placeholder phải bỏ ngay khi tích hợp).
3. Implement CSS Grid desktop với `minmax(0,...)`; ở 1199/768/767 breakpoint dùng CSS theo visual test, không quá cứng.
4. Mobile hero → vinyl → letter, text letter tự cuộn với page.
5. Tune vertical sizes cho laptop 1366×768, desktop 1440×900, tablet 820×1180, phone 390×844 và 320×568.
6. Chạy screenshot diff với baseline Home, bảo đảm Home cũ không bị ảnh hưởng.

**Done khi:** không horizontal overflow, 3 vùng đúng, mobile đọc thư thuận tiện.

### PHASE 6 — Kết nối vinyl vào kho nhạc thật

1. Từ asset audit, tạo adapter track list (hoặc reuse existing music catalog). Nếu trống, giữ UI empty state và báo blocker.
2. Dùng một audio element/service; handle `play`, `pause`, `timeupdate`, `loadedmetadata`, `ended`, `error`, `canplay`.
3. Thêm vinyl quay theo actual state, controls, progress, time label, track list active.
4. Test file nhạc thật và URL resolve sau build GitHub Pages; phát nhạc sau user gesture.
5. Test khi mất file (404), audio codec không hỗ trợ, spam prev/next, seek đến cuối, navigate away.
6. Không tải nặng toàn bộ playlist, chỉ preload metadata/none.

**Done khi:** ít nhất một bài **thật** phát được nếu kho có bài; player không có fake-success UI.

### PHASE 7 — Heart photos đúng ảnh dự án

1. Chọn ảnh thực tế từ memory media index (có ngày chỉ nếu metadata thật).
2. Tạo SVG clipPath heart; crop cover + object position theo từng ảnh.
3. Đặt không che thư/counter/player, giảm mật độ theo responsive.
4. Lightbox có keyboard, touch, Escape, alt và focus return.
5. Lazy load/prefer existing optimized variants; no broken src.

**Done khi:** hiển thị tim rõ hình dạng, không mặt người bị crop lỗi hoặc ảnh méo.

### PHASE 8 — Anime Japan autumn backdrop

1. Đối chiếu asset nguồn; nếu chưa có, chốt mô tả art direction ở §9.4 và đánh dấu missing asset để người dùng bổ sung/tạo theo quyền sử dụng.
2. Tạo `<picture>` responsive với background fallback aesthetic.
3. Overlay contrast, darken 3 card backgrounds tùy vị trí, kiểm tra readability trên mobile tối.
4. Thêm light vignette/ambient fog nhẹ, tránh hiệu ứng nặng CPU.
5. Không phụ thuộc URL asset ngoài có thể CORS/404.

**Done khi:** scene anime mùa thu hòa hợp với thư và nhạc, background lỗi thì page vẫn đẹp.

### PHASE 9 — Lá thu, glow và motion

1. Tạo particle CSS transform/opacity, random fixed on mount.
2. Phân bố lá tránh cột thư, nút seek và text giữa.
3. Tạo reveal khi unlock; không chặn interactions và scrolling.
4. Có `prefers-reduced-motion` / `@media`; tùy chọn toggle nếu UX hợp lý.
5. Test Chrome Android, iPhone Safari, desktop; nếu FPS giảm thì giảm particle/disable blur, không thêm lib nặng.

**Done khi:** có chiều sâu mùa thu nhưng không đánh đổi chữ dễ đọc / hiệu năng.

### PHASE 10 — Accessibility, responsive, performance hardening

1. Test keyboard complete: mở gate, nhập, submit, Escape, play/pause, list tracks, photo lightbox, quay về Home.
2. Test screen reader: headings hierarchy, labels, alt, decorative aria-hidden, live region chỉ dùng cho lỗi/unlock, **không aria-live mỗi giây audio**.
3. Reduced motion: disable leaves/vinyl/reveal hoặc hiển thị static vinyl khi playing, giữ tất cả controls.
4. Test portrait/landscape, OS zoom 200%, dynamic viewport, long letter, scrollbar.
5. Lighthouse hoặc tương đương: kiểm tra CLS/LCP/INP, ảnh backdrop quá lớn, layout thrash; ghi kết quả thực đo, không hứa số tùy ý.
6. Đảm bảo không leak thư/route content qua `console.log` hoặc telemetry. Nhưng lưu ý **bundle public vẫn public**.

**Done khi:** đạt checklist A11Y/RESP/PERF và không có critical regression.

### PHASE 11 — Tests, CI, GitHub Pages artifact

1. Chạy lần lượt:

```bash
npm run check:scripts
npm test
npm run build:pages
npm run verify:artifact
npm run test:e2e
```

2. Nếu repo chỉ chuẩn bị `npm run verify:artifact` sau build, tuân thủ thứ tự script sẵn có.
3. Viết Playwright e2e thực tế:
   - Home cũ vẫn render.
   - Secret gate mở, code sai báo lỗi, code đúng sang `/hint/miss-you`.
   - Hiển thị `18 ngày` khi mock date ngày 10/10/2026 VN.
   - Đọc đủ đoạn **đầu**, **giữa**, **cuối** thư; verify bold & emoji.
   - Test player bằng file nhạc thật và mock media promise nếu headless codec thiếu, phân biệt integration test và mocked unit test.
   - Gallery heart mask visible + mở/đóng lightbox.
   - Responsive 390×844 + 1440×900 không che nhau, no horizontal overflow.
   - Reduced motion branch.
   - Direct route without unlock redirected, refresh after unlock works.
4. Local production preview với subpath của Pages; đảm bảo audio/ảnh/letter fetch URL không có 404 và router fallback hiện hữu hỗ trợ deep link.
5. CI: cập nhật workflow chỉ khi cần để bổ sung tests; không gây regression old pipeline.

**Done khi:** có exit codes, output logs, screenshots/snapshot như bằng chứng.

### PHASE 12 — Final QA, documentation, report

1. `git diff --check`, review từng file, không file thừa/secret/untracked asset bất thường.
2. Đối chiếu màn hình trực tiếp với wireframe, nội dung thực, viewport, thiết bị.
3. Worklog có: kiến trúc chọn, asset inventory, routes, state machine, thư checksum, test commands, screenshots, unresolved issues.
4. Report cuối cho Hùng bằng tiếng Việt:
   - File đã thay đổi, các route/cách mở trang;
   - Các chức năng đã chạy **thật**;
   - Kho nhạc/ảnh đã gắn từ file nào;
   - Test nào PASS/FAIL/SKIP và vì sao;
   - URL local + build artifact output **đúng theo thực tế**;
   - Cảnh báo static gate không bảo vệ dữ liệu riêng tư;
   - Những đầu việc còn thiếu (nếu có) và câu lệnh chạy/deploy tiếp.
5. Chỉ nói “hoàn thành 100%” khi toàn bộ P0/P1 liên quan asset đã có và đã được test; nếu kho nhạc/ảnh thiếu, báo trạng thái PARTIAL và nguyên nhân minh bạch.

---

## 13. MA TRẬN KIỂM THỬ / ACCEPTANCE CRITERIA

| ID | Scenario | Expected | Mức |
|---|---|---|---|
| AC-01 | Home như cũ | Route/ảnh/nav cũ không regress | BLOCKER |
| AC-02 | Gate input `HyeuQ` | Mở hint | BLOCKER |
| AC-03 | Gate input sai hoa thường hoặc có space | Không mở | BLOCKER |
| AC-04 | Keyboard Enter/Escape | Submit/close đúng | P0 |
| AC-05 | Direct URL chưa unlock | Về gate/Home | P0 |
| AC-06 | Mốc 22/09/2026 | Hiện 0 | BLOCKER |
| AC-07 | Mock 09/10/2026 ở VN | 17 | BLOCKER |
| AC-08 | Mock 10/10/2026 ở VN | 18 | BLOCKER |
| AC-09 | Mở tab tại Nhật 00:10 JST nhưng VN ngày hôm trước | Ngày theo VN, không lệch | BLOCKER |
| AC-10 | Tab mở qua midnight VN | Auto-update | P0 |
| AC-11 | Letter compare checksum | Không sai 1 byte nào | BLOCKER |
| AC-12 | Bold segments trong thư | Đúng đoạn, không hiện `**` | BLOCKER |
| AC-13 | Đầu/giữa/cuối letter | Đủ và có thể scroll hết | BLOCKER |
| AC-14 | Track file thật | Phát, pause, seek, ended | BLOCKER nếu có nhạc |
| AC-15 | Audio missing/reject | Báo lỗi thành thật | P0 |
| AC-16 | Vinyl animation | Quay khi đang playing thật | P1 |
| AC-17 | Bấm image trái tim | Mask + lightbox accessible | P1 nếu có ảnh |
| AC-18 | Background anime thiếu file | Fallback đẹp, UI không vỡ | P0 |
| AC-19 | Lá rơi và layered glow | Không che nội dung | P1 |
| AC-20 | prefers-reduced-motion | Không animation cưỡng bức | BLOCKER |
| AC-21 | Viewport 320–1440 px | Không cuộn ngang/đè nút | BLOCKER |
| AC-22 | GitHub Pages subpath `/hung-quynh-our-story/` | Route/assets chạy | BLOCKER |
| AC-23 | Build/test CI hiện có | Không regression | BLOCKER |
| AC-24 | Không console/analytics thu thập letter | Không leak thêm qua telemetry | P0 |
| AC-25 | User bật nhạc chủ động | Không tự phát có tiếng | P0 |
| AC-26 | Câu Nhật | Chính xác `僕はずっと君だけを愛してる` | P0 |
| AC-27 | Nút trở về / browser back | Không mất navigation | P0 |
| AC-28 | Audio controls trên mobile | Chạm được và có labels | P0 |
| AC-29 | Font tiếng Việt, Nhật, emoji | Không rơi dấu/missing glyph | P0 |
| AC-30 | Worklog + asset audit + report cuối | Có bằng chứng test | BLOCKER |

**Ưu tiên sửa:** Blocker → P0 → P1 → P2. Không dồn lỗi blocker sang phần “cần cải thiện sau” mà báo là done.

---

## 14. CHÍNH SÁCH RIÊNG TƯ VÀ TRIỂN KHAI

**Điểm đặc biệt quan trọng:** Hùng muốn trang bí mật, nhưng website công khai trên GitHub Pages **không thể giữ kín tuyệt đối bức thư hoặc ảnh được commit vào repo/public dist** chỉ nhờ câu `HyeuQ`. Router guard và `sessionStorage` chỉ giúp tránh việc **vô tình mở trang**, không chống việc xem source hoặc tải asset. Vì vậy:

- Để có **bất ngờ riêng**: gate client-side như thiết kế là phù hợp.
- Để có **riêng tư thực sự**: cần đăng nhập server-backed, lưu thư/audio/ảnh trong storage private, chỉ trả dữ liệu sau khi server authorize; không đặt mật mã thật trong bundle. Đây là **option tách riêng**, không tự mở rộng backend nếu chủ dự án chưa yêu cầu.
- Nếu ảnh gốc/địa điểm/metadata EXIF tiết lộ thông tin riêng: cân nhắc loại bỏ EXIF và chỉ publish ảnh đã được cả hai đồng ý chia sẻ.
- Không expose Drive OAuth token, env secrets, Supabase service-role keys, personal access tokens.

---

## 15. CÂU LỆNH KHỞI ĐỘNG DÀNH CHO CODEX

Sau khi sao chép tài liệu này vào `docs/BD/HUNG_QUYNH_MISS_YOU_CODEX_PLAN.md` và đặt `LOVE_LETTER_ORIGINAL.md` ở root dự án hoặc đường dẫn Codex đọc được, có thể đưa prompt sau vào Codex:

```text
Bạn là Codex đang làm việc trực tiếp trên repository hung-quynh-our-story.
BẮT BUỘC đọc TOÀN BỘ tài liệu docs/BD/HUNG_QUYNH_MISS_YOU_CODEX_PLAN.md
và file LOVE_LETTER_ORIGINAL.md (nếu có). Không bỏ qua Phụ lục A.

Mục tiêu: triển khai FULL secret miss-you page vào Angular hiện có đúng PHASE 0–12,
không thay thế các trang cũ, không tạo repo mới, không sửa dù một ký tự của thư.

Chạy baseline, kiểm kê assets thật, đọc router/playlist/media pipeline thật;
triển khai gate case-sensitive HyeuQ trên Home, route hint, bộ đếm theo VN,
thư nguyên văn ở trái, vinyl phát nhạc dự án thật ở phải,
ảnh trái tim, anime phố Nhật mùa thu, lá rơi, câu tiếng Nhật.

Phân tách P0/P1/P2. Đừng giả lập tính năng đã hoàn thành.
Tự viết/chạy unit và Playwright e2e, npm run build:pages, verify artifact.
Ghi worklog, screenshot proof, bảng PASS/FAIL/SKIP và file thay đổi.

Không dừng ở mức tạo skeleton hoặc demo có nút giả.
Nếu thiếu asset, dùng fallback có chủ đích, báo rõ file thiếu và hoàn thiện
mọi phần có thể hoàn thiện. Không tự ý push/deploy.
```

---

## PHỤ LỤC A — BỨC THƯ GỐC, BẤT BIẾN (TRÍCH XUẤT NGUYÊN VĂN)

> **Codex:** Toàn bộ nội dung giữa hai marker `<!-- LETTER_BEGIN -->` và `<!-- LETTER_END -->` ở dưới là tác phẩm gốc của Hùng, phải giữ chính xác. Marker và code fence bao quanh KHÔNG thuộc nội dung thư. File `LOVE_LETTER_ORIGINAL.md` đi kèm là nguồn byte chính xác và tiện copy nhất.

<!-- LETTER_BEGIN -->

```markdown
Vợ iu ơiiii! 🥺❤️
Bây giờ là 2h sáng rùiii, mà chồng vẫn cứ nhớ vợ iu da diết thuiii. Chồng nhớ em, nhớ vợ iu của chồng nhiều lắm ý! 🥹
Vợ iu ơi, chồng biết rằng ở bên Nhật, có những lúc vợ cũng buồn, cũng tủi thân và cô đơn lắm đúng khum? Nghĩ đến cảnh vợ phải một mình ở nơi xa lạ, chồng cứ thấy thương thương vợ vô cùng. Vợ iu của chồng cố lên nhóoo! Chồng biết em bé của chồng đang cố gắng rất nhiều, và chồng thương những cố gắng ấy lắm lắm lun á. ❤️
Chồng ở nhà cũng siu siu nhớ vợ, chồng yêu vợ nhắm! Nhiều khi chồng cũng chỉ muốn được vợ iu thương thương, được vợ dỗ dành, được nhõng nhẽo với vợ một xíu thui. Nhưng mà chúng mình cứ lệch nhau về giờ giấc sinh hoạt, thành ra có những lúc chồng thấy bùn lém, siu siu bùn lun á. 🥺
Vợ biết khum, điều khiến chồng buồn nhất không phải là khoảng cách xa xôi giữa Việt Nam và Nhật Bản đâu, mà là những lúc cả hai cùng nhớ nhau, cùng cần nhau, nhưng lại chẳng thể ở bên nhau ngay lúc ấy. Mỗi khi vợ cần được yêu thương, chồng lại đang cuồng quay với công việc. Còn mỗi khi chồng nhớ vợ đến phát khóc, muốn được vợ ôm ôm, thương thương một chút thì vợ lại bận mất tiu rùi. Cứ như thế, hai đứa mình thương nhau nhiều ơi là nhiều, nhưng đôi khi lại chẳng kịp trao cho nhau những yêu thương mà cả hai đang cần. Nghĩ đến thui là chồng thấy nghẹn nghẹn trong lòng rùi. 🥹
Vợ iu ơi! Có một điều mà chồng muốn kể cho vợ nghe nữa nè.
Cứ mỗi lần vợ iu đi ra ngoài ý, là trong lòng chồng lại có biết bao nhiêu nỗi lo lun.
**Đầu tiên là chồng lo cho sự an toàn của vợ.** Chồng lo vợ đi đường có cẩn thận khum, có bị lạc khum, có gặp chuyện gì khiến vợ sợ hãi hay tủi thân khum. Tại vì từ trước đến giờ, em bé của chồng vẫn luôn được chồng và má yêu thương, chăm bẵm, chiều chuộng từng chút một. Vậy mà bây giờ, cô vợ bé bỏng của chồng lại phải tự mình lo cái ăn, cái mặc, tự chăm sóc bản thân, tự làm mọi thứ ở một đất nước xa lạ.
Chồng biết đó là một phần của sự trưởng thành, chồng cũng muốn vợ ngày càng mạnh mẽ, tự lập hơn. Nhưng mà biết là một chuyện, còn thương vợ lại là một chuyện khác cơ. Chồng cứ nghĩ đến cảnh vợ phải tự xoay xở mọi thứ là lòng chồng lại thương em đến lạ. Giá mà chồng có thể ở đó, nấu cho vợ một bữa cơm, đưa vợ đi học, đón vợ về nhà, hay đơn giản chỉ là ôm vợ thật chặt sau một ngày dài mệt mỏi thui cũng được. Chồng chỉ ước mình có thể chăm sóc vợ nhiều hơn một chút, để em bé của chồng chẳng bao giờ phải cảm thấy cô đơn. 🥺❤️
**Thứ hai là chồng ghen đóooo!** Huhu, chồng ghen nhắm lun ý. Chồng cứ nghĩ đến chuyện vợ đi ra ngoài, có nhiều người để ý, có người muốn làm quen, muốn chen chân vào thế giới nhỏ của hai đứa mình là chồng lại thấy khó chịu rùi. Chồng công nhận chồng là một con người siu siu hay ghen lun á. Nhiều khi chỉ cần thấy vợ đi chơi hay nói chuyện thân thiết với người khác giới thui là trong lòng chồng đã có một chút gì đó bùn bùn, tủi tủi, ghen ghen rùi.
Có lẽ vì chồng yêu vợ nhiều quá, thương vợ từ tận đáy lòng nên đôi khi chồng cứ sợ mất đi người con gái mà mình trân trọng nhất. Chồng biết yêu thương không có nghĩa là giữ vợ cho riêng mình hay khiến vợ phải dè chừng mỗi khi ra ngoài. Chồng muốn vợ được vui vẻ, được tự do, được có những người bạn tốt và những kỷ niệm đẹp ở Nhật Bản cơ. Chỉ là đôi khi trái tim chồng ích kỷ một xíu, cứ muốn mình mãi là người đặc biệt nhất trong lòng vợ thuiii. 🥹
Chồng sẽ cố gắng học cách yêu vợ thật dịu dàng, để những cơn ghen của chồng không trở thành áp lực cho em. Nhưng mà vợ phải biết là chồng siu siu yêu vợ đó nhó! ❤️
**Thứ ba là chồng lo cho sức khỏe của vợ iu.** Thời tiết bên Nhật khác Việt Nam nhiều lắm, rồi những ngày trời trở lạnh, những hôm mưa gió, những lúc vợ bận học mà quên ăn, quên nghỉ... chồng nghĩ đến là lại xót xa. Vợ iu nhớ ăn uống đầy đủ, mặc thật ấm, ngủ thật ngoan và chăm sóc bản thân thật tốt nhóoo. Chồng không ở cạnh để nhắc vợ từng chút như trước được nên em bé phải thay chồng thương lấy bản thân mình nữa đó. Vợ mà ốm là chồng xót lắm, thương lắm lun á. 🥺
Vợ có biết khummm, từ ngày vợ sang Nhật, có những lúc chồng ở nhà cứ thấy lòng mình trống trải lạ thường. Vẫn căn phòng ấy, vẫn công việc ấy, vẫn những điều quen thuộc ấy, nhưng hình như mọi thứ đều thiếu đi một chút gì đó. Mà cái một chút ấy lại chính là người con gái chồng yêu nhất trên đời.
Đôi khi chồng nhớ vợ nhiều quá, lại tự hỏi: "Liệu mình nhớ vợ nhiều đến thế này, vợ có đang nhớ mình như vậy khum nhỉ? Vợ có đang nghĩ đến mình khum? Có muốn được mình ôm như mình đang muốn ôm vợ khum?"
Rồi chồng nhắn tin cho vợ, chờ mãi chẳng thấy vợ rep, thế là cái đầu ngốc nghếch của chồng lại bắt đầu nghĩ linh tinh. Chồng biết vợ còn có việc học, có cuộc sống riêng, có những lúc mệt mỏi và chẳng thể cầm điện thoại được. Chồng hiểu hết mà, nhưng mà đôi khi trái tim lại chẳng chịu nghe lời lý trí gì cả. Nó cứ nhớ, cứ mong, cứ đợi, rồi lại tự làm mình buồn thui. 🥹
Có những hôm chồng thấy mình dễ cáu, dễ tủi thân, dễ bực mình với cả thế giới. Chắc tại chồng thương vợ nhiều quá mà chẳng biết phải đặt hết những yêu thương ấy vào đâu. Chồng cứ muốn dành tất cả sự dịu dàng, ấm áp và ngọt ngào nhất của mình cho vợ, muốn được ôm vợ vào lòng rồi thủ thỉ kể cho vợ nghe biết bao nhiêu điều.
Nhưng mà vợ iu ơi, chồng không muốn tình yêu của chồng trở thành gánh nặng của vợ đâu. Chồng chỉ muốn vợ hiểu rằng, ở Việt Nam này, có một người chồng ngốc nghếch vẫn đang yêu em rất nhiều, nhớ em rất nhiều và luôn hướng trái tim mình về phía em.
Chồng thương vợ không chỉ vì những lúc vợ đáng yêu, vui vẻ, hay những khi vợ ngọt ngào với chồng. Chồng thương cả những lúc vợ mệt mỏi, cáu kỉnh, những ngày vợ chẳng muốn nói chuyện với ai, những khi vợ yếu lòng và chỉ muốn khóc. Chồng thương tất cả những điều thuộc về em, kể cả những điều mà chính em đôi khi còn chẳng yêu nổi ở bản thân mình.
Chồng biết quãng thời gian xa nhau này sẽ chẳng dễ dàng với cả hai đứa. Sẽ có những ngày mình nhớ nhau đến phát khóc, những ngày giận dỗi vì chẳng hiểu nhau, những lúc chỉ ước có thể bỏ hết mọi thứ để chạy đến ôm người kia một cái.
Nhưng vợ iu à, **chồng mong rằng dù có những ngày chẳng thể ở cạnh nhau, chúng mình vẫn luôn cảm nhận được rằng mình có nhau.** Chẳng cần lúc nào cũng phải nhắn tin, chẳng cần lúc nào cũng phải nói những lời ngọt ngào. Chỉ cần trong lòng hai đứa vẫn luôn có một vị trí đặc biệt dành cho nhau, vẫn luôn muốn kể cho nhau nghe những chuyện nhỏ nhặt mỗi ngày, vẫn luôn chọn thương nhau ngay cả những lúc mệt mỏi nhất, là chồng đã thấy hạnh phúc lắm rùi.
Chồng không biết sau này sẽ còn phải trải qua bao nhiêu đêm nhớ vợ như đêm nay nữa. Nhưng chồng biết một điều, rằng nếu người ở cuối chặng đường vẫn là em, thì chồng nguyện cố gắng thật nhiều, đợi chờ thật lâu, và yêu em thật dịu dàng.
Chồng chỉ mong sau tất cả những tháng ngày xa cách này, sẽ có một ngày vợ trở về, chồng được chạy đến ôm em thật chặt, được hôn lên trán vợ, được nghe vợ gọi "chồng ơiii" ngay bên tai chứ chẳng phải qua màn hình điện thoại nữa.
Rồi chồng sẽ ôm vợ thật lâu, lâu đến mức bù lại được tất cả những cái ôm mà chúng mình đã bỏ lỡ. 🥹❤️
**Vợ iu ơi, em cứ yên tâm học tập, khám phá thế giới và sống thật hạnh phúc nhó. Chồng ở đây vẫn sẽ cố gắng mỗi ngày, để sau này có thể cho em một mái nhà thật ấm áp, một cuộc sống thật đủ đầy và một tình yêu mà em chẳng bao giờ phải hoài nghi.**
Chồng nhớ vợ lắm.
Chồng thương vợ lắm.
Và chồng yêu vợ, siu siu siu nhiều lun áaaa! ❤️
Ngủ ngon nhó, em bé của chồng. Dù chúng mình đang ở hai đất nước khác nhau, nhưng khi vợ nhìn lên bầu trời, hãy nhớ rằng ở một nơi nào đó dưới cùng bầu trời ấy, có một người vẫn luôn thương em bằng tất cả trái tim mình.
**Chồng yêu Quỳnh của chồng nhắm nhắm nhắm! Mãi là em bé được chồng thương nhóooo!** 🥺💕
```

<!-- LETTER_END -->

---

## 16. ĐỊNH NGHĨA HOÀN TẤT (DEFINITION OF DONE)

Tính năng được chấp nhận khi cả 4 mệnh đề đúng:

1. **Cảm xúc:** Nhật Bản mùa thu, thư dài nguyên văn, số ngày là tiêu điểm, âm nhạc và ảnh tạo cảm giác gần nhau chứ không rối mắt.
2. **Tính đúng:** ngày lịch VN đúng, gate đúng ký tự, audio phát thật, asset ảnh không 404, chữ Nhật đúng, không sai một ký tự thư.
3. **Kỹ thuật:** không phá code cũ, GitHub Pages subpath và direct route đúng, responsive/a11y/reduced motion, test thực chạy.
4. **Bàn giao:** diff sạch, worklog, danh sách assets, bằng chứng kiểm thử, cảnh báo giới hạn bảo mật, báo cáo trạng thái trung thực.

> **Lời nhắc cuối cho Codex:** Đây không phải một dashboard; đây là lá thư của một người chồng gửi người mình yêu. Hãy dùng kỹ thuật để phục vụ cảm xúc, không dùng hiệu ứng để che cảm xúc. ❤️
