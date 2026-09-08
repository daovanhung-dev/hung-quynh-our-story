# Cách áp dụng bản redesign vào repo hiện tại

ZIP này là **overlay package** giữ đúng đường dẫn thư mục của repo `hung-quynh-our-story`.

1. Giải nén ZIP.
2. Copy các file vào root repo hiện tại và cho phép ghi đè `angular.json`.
3. File mới `src/styles/redesign.scss` sẽ được Angular load sau `src/styles.scss`.
4. Không xóa ảnh, MP3, generated memories hoặc source hiện tại.

Ví dụ Linux:

```bash
unzip hung-quynh-our-story-ui-redesign-2026.zip -d /tmp/hq-redesign
cp -a /tmp/hq-redesign/hung-quynh-our-story-redesign/. /duong-dan/hung-quynh-our-story/
cd /duong-dan/hung-quynh-our-story
npm run build
```

## Vì sao dùng overlay?

Repository chứa lượng media rất lớn. Bản export này chỉ mang **những file cần thêm/ghi đè cho redesign**, nên không nhân đôi hàng trăm MB ảnh/video/MP3 mà bạn đã có trong repo. Cấu trúc đường dẫn vẫn đúng để copy trực tiếp vào project.
