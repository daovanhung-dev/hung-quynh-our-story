# Source ảnh gốc

File archive bạn upload đã được đính kèm tại đây:

- `source-images.7z`

## Cách dùng

1. Giải nén file này trên máy của bạn.
2. Sắp xếp ảnh theo cấu trúc:

```text
public/images/memories/YYYY/MM/DD/
```

Ví dụ:

```text
public/images/memories/2026/09/04/001.webp
public/images/memories/2026/09/04/002.webp
public/images/memories/2026/09/04/metadata.json
```

3. Chạy lại:

```bash
npm run generate:memories
npm run build
```

> Ghi chú: Trong môi trường CAAS hiện tại chưa có sẵn công cụ giải nén 7z nên archive được đưa nguyên gói vào project để bạn không bị mất source ảnh gốc.
