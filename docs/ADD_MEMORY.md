# Thêm kỷ niệm mới

## 1. Tạo thư mục theo ngày

```text
public/images/memories/YYYY/MM/DD/
```

Ví dụ:

```text
public/images/memories/2026/09/04/
```

## 2. Copy ảnh hoặc video

```text
001.webp
002.webp
003.webp
clip.mp4
```

Định dạng hỗ trợ: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.heic`, `.heif`, `.mp4`.

HEIC được giữ bản gốc và chuyển thành WebP khi chạy `npm run prepare:media`. MP4 được phát native trong viewer.

## 3. Metadata là tùy chọn

Nếu không có `metadata.json`, hệ thống tự dùng ngày làm ID, ảnh đầu tiên làm cover và hiển thị toàn bộ ảnh.

Nếu muốn title/caption/location/cover riêng, copy mẫu từ:

```text
examples/metadata.example.json
```

vào thư mục ngày và đổi tên thành:

```text
metadata.json
```

## 4. Generate dữ liệu

```bash
npm run generate:memories
```

File sau được sinh tự động:

```text
src/app/generated/memories.generated.ts
```

Không sửa file generated bằng tay.

## 5. Chạy local

```bash
npm start
```

## 6. Build

```bash
npm run build
```

Nếu vừa thêm HEIC hoặc ảnh lớn, chạy thêm:

```bash
npm run prepare:media
```

Output:

```text
dist/our-story/
```
