# Hướng dẫn cho AI agent

## Nạp đúng context

- Trước khi sửa file, kiểm tra `git status` và giữ nguyên mọi thay đổi có sẵn của người dùng.
- Đọc `.agent/CONTEXT.md`, sau đó chỉ mở tài liệu chuyên đề phù hợp với task.
- Lấy mã nguồn, cấu hình chạy được, tests, manifest và workflow hiện tại làm căn cứ. Xem kế hoạch có ngày tháng và ghi chú redesign là tư liệu lịch sử nếu chúng khác với implementation.
- Trước khi làm, xác định kết quả quan sát được, tiêu chí nghiệm thu, phạm vi, phần ngoài phạm vi, phụ thuộc và các route bị ảnh hưởng. Xem `.agent/TASK_ROUTING.md`.

## Các ràng buộc của dự án

- Đây là ứng dụng Angular standalone tĩnh. Không thêm backend, database, Supabase, Firebase hay server API nếu không có yêu cầu sản phẩm trực tiếp.
- Media nguồn nằm trong `public/images/memories/`; `scripts/generate-media-variants.mjs` tạo WebP dẫn xuất bị ignore và `scripts/generate-memory-index.mjs` ghi `src/app/generated/memories.generated.ts`. Không sửa file TypeScript được sinh tự động bằng tay.
- `npm start`, `npm test` và build scripts có thể ghi media đã sinh; `prestart` và `prebuild` cũng tạo lại memory index. Kiểm tra `git status` và diff sau khi chạy.
- Giữ tương tác mobile và hỗ trợ `prefers-reduced-motion`. Ưu tiên API Angular/trình duyệt đang dùng trước khi thêm dependency.
- GitHub Pages phục vụ file tĩnh không có xác thực của ứng dụng. Mọi asset được đưa lên đều công khai; không đặt bí mật vào đó và không mô tả site là có kiểm soát truy cập.
- LOVE FIGHT là game hoạt hình nguyên bản. Không thêm asset Capcom, mã/frame data Street Fighter sao chép, ROM patching, gore hoặc hành vi tấn công ngoài đời của Hùng. `public/games/sf2.zip` là file không được feature dùng và hiện có nội dung HTML dù tên có đuôi `.zip`.

## Toolchain và kiểm tra

- Dùng Node.js `>=22.22.3` và npm; phiên bản dependency nằm trong `package.json` và `package-lock.json`.
- Chọn kiểm tra phù hợp với thay đổi: `npm test`, `npm run test:e2e`, `npm run check:scripts`, `npm run build:pages` và `npm run verify:artifact`.
- `npm run migrate:memories` di chuyển/đổi tên media nguồn theo EXIF. Chỉ chạy cho task migration media được yêu cầu rõ và xem trước tác động.
- Đọc `.agent/GITHUB_PAGES.md` trước khi đổi build/deploy hoặc base path.

## Điều phối và báo cáo

- Chỉ giao việc khi các phần thực sự độc lập. Giao phạm vi rõ và đúng tài liệu context; không giả định agent phụ đã nhận hướng dẫn từ agent chính.
- Điều phối các sửa đổi trên file dùng chung. Agent chính chịu trách nhiệm phạm vi cuối, tích hợp, kiểm chứng và báo cáo.
- Báo cáo file đã đổi, kiểm tra thực sự chạy, kết quả quan sát được và giới hạn còn lại. Build local không chứng minh GitHub Pages đã deploy thành công.
- Khi kiến trúc, workflow hoặc cách deploy đổi, cập nhật đúng tài liệu `.agent`; giữ file này ngắn gọn.
