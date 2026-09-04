# Init Scope

Starter này đã dựng phần khung để tiếp tục implementation theo BD:

- Angular standalone architecture.
- Static-only, không backend/database.
- Home/Hero.
- Timeline theo năm.
- Memory card.
- Memory detail.
- Fullscreen photo viewer.
- Keyboard previous/next/ESC.
- Mobile swipe trong viewer.
- Reveal-on-scroll bằng IntersectionObserver.
- `prefers-reduced-motion`.
- Memory generator từ thư mục ảnh/video.
- Migration media theo EXIF từ `YYYY-MM` sang `YYYY/MM/DD`.
- HEIC WebP variants và MP4 native viewer.
- Validation metadata/path/duplicate ID.
- GitHub Pages SPA fallback (`404.html`).
- GitHub Pages workflow.
- Empty state, mục media chưa xác định ngày và 404 page.

## Chưa nằm trong init

Các phần dưới đây nên làm ở phase tiếp theo thay vì nhồi vào starter:

- OpenGraph động cho từng memory.
- PWA/offline cache.
- Map/music/video/tag/search.
- Password/access gateway.
