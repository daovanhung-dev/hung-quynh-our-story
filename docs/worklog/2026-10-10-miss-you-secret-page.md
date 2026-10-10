# Worklog — “Chồng nhớ Quỳnh” secret page

Ngày: 2026-10-10  
Phạm vi: triển khai route `/hint/miss-you` theo `docs/BD/HUNG_QUYNH_MISS_YOU_CODEX_PLAN.md` và Definition of Done. Không push/deploy.

## PHASE 0 — Baseline và cô lập phạm vi

**Mục tiêu:** ghi nhận branch/worktree/test baseline; bảo toàn thay đổi đã có.  
**File/route dự kiến:** route lazy Angular mới, Home gate, app header; không đổi hành vi route cũ.  
**Thao tác:** giữ branch `main` (`6eff955 fininsh game`), không checkout/reset/stage/commit. Cài Node `v22.22.3` dưới `/tmp/hq-node` từ nodejs.org; checksum archive khớp `SHASUMS256.txt`. `npm ci` hoàn tất từ lockfile.

**Worktree ban đầu cần giữ nguyên:** `.agent/CONTEXT.md`, `e2e/our-story.spec.ts`, sáu file LOVE FIGHT (`combat-controller.ts`, `combo-rules.ts`, `love-fight-scene.ts`, `love-fight.page.ts`, `love-fight.model.ts`, `love-fight-session.service.ts`), `test/love-fight-contract.test.mjs`, và untracked context pack (`AGENTS.md`, `.agent/*.md`, `.gemini/settings.json`), `LOVE_LETTER_ORIGINAL.md`, `docs/BD/`. E2E mới được đặt trong file riêng.

**Baseline commands:**

| Lệnh | Kết quả |
| --- | --- |
| `npm run check:scripts` | PASS (exit 0) |
| `npm test` | PASS — 20/20 |
| `npm run build:pages` | PASS (exit 0); hai warning SCSS budget đã có ở baseline: Love Treasure 19.99 kB và LOVE FIGHT 19.09 kB so với 12 kB |
| `npm run verify:artifact` | PASS — 1,520 asset references, không deploy ảnh gốc |
| `npm run test:e2e` | FAIL baseline — 89 passed, 7 failed, 10 skipped / 106. Xem lỗi bên dưới; chạy trước mọi thay đổi sản phẩm. |

Baseline E2E failures: Museum desktop catalog count; Museum desktop photo selection timeout; Museum audio controls; Museum visitor dialogue; LOVE FIGHT arcade combo; Museum dialogue HUD mobile visitor-pool assertion; Museum mobile audio button selector strict-mode conflict. Các trace/log gốc nằm tạm ở `/tmp/hq-miss-you-baseline/e2e.log`; không sửa test hiện có thuộc worktree ban đầu.

**Generated outputs:** `src/app/generated/memories.generated.ts` và thư gốc còn nguyên SHA-256 sau baseline. `npm test`/`npm run build:pages` đã ghi lại ignored `public/images/generated/memories/media-manifest.json`; các WebP variants có hash không đổi. Đây là output của pipeline, được giữ ở trạng thái vừa generate. Playwright tạo `test-results/` (không có lúc baseline); sẽ dọn output QA do lượt này tạo sau khi chụp/lưu bằng chứng cần thiết.

**Điều kiện hoàn thành phase:** có lệnh/kết quả nền, branch/worktree đã ghi, chưa đụng file người dùng. Hoàn tất.

## PHASE 1 — Audit media, router và Home

**Mục tiêu:** chọn đúng điểm tích hợp và asset có thật.  
**Thao tác/đối chiếu:** đã đọc `AGENTS.md`, `.agent/CONTEXT.md`, sơ đồ project, routing guidance, router/Home/app shell, `MemoryService`, hai nơi dùng nhạc hiện hữu, package scripts và Pages workflow. Route là Angular standalone/lazy; `SiteEntryService` giữ trạng thái welcome trong session; `/` có điều kiện chuyển `/events`. `MemoryService` trả các biến thể thumbnail/display/medium; `PhotoViewerComponent` dùng chung.

