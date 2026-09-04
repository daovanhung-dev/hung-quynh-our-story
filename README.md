# Hùng ♡ Quỳnh — Our Story

Static Angular website dùng để lưu ảnh, video và kỷ niệm theo dòng thời gian.

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
- Thumbnail/medium được tạo trong `public/images/generated/` khi chạy build và không commit vào Git.
- Media không có ngày EXIF không bị gán ngày giả; chúng xuất hiện ở mục riêng ngoài timeline.

## Giao diện hiện có

### Birthday Journey
- Lần đầu mở `/` trong một browser session sẽ đi qua ba bước: pháo hoa nền đen, phong thư tình và nội dung lá thư.
- Nút chuyển bước là thao tác thủ công; có thể bỏ qua để đi thẳng tới timeline.
- Ảnh preview trong màn pháo hoa dùng thumbnail và chạy theo cửa sổ nhỏ để tránh tải đồng thời toàn bộ ảnh.
- Sau khi hoàn tất, `/` mở thẳng timeline. Route `/birthday` dùng để xem lại lời chúc.

### Timeline và album
- Timeline giữ phong cách **theo tháng + thanh ảnh ngang kéo vuốt**, với khoảng 5 ảnh mỗi lần nhìn trên desktop.
- Có điều hướng tháng, nút kéo trái phải, kéo chuột và vuốt tay.
- Trang detail, photo viewer, header, footer và 404 dùng chung phong cách giấy kem, mực nâu, burgundy và champagne.
- Photo viewer hỗ trợ nút điều hướng, phím mũi tên, Escape và swipe trên mobile.

# hung-quynh-our-story
