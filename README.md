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

### Thay đổi giao diện mới
- Có hiệu ứng chào mừng bằng pháo hoa trên nền đen khi vừa vào website.
- Timeline được đổi sang phong cách **theo tháng + thanh ảnh ngang kéo vuốt**.
- Mỗi tháng có heading lớn cố định ở trên cùng, chỉ thay đổi khi chuyển sang tháng khác.
- Trên desktop, mỗi thanh ngang hiển thị khoảng **5 ảnh / lần nhìn**.
- Có nút kéo trái phải và hỗ trợ kéo chuột / vuốt tay.
- Trang chủ có thêm phần gợi ý chức năng và dải ảnh gần đây.

# hung-quynh-our-story