**Asset audit:** `public/mp3/` có 5 file MP3 thực tế đang dùng bởi Museum và Love Treasure: `Cà phê đắng như ly cafe.mp3` (4,029,195 bytes), `Mascara.mp3` (6,285,537), `Mơ.mp3` (5,299,121), `Thằng Điên.mp3` (6,088,346), `Vì anh đâu có biết.mp3` (5,044,255). Tất cả được `file` nhận diện là MPEG Layer III 44.1 kHz stereo; người dùng xác nhận quyền phát hành công khai. Pipeline tạo 1,047 WebP variants cho 349 ảnh nguồn, cộng manifest (1,048 file output). Gallery lấy bốn ảnh ổn định từ `MemoryService`: IDs `2026-02-14-img-4403`, `2026-04-26-img-0039`, `2026-07-11-img-6766`, `2026-07-12-img-6776`. Preview xác nhận ảnh thực của hai người; medium WebP mỗi ảnh 253–377 kB, 1440×1920, không còn EXIF. Không thêm bản sao ảnh riêng. Nền phố thu mới tạo nguyên bản bằng imagegen; tối ưu thành WebP ở phase 8.

**Thư nguồn/Appendix:** `LOVE_LETTER_ORIGINAL.md` là 30 dòng, 10,220 bytes; SHA-256 `1752b77b6170143ff4ab77181da28d3a1a2e166d40c9901831f46bca58804186`. Trích khối `markdown` của Appendix A, bỏ đúng code fence, khớp byte-for-byte với file nguồn (`cmp` exit 0).

**Điểm nối đã chọn:** source of truth cho nhạc chung trong `core/content`; reuse bởi Museum, Love Treasure và route mới. Route guard dùng `sessionStorage` surprise gate; `/` query chỉ mở gate khi direct route bị chặn. Mã gate không phải bảo mật. Thư sẽ được copy byte-for-byte vào `public/content/`.

**Điều kiện hoàn thành phase:** không dùng path asset phỏng đoán; xác nhận fallback/route/layout và preview/hash/metadata ảnh đã được ghi nhận. Hoàn tất.

## PHASE 2 — Bảo toàn và kiểm tra thư gốc

Đã chép `LOVE_LETTER_ORIGINAL.md` nguyên byte vào `public/content/love-letter-miss-you.md`. Hai file đều 30 dòng, 10,220 bytes, SHA-256 `1752b77b6170143ff4ab77181da28d3a1a2e166d40c9901831f46bca58804186`; test unit và verifier của artifact kiểm tra hash, kích thước và số dòng. Parser thuần chỉ nhận diện cặp `**...**`; nội dung được render bằng interpolation/`strong` của Angular, không diễn giải HTML. Unit và E2E xác nhận Unicode, newline, marker đậm, chuỗi có dạng HTML và đầu/giữa/cuối thư. `LOVE_LETTER_ORIGINAL.md` không bị sửa.

## PHASE 3 — Lịch và đồng hồ

Đã thêm hàm ngày thuần theo lịch `Asia/Ho_Chi_Minh`, không dựa timezone của máy; mốc 22/09/2026 được tính là ngày 0 và ngày đếm không âm. Đồng hồ hiển thị giờ Việt Nam và Nhật Bản; cập nhật mỗi phút, khi tab trở lại foreground và khi qua nửa đêm Việt Nam. Unit bao phủ ngày mốc, 23/09, 09/10, 10/10, thời điểm trước mốc và host ở Tokyo/Los Angeles. E2E desktop/mobile xác nhận 18 ngày vào 10/10 và chuyển ngày khi đồng hồ Việt Nam qua 00:00.

## PHASE 4 — Cổng vào và điều hướng

