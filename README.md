# Hùng ♡ Quỳnh — Our Story

Một photo essay tĩnh bằng Angular, lưu những ngày kỷ niệm theo nhịp editorial nhẹ nhàng.

## Kiến trúc

```text
Media trong source
  ↓
scripts/migrate-memory-images.mjs (khi source chưa theo ngày)
  ↓
scripts/generate-media-variants.mjs
  ↓
scripts/generate-memory-index.mjs
  ↓
memories.generated.ts
  ↓
Angular static app
  ↓
dist/our-story
```

Không backend. Không database. Không API key.

## Yêu cầu môi trường

- Node.js `>= 22.22.3`
- npm

Project dùng Angular 22.x và TypeScript 6.0.x.

## Cài đặt

```bash
npm install
```

## Chạy local

```bash
npm start
```

## Thêm ảnh

Tạo:

```text
public/images/memories/2026/09/04/
```

và đặt ảnh vào đó. Metadata là optional.

Xem hướng dẫn chi tiết:

```text
docs/ADD_MEMORY.md
```

Nếu source đang ở dạng `YYYY-MM`, chạy migration trước:

```bash
npm run migrate:memories
npm run migrate:memories -- --apply
```

Media không có ngày chắc chắn sẽ nằm trong mục “Ảnh thêm — chưa xác định ngày”.

## Build production

```bash
npm run build
```

Build cho GitHub Pages:

```bash
npm run build:pages
```

Output:

```text
dist/our-story/
```

## GitHub Pages

Workflow đã có tại:

```text
.github/workflows/deploy-pages.yml
```

Sau khi push lên branch `main`, bật GitHub Pages ở chế độ **GitHub Actions**.

## Quyền riêng tư

Đây vẫn là static website. Nếu deploy public, người biết URL vẫn có thể truy cập ảnh. `noindex,nofollow` chỉ giúp hạn chế indexing, không phải cơ chế bảo mật.


## Ghi chú media

- JPG, JPEG, PNG, WebP, AVIF, GIF, HEIC và MP4 được nhận diện.
- HEIC giữ bản gốc và được tạo bản WebP để browser hiển thị.
- MP4 hiển thị bằng native video, không autoplay và không transcode.
- Mỗi ảnh sinh WebP `480 / 960 / 1440` và manifest kích thước trong `public/images/generated/` khi build; các file này không commit vào Git.
- Artifact GitHub Pages chỉ có WebP generated. JPG/PNG/HEIC gốc vẫn là source build và bị loại khỏi deploy.
- Media không có ngày EXIF không bị gán ngày giả; chúng xuất hiện ở mục riêng ngoài timeline.

## Giao diện hiện có

### Birthday Journey
- Lần đầu mở `/` trong một browser session sẽ đi qua ba bước: prologue tĩnh có tối đa ba ảnh, phong thư tình và nội dung lá thư.
- Nút chuyển bước là thao tác thủ công; có thể bỏ qua để đi thẳng tới timeline.
- Không có canvas, pháo hoa, parallax hay animation nền lặp vô hạn; Reduced Motion hiển thị ngay state cuối.
- Sau khi hoàn tất, `/` mở thẳng timeline. Route `/birthday` dùng để xem lại lời chúc.

### Timeline và album
- Timeline nhóm theo chương tháng, một card cho mỗi ngày; archive chỉ mount media khi mở.
- Trang detail là photo essay tuần tự với ảnh rộng/dọc theo tỷ lệ thật, vì vậy không nhảy layout khi ảnh đến.
- Gallery dùng native `<dialog>`, hỗ trợ focus trap, Escape, phím mũi tên, swipe và trả focus về thumbnail.
- Chạy `npm test` cho scanner/manifest; chạy `npm run test:e2e` để kiểm tra desktop và viewport mobile 390px.

# hung-quynh-our-story
