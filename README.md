# Hùng ♡ Quỳnh — Our Story

Static Angular website dùng để lưu ảnh và kỷ niệm theo dòng thời gian.

## Kiến trúc

```text
Ảnh trong source
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

## Build production

```bash
npm run build
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


## Cập nhật 2026-09-04

### Thay đổi giao diện mới
- Có hiệu ứng chào mừng bằng pháo hoa trên nền đen khi vừa vào website.
- Timeline được đổi sang phong cách **theo tháng + thanh ảnh ngang kéo vuốt**.
- Mỗi tháng có heading lớn cố định ở trên cùng, chỉ thay đổi khi chuyển sang tháng khác.
- Trên desktop, mỗi thanh ngang hiển thị khoảng **5 ảnh / lần nhìn**.
- Có nút kéo trái phải và hỗ trợ kéo chuột / vuốt tay.
- Trang chủ có thêm phần gợi ý chức năng và dải ảnh gần đây.

### Source ảnh đã được đính kèm
Do môi trường hiện tại chưa giải nén trực tiếp được file 7z, mình đã đính kèm archive vào dự án tại:

```text
incoming-archive/source-images.7z
```

Nếu muốn website hiển thị ảnh trực tiếp, hãy giải nén archive này trên máy của bạn rồi đưa ảnh vào đúng cấu trúc:

```text
public/images/memories/YYYY/MM/DD/
```

Sau đó chạy lại:

```bash
npm run generate:memories
npm run build
```
# hung-quynh-our-story