Đã thêm cổng ở Home và lối vào hình trái tim trong header dùng chung. So khớp chính xác `HyeuQ`, phân biệt hoa/thường và không trim khoảng trắng; quyền mở chỉ lưu trong `sessionStorage`. Guard `/hint/miss-you` chuyển deep-link bị khóa về Home, mở dialog qua query rồi xóa query khỏi URL; refresh trong cùng tab còn quyền, tab mới không có quyền. Dialog hỗ trợ bàn phím, focus, Escape và click nền. Route Home thông thường tiếp tục theo `SiteEntryService`. Không xem cổng là cơ chế riêng tư/bảo mật.

## PHASE 5 — Route và bố cục

Đã thêm standalone lazy route `/hint/miss-you`. Desktop dùng ba vùng ngày, media và thư; tablet/mobile xếp ngày → nhạc/ảnh → thư, không tạo vùng cuộn lồng cho thư ở màn nhỏ. Trang có trạng thái tải/lỗi và thử tải lại thư; route cũ không đổi cấu hình hay nội dung.

## PHASE 6 — Ảnh nền và reduced motion

Đã tạo minh họa phố Nhật mùa thu nguyên bản, lưu tại `public/images/illustrations/miss-you-autumn.webp` (1600×900, 206,632 bytes, SHA-256 `025cae5f9e6903bddd6940c04c7b59707dbbe9bb4f52ec6a9c21d16c29885a06`). CSS gradient hoạt động khi ảnh lỗi. Lá rơi và đĩa nhạc chuyển động nhẹ; `prefers-reduced-motion` tắt các hoạt ảnh này. E2E kiểm tra fallback khi ảnh không tải và reduced motion.

## PHASE 7 — Gallery kỷ niệm

Đã nối gallery với `MemoryService`, tái dùng các biến thể đã sinh và `PhotoViewerComponent`. Bốn ảnh lấy theo ID ổn định, hiển thị trong mặt nạ trái tim SVG; không tạo bản sao ảnh và không đưa ảnh nguồn vào artifact. E2E xác nhận ảnh tải, mở lightbox, đóng và khôi phục focus.

## PHASE 8 — Player nhạc

Đã tạo catalog chung cho năm MP3 có sẵn và chuyển Museum cùng Love Treasure sang catalog này, giữ lại tên bài và cách dùng hiện tại. Trang mới dùng một `HTMLAudioElement`, `preload="none"`, tự thử phát bài đầu khi route vào; nếu trình duyệt chặn autoplay, player báo trạng thái và giữ thao tác phát thủ công làm fallback. Có chọn bài/seek/volume, phản ánh event lỗi thật và dừng audio khi rời route. Không thêm phụ thuộc. Unit xác nhận đủ năm file trên đĩa; E2E bao phủ autoplay/fallback, phát MP3 thật, pause và lỗi tải.

## PHASE 9 — Kết nối dữ liệu và vòng đời

Trang đọc thư tĩnh theo `document.baseURI`, chọn ảnh bằng ID từ generated memory index, hủy fetch/timer/listener khi component bị hủy và dừng media trong `ngOnDestroy`. Không thêm API/backend hay thay đổi scanner, generator hoặc schema ứng dụng.

## PHASE 10 — Hoàn thiện trải nghiệm

Đã rà các trạng thái dialog, lỗi tải thư/ảnh/nhạc, playlist, gallery, focus, kích thước điều khiển chạm và reduced motion. CSS responsive được kiểm tra trong E2E ở 320, 360, 375, 390, 820, 1366 và 1440 px; không có tràn ngang hoặc điều khiển bị cắt. Ảnh QA cuối nằm tạm ở `/tmp/hq-miss-you-qa/`.

## PHASE 11 — Kiểm thử và artifact Pages

Kiểm tra cuối sau triển khai:

