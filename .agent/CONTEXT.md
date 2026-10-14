# Context AI của dự án — Hùng & Quỳnh: Our Story

Đọc mục lục này sau `AGENTS.md`. Chỉ mở tài liệu chuyên đề đúng với task; không nạp toàn bộ subsystem vào mọi lượt làm việc.

## Tổng quan

- Website tiếng Việt dạng static, dùng Angular standalone, triển khai dưới dạng GitHub Pages project site.
- Các phần runtime chính: Angular 22, TypeScript strict mode, Phaser 4 cho LOVE FIGHT, Three.js cho bảo tàng và các phòng 3D xoay được trong Our Home; asset ảnh/âm thanh/model được quản lý nội bộ.
- Ứng dụng không có backend hoặc xác thực. File nào nằm trong artifact Pages đều công khai với khách truy cập.
- Xem sơ đồ route và quan hệ ảnh hưởng tại [PROJECT_MAP.md](PROJECT_MAP.md).

## Nạp tài liệu theo task

| Task | Tài liệu |
| --- | --- |
| Xác định phạm vi, chọn người phụ trách hoặc điều phối | [TASK_ROUTING.md](TASK_ROUTING.md) |
| Đổi route, dữ liệu kỷ niệm, trang sinh nhật/truyện, media dùng chung, Museum hoặc LOVE FIGHT | [PROJECT_MAP.md](PROJECT_MAP.md) |
| Build hoặc xử lý GitHub Pages, static path, fallback 404 hay artifact | [GITHUB_PAGES.md](GITHUB_PAGES.md) |
| Xem cơ sở thiết kế context hoặc cập nhật nguồn tham khảo | [REFERENCES.md](REFERENCES.md) |
| Kiểm tra toàn bộ file đã theo dõi và static asset | [FILE_INVENTORY.md](FILE_INVENTORY.md) |
| Trang secret “Chồng nhớ Quỳnh”, thư gốc, ngày theo VN, playlist và ảnh tim | [PROJECT_MAP.md](PROJECT_MAP.md), [GITHUB_PAGES.md](GITHUB_PAGES.md) |

## Thông tin cần nhớ

- Ảnh/video nguồn nằm trong `public/images/memories/`; thư mục theo ngày có thể chứa `metadata.json`, còn `_unresolved` giữ media chưa xác định được ngày.
- Các biến thể media được tạo trong `public/images/generated/memories/` và bị Git ignore; index kiểu TypeScript được tạo tại `src/app/generated/memories.generated.ts`. Không sửa file sinh tự động bằng tay.
- Build và artifact verifier hiện có kiểm tra base href gắn với tên repo. Xem hướng dẫn Pages trước khi đổi tên repo hoặc đường dẫn deploy.
- Route `/hint/miss-you` dùng surprise gate theo `sessionStorage` của tab; thư tại `public/content/love-letter-miss-you.md` và mọi media trong bundle Pages là nội dung công khai. SHA-256 thư được kiểm ở unit test và artifact verifier.
- Catalog `core/content/music-tracks.content.ts` là nguồn track chung cho Museum, Love Treasure và Miss You; ảnh tim lấy bốn ID ổn định từ `MemoryService`, còn nền thu là WebP cục bộ có gradient fallback.
- Khi tài liệu cũ khác với implementation, ưu tiên route, component, script, manifest, test và workflow đang chạy.

## Ảnh chụp kiểm kê

Đợt kiểm toán context này đã phân loại đủ **708 file được theo dõi từ trước**: 119 file text không rỗng, 588 binary và một file placeholder rỗng. [FILE_INVENTORY.md](FILE_INVENTORY.md) ghi từng đường dẫn; mỗi binary có dung lượng, SHA-256, loại được nhận diện, metadata đọc được và nhóm sử dụng theo đường dẫn. Lúc kiểm toán, `public/images/generated/` có 1.047 biến thể WebP và một JSON manifest; đây là output bị ignore. `.git`, `node_modules`, `.angular` và `dist` là nội bộ Git, dependency, cache hoặc build output, không phải source dự án. Số liệu là ảnh chụp theo thời điểm; hãy chạy lại `git ls-files` và kiểm tra output bị ignore khi cần thông tin hiện tại.
