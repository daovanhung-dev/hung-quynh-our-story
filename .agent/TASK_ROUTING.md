# Chọn phạm vi task và bàn giao cho agent

## Xác định phạm vi trước khi sửa

1. Diễn đạt kết quả người dùng muốn thành tiêu chí có thể quan sát. Ghi rõ các ràng buộc và điều họ không yêu cầu đổi.
2. Kiểm tra `git status` và diff hiện có. Coi mọi thay đổi từ trước là của người dùng; không reset, ghi đè hoặc vô tình đưa chúng vào phạm vi.
3. Tìm route sở hữu, feature, nguồn dữ liệu/cấu hình, component dùng chung, tests và build/deploy consumer. Dùng [PROJECT_MAP.md](PROJECT_MAP.md) làm mục lục rồi xác minh trong implementation.
4. Ghi ranh giới ảnh hưởng ngắn gọn: file/subsystem thuộc phạm vi, feature lân cận bị tác động, asset/dữ liệu sinh tự động và phần ngoài phạm vi.
5. Chọn cách kiểm chứng phù hợp. Ghi đúng lệnh và kết quả; phân biệt kiểm tra source, trình duyệt, artifact và bằng chứng Pages đã deploy.

## Ma trận vai trò dùng được trên nhiều nền tảng

Đây là mô tả vai trò dùng lại, không phải profile riêng của một nhà cung cấp AI. Nếu runtime không tạo được subagent, agent chính tự làm theo checklist tương ứng.

| Vai trò | Chuyển task tới đây khi | Sở hữu / kiểm tra | Tránh |
| --- | --- | --- | --- |
| Điều phối / phân loại | Task có nhiều phần, chưa rõ nơi sở hữu hoặc cần tích hợp | Tiêu chí nghiệm thu, an toàn worktree, ranh giới ảnh hưởng, phân công không chồng lấn, tích hợp và bằng chứng cuối | Giao việc khi chưa có đầu ra cụ thể hoặc để nhiều agent sửa cùng file |
| Story, memory, Angular UI | `core/content`, `core/models`, sinh nhật, timeline, memory detail, media dùng chung, Japan Notes, Love Treasure, Unsaid, `features/miss-you` | Data flow, nơi quản lý nội dung/copy, hợp đồng memory sinh tự động, UI responsive và accessibility; bảo toàn thư/hash và gate/date contract của Miss You | Sửa tay `memories.generated.ts`; sửa `LOVE_LETTER_ORIGINAL.md`; đổi pipeline mà chưa lần theo consumer |
| Museum / 3D | `features/museum`, `core/content/museum-*`, `public/museum-assets` | Scene/layout Three.js, visitor/crowd/dialogue, license và nguồn asset, ngân sách frame/texture | Phụ thuộc asset CDN, visitor/texture không giới hạn hoặc đổi path thiếu kiểm tra manifest |
| LOVE FIGHT / game | `features/love-fight`, `public/games/love-fight`, tests/E2E game | Vòng đời Phaser, state/luật, điều khiển, mobile/reduced motion, catalog asset, kết quả/ảnh cuối | Phụ thuộc ROM, asset/code proprietary sao chép, bạo lực ngoài đời hoặc refactor feature không liên quan |
| Pages / kiểm chứng | `.github/workflows`, `angular.json`, build/static scripts và output | Base href, route fallback, asset được/không được copy, file artifact bắt buộc, quyền workflow và bằng chứng chính xác | Coi build local là bằng chứng deploy; chỉ sửa một trong các giả định tên repo |

Chia việc khi đầu ra độc lập và không đụng cùng quyền sở hữu. Agent điều phối gửi mỗi chuyên gia mục tiêu đã thống nhất, phạm vi chính xác, tài liệu context liên quan, thay đổi worktree cần giữ, ràng buộc, đầu ra mong muốn và giới hạn kiểm chứng. Agent chuyên trách trả lại đường dẫn đã đổi (hoặc chỉ kết quả rà soát), bằng chứng, lệnh đã chạy, giả định, rủi ro và phần còn vướng. Agent điều phối rà lại diff tổng và tiêu chí nghiệm thu.

## Bản đồ xử lý task thường gặp

- **Thêm hoặc sửa một memory:** xem thư mục media theo ngày và `metadata.json`; lần theo scanner/variant/generator; không sửa index sinh tự động để đoán ngày; kiểm tra timeline/detail và consumer lấy ảnh ngẫu nhiên. `migrate:memories` có thể di chuyển file gốc nên không dùng như lối tắt.
- **Đổi route hoặc hub entry:** cập nhật route và nguồn navigation/content sở hữu; xem session guard ở welcome, điều hướng trực tiếp/fallback và E2E cho route.
- **Đổi media/viewer dùng chung:** tìm mọi import của `MediaFrameComponent`, `PhotoViewerComponent` và component bị ảnh hưởng; kiểm tra bàn phím, touch, focus, video, mobile và reduced-motion.
- **Đổi Miss You:** xác minh thư nguồn và copy byte-for-byte/hash trước/sau; test mã exact không trim/case-fold, ngày lịch VN qua midnight và host timezone khác, `sessionStorage` theo tab, audio URL trên base path, bốn memory ID, dialog/viewer keyboard-focus, reduced-motion và Pages artifact. Không mô tả surprise gate là quyền riêng tư.
- **Đổi asset Museum hoặc LOVE FIGHT:** kiểm tra catalog source/runtime, đường dẫn, quy tắc copy/exclusion static, license và test contract liên quan cùng lúc.
- **Đổi CSS/layout:** xác định style thuộc component hay toàn cục; `styles.scss` và `redesign.scss` đều có thể tác động toàn app; tìm route dùng component/token.
- **Đổi GitHub Pages:** làm theo [GITHUB_PAGES.md](GITHUB_PAGES.md); giữ build base, static fallback, artifact verification và workflow đồng bộ.

## Mẫu bàn giao

```text
Mục tiêu và tiêu chí nghiệm thu:
Phạm vi/subsystem phụ trách:
Ngoài phạm vi:
Context/source cần đọc:
Thay đổi worktree sẵn có cần giữ:
Phụ thuộc hoặc tác động liên feature:
Kiểm chứng cần chạy (và nó chứng minh điều gì):
Đầu ra cần bàn giao:
```

```text
Kết quả: đã triển khai | chỉ rà soát | chưa hoàn tất
Đường dẫn đã sửa hoặc đã kiểm tra:
Bằng chứng và lệnh thực sự đã chạy:
Tiêu chí đạt / chưa đạt:
Giả định và giới hạn:
Quyết định còn chờ agent khác hoặc người dùng:
```

## Báo cáo hoàn thành

Tóm tắt điều đã đổi và lý do, nêu kiểm chứng cùng kết quả thực tế, khai báo hành vi chưa xác minh và phần phụ thuộc còn lại. Không báo cáo lệnh chưa chạy hoặc deployment chưa quan sát được.