| Lệnh/kiểm tra | Kết quả |
| --- | --- |
| `npm run check:scripts` | PASS |
| `npm test` | PASS — 26/26 |
| `npm run build:pages` | PASS — output `dist/our-story`; bundle route mới 32.66 kB raw / 8.81 kB transfer |
| `npm run verify:artifact` | PASS — 1,520 asset references, SHA/kích thước thư đúng, không có ảnh gốc |
| E2E riêng `e2e/miss-you-secret-page.spec.ts` | PASS — 26/26 trên desktop và mobile; gồm các ca gate, thư, đồng hồ, media, gallery, lỗi/fallback, reduced motion và bảy viewport |
| `npm run test:e2e` toàn repo | 117 passed, 5 failed, 10 skipped / 132; năm lỗi là test Museum đã lỗi ở baseline (chi tiết bên dưới), hai lỗi baseline khác hiện pass |
| Preview static Pages tại `/hung-quynh-our-story/` | PASS — route trực tiếp nhận 404 fallback nhưng app khởi động; thư 200/10,220 bytes; ảnh nền naturalWidth 1600; MP3 200 dưới base path; reload cùng tab giữ gate; không có asset request lỗi |

Năm lỗi legacy còn lại: Museum catalog/photo viewer desktop; Museum HUD desktop; Museum dialogue bubble desktop; Museum HUD mobile visitor pool; Museum mobile help selector strict-mode. Đây đều là các lỗi có trong E2E baseline trước thay đổi; lượt cuối cho kết quả tốt hơn baseline ở hai ca cũ (mở Museum từ event hub và LOVE FIGHT movement/combo). Không sửa suite Museum/LOVE FIGHT vốn đã dirty của worktree. Mười ca skip vẫn là các project/test được cấu hình skip. E2E không chứng minh website đã deploy.

## PHASE 12 — Context, kiểm kê và bàn giao

Đã cập nhật `.agent/CONTEXT.md`, `PROJECT_MAP.md`, `TASK_ROUTING.md`, `GITHUB_PAGES.md` và `FILE_INVENTORY.md` để mô tả route, static-public gate, media, catalog dùng chung, ảnh nền, verifier và kiểm thử. Ghi nhận feature mới trong phần additions của inventory. Đã đối chiếu `baseHref`, output `dist/our-story`, `404.html`, `.nojekyll` và các lệnh Pages với script/workflow thật; không sửa workflow deploy.

## Giữ gìn worktree và giới hạn kết quả

- Không checkout nhánh, stage, commit, push hoặc deploy.
- Các thay đổi LOVE FIGHT và E2E/test đã dirty trước task được giữ nguyên; E2E mới nằm trong file riêng. `package.json`/lockfile không đổi.
- Sau các lần chạy build, `src/app/generated/memories.generated.ts` giữ đúng SHA trước task; pipeline tái sinh ignored `public/images/generated/memories/media-manifest.json`, còn các WebP variants giữ nguyên hash. Đây là output của script build hiện hành.
- `test-results/` do Playwright tạo trong lượt này đã được dọn; log baseline và ảnh kiểm chứng ở `/tmp` không thuộc repo.
- NPM báo 11 advisory dependency hiện có sau `npm ci` (3 moderate, 5 high, 3 critical); không chạy lệnh tự động nâng dependency trong phạm vi feature.
- Cổng chỉ là surprise gate. Thư và media đều nằm trong static artifact công khai của GitHub Pages.

## Follow-up — thử autoplay khi vào trang

- Theo yêu cầu tiếp nối, player gọi `play()` sau khi gắn track đầu tiên lúc component khởi tạo. Nếu browser chặn autoplay, lỗi hiện hướng dẫn bấm nút phát; không thể bảo đảm mọi trình duyệt tự phát khi chưa có tương tác.
- Cập nhật E2E hiện có để chấp nhận autoplay thành công hoặc fallback do browser policy.
- `npx playwright test e2e/miss-you-secret-page.spec.ts --grep="player attempts autoplay"`: PASS 2/2 (desktop, mobile).
- `npm run build:pages`: PASS; artifact verifier xác nhận 1,520 asset references và hash thư.
- E2E toàn repo không chạy lại sau follow-up này; kết quả full suite phía trên là lần chạy ngay trước thay đổi autoplay.

