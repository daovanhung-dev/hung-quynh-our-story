# H ♡ Q — UI Redesign 2026

## Mục tiêu

Nâng cấp toàn bộ giao diện `hung-quynh-our-story` theo một ngôn ngữ thống nhất: **Romantic Editorial Scrapbook**.

Bản triển khai này cố ý **không thay đổi**:

- Angular routes.
- `MemoryService` và dữ liệu generated.
- `memories.generated.ts`.
- Birthday Journey state machine.
- Hidden long-press Easter eggs.
- Media pipeline HEIC/WebP/video.
- Love Treasure audio/player logic.
- Các selector/chức năng quan trọng đang được Playwright dùng.

## Design system

### Palette

- Paper: `#F7F1E9`
- Paper Deep: `#EEE1D5`
- Surface: `#FFFDFB`
- Ink: `#24191C`
- Wine: `#7B3549`
- Rose: `#C9798B`
- Champagne: `#D5B47C`
- Night: `#130A0F`
- Japan Indigo: `#35485C`
- Japan Vermilion: `#A84B43`

### Hướng thiết kế

- Editorial typography.
- Ảnh là nội dung chính.
- Card có cảm giác giấy/polaroid nhưng không quá cute.
- Animation chỉ hỗ trợ storytelling.
- Mobile-first; touch target lớn và scroll-snap khi phù hợp.
- Mỗi feature có accent riêng nhưng vẫn giữ DNA H ♡ Q.

## View được redesign

### App shell

- Header thành floating capsule nhỏ gọn.
- Active navigation rõ ràng hơn.
- Mobile giữ navigation quen thuộc để không phá hành vi/E2E nhưng giảm chiều cao và tăng khả năng bấm.

### Home / Birthday Home

- Hero cinematic dạng editorial collage.
- Relationship counter chuyển thành information strip thay vì chiếm gần toàn màn hình.
- Gift index từ list chuyển thành 2×2 editorial cards; mobile dùng horizontal scroll-snap.
- 12 reasons thành paper-note cards với tape detail nhẹ.
- Wish/Cake/Finale dùng cùng dark wine visual system.

### Birthday Celebration

- Giảm số ảnh bay đồng thời.
- Loại floating hearts khỏi foreground.
- Giữ fireworks/confetti nhưng giảm cường độ.
- CTA và typography rõ hierarchy hơn.

### Gift Reveal

- Scene giống gói quà trên scrapbook hơn.
- Hộp quà bớt cảm giác toy/CSS-demo.
- Giữ hidden long-press interaction.

### Envelope + Letter

- Tăng depth cho wax seal.
- Paper/letter có shadow và reading width hợp lý hơn.
- Letter body thoáng, đọc tốt trên mobile.

### Birthday Cake

- Tone tối giản hơn, bớt toy-like.
- Candle/cake vẫn giữ interaction hiện tại.

### Timeline

- Giữ `TimelinePage` làm hero duy nhất, ẩn heading trùng trong `TimelineComponent` về mặt thị giác.
- Month index thành sticky capsule rail.
- Layout memory ổn định: featured memory full width, sau đó 2 cột desktop / 1 cột mobile.
- Bonus memories và CTA cuối trở thành editorial surfaces.

### Memory Card

- Ảnh bo góc + subtle shadow.
- Cả ảnh/card vẫn giữ navigation hiện tại.
- Ẩn CTA lặp `Mở ngày hôm ấy` để giảm noise.

### Memory Detail

- Loại random ambient strip về mặt thị giác để narrative tập trung vào đúng ngày đang xem.
- Photo essay dùng grid/width ổn định hơn.
- Previous/next memory trở thành navigation cards.

### Photo Viewer

- Dark cinematic lightbox.
- Controls tròn, glass nhẹ, 44–48px touch target.
- Giữ keyboard, swipe, focus restoration, video support.

### Japan Notes

- Không còn cảm giác là một microsite tách biệt.
- 80% dùng H ♡ Q palette, Nhật Bản chỉ là accent Indigo/Vermilion.
- Chapter trở thành postcard/travel-note cards.

### Love Treasure

- Giảm galaxy/orbit/star intensity.
- Tối đa 10 ảnh active desktop, 6 ảnh mobile ở layer hiển thị.
- Ẩn vinyl lớn để ảnh vẫn là nhân vật chính.
- Music panel thành compact bottom dock; bỏ tính draggable về mặt UX (logic cũ vẫn còn, không phá code).
- Playlist/volume/stream controls được ẩn trong bản visual tối giản; playback cơ bản, progress và return-to-letter vẫn giữ.
- Selected memory panel trở thành floating glass card ở center bottom.

### 404

- Chuyển thành lost-album card đồng bộ với paper/polaroid system.

## Cách tích hợp

File mới:

```text
src/styles/redesign.scss
```

`angular.json` đã được cập nhật:

```json
"styles": [
  "src/styles.scss",
  "src/styles/redesign.scss"
]
```

Do redesign được load sau stylesheet gốc, rollback rất dễ: chỉ cần bỏ dòng `src/styles/redesign.scss` khỏi `angular.json`.

## Checklist sau khi copy vào repo gốc

```bash
npm ci
npm run prepare:media
npm run validate:memories
npm run generate:memories
npm test
npm run test:e2e
npm run build
```

Sau đó kiểm tra mobile ở 360/390/430 px và desktop ở 1280/1440 px.
