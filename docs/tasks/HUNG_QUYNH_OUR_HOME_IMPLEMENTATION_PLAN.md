# 🏡 NGÔI NHÀ NHỎ CỦA HÙNG & QUỲNH

## Product Brief · Business Design · UX Storyboard · Technical Architecture · Codex Implementation Plan

> **Thông điệp xuyên suốt:** “Ngoài kia có thể là một đất nước xa lạ, nhưng ở đây, em luôn có nhà.”
> **Tên tính năng:** Our Little Home — Ngôi nhà nhỏ của chúng mình
> **Dự án tích hợp:** [`daovanhung-dev/hung-quynh-our-story`](https://github.com/daovanhung-dev/hung-quynh-our-story)
> **Nhánh nền đã đọc:** `main` · commit `40d35ea2132d54aaed3151b8aa69183951486ecf`
> **Ngày lập kế hoạch:** 13/10/2026
> **Trạng thái:** **KẾ HOẠCH THIẾT KẾ — CHƯA VIẾT / CHƯA PUSH CODE**
> **Độc giả:** Hùng (chủ sản phẩm), Codex/AI coding agent, người kiểm thử.
> **Mức ưu tiên:** P0 = bắt buộc trước khi tặng; P1 = làm sau P0 nếu ổn định; P2 = nâng cấp tương lai.

---

# 0. Cách sử dụng tài liệu

1. Đọc từ mục **1 → 8** để hiểu mục tiêu, câu chuyện, phạm vi và kiến trúc.
2. Dùng **mục 9** làm đặc tả chính xác cho từng cảnh và tương tác.
3. Dùng **mục 10 → 15** làm hợp đồng về lời thoại, dữ liệu, tài nguyên, bảo mật, hiệu năng và kiểm thử.
4. Giao cho Codex **từng PHASE trong mục 16**, mỗi phase hoàn thành phải có báo cáo, test và diff.
5. Dán prompt tổng ở **mục 19** vào Codex; yêu cầu agent thực hiện tuần tự, tuyệt đối không triển khai tất cả tùy tiện.
6. Dùng checklist **mục 20** để nghiệm thu trước khi gửi QR cho Quỳnh.

**Quy tắc ưu tiên sự thật:** implementation/config/test/workflow thực tế của repo > `.agent` đang có hiệu lực > tài liệu kế hoạch lịch sử > giả định trong tài liệu này. Trước khi code, Codex phải kiểm tra lại trạng thái hiện thời vì repo có thể đã đổi sau commit khảo sát.

---

# 1. Mục tiêu sản phẩm và cảm xúc

## 1.1. Vấn đề cần giải quyết

Hùng và Quỳnh yêu xa: Hùng ở Việt Nam, Quỳnh học tập ở Nhật Bản. Hai người có ảnh, bài hát và kỷ niệm; website hiện tại đã có timeline, lời nhắn, Museum 3D và trang “Chồng nhớ Quỳnh”. **Điều còn thiếu là cảm giác có một nơi để “trở về”, khám phá và nhận sự an ủi mỗi khi nhớ nhau.**

## 1.2. Giải pháp

Tạo **một ngôi nhà ảo 2.5D tương tác**, không phải tour 3D nặng hoặc bản sao Museum. Trong ngôi nhà có những vật dụng có thể chạm; mỗi vật mang kỷ niệm, thư, nhạc, lời động viên hoặc một bất ngờ. Trải nghiệm vừa có hành trình kể chuyện trong lần đầu, vừa có chế độ ghé thăm nhanh ở những lần sau.

## 1.3. Cảm xúc cần đạt

| Thời điểm          | Điều Quỳnh cảm nhận       | Cách sản phẩm thể hiện                                                    |
| --------------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Khi mở link          | Tò mò, được chào đón   | Ngôi nhà tối ấm, ánh đèn dần sáng và lời “Vợ iu về nhà rồi!”  |
| Khi bước vào       | An toàn, thân thuộc         | Không gian ấm áp, đồ vật dễ nhận biết, nhạc nhẹ tùy chọn          |
| Khi nhìn ảnh        | Gần nhau hơn                 | Khung ảnh thật từ`MemoryService`, không dùng ảnh giả làm kỷ niệm   |
| Khi ở góc học tập | Được thấu hiểu            | Lời khích lệ dành cho hành trình học ở Nhật                           |
| Khi buồn/nhớ        | Được vỗ về                | Hộp thư “Mở khi em…” và ghi âm thật của Hùng nếu được cung cấp |
| Khi ra ban công      | Vừa xa vừa gần              | Hai đồng hồ Việt–Nhật, cùng mặt trăng, lời hẹn gặp lại            |
| Khi mở hộp bí mật | Xúc động, vui vì bất ngờ | Lời nhắn cuối, chuỗi ánh sao và nút ôm xuyên màn hình               |
| Khi quay lại         | Muốn ghé thăm lần nữa     | Ngôi nhà nhớ tiến trình trên thiết bị, luôn có đường vào tự do  |

## 1.4. Nguyên tắc sáng tạo

- **Ấm áp hơn hoành tráng:** ưu tiên cảm xúc và tốc độ mượt, không nhồi pháo hoa liên tục.
- **Không biến thành một bài kiểm tra tình yêu:** mọi bí mật có thể khám phá, không bắt buộc Quỳnh bấm hoặc đọc theo thứ tự cứng.
- **Genuine content:** lời nói, ảnh, âm thanh thật của Hùng được ưu tiên; placeholder không giả nhận là kỷ niệm có thật.
- **Không tạo áp lực cảm xúc:** tránh lời thoại khiến Quỳnh thấy có lỗi nếu mệt, ít nhắn tin hoặc bận học.
- **Tôn trọng sở thích:** nút tắt nhạc, tắt chuyển động, bỏ qua intro và thoát bất kỳ lúc nào.
- **Responsive/mobile-first:** trải nghiệm có ý nghĩa đầy đủ trên điện thoại ở Nhật.

## 1.5. Mục tiêu đo được / Definition of Success

- Vào URL trực tiếp hoặc qua Event Hub đều mở trang đúng và không có asset 404.
- Người dùng mở được **5 không gian nội thất** qua chuột, touch và bàn phím.
- Mỗi không gian có **ít nhất 2 tương tác có nội dung thực**; riêng phòng ngủ có đủ 5 thư.
- Có thể hoàn thành bất ngờ cuối, nhưng **không bị khóa** nếu bỏ qua một trò nhỏ.
- Trên điện thoại từ 320 px không bị cuộn ngang, không có hotspot bị khuất.
- Có tùy chọn tắt âm và reduced motion; không auto phát audio trái chính sách trình duyệt.
- Không làm hỏng các route cũ: `/events`, `/timeline`, `/birthday`, `/museum`, `/love-fight`, `/hint/miss-you`.
- Build GitHub Pages và script verify artifact của repo qua kiểm tra.

---

# 2. Hiện trạng kỹ thuật đã đối chiếu với repo

## 2.1. Công nghệ hiện có

| Hạng mục      | Repo hiện tại                                                | Quyết định cho Our Home                                                        |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Frontend        | Angular 22 standalone, TypeScript strict, SCSS                 | Tái sử dụng, tạo lazy route                                                   |
| Routing         | `src/app/app.routes.ts`                                      | Thêm`/our-home`                                                                |
| Shell           | `src/app/app.component.ts`                                   | Giữ header/footer; chỉ điều chỉnh cục bộ nếu cần trải nghiệm immersive |
| Event Hub       | `src/app/core/content/hub.content.ts`                        | Thêm card Our Home**sau khi sẵn sàng mở quà**                          |
| Kỷ niệm       | `MemoryService` + generated index                            | Dùng ảnh từ service; không sửa generated file bằng tay                      |
| Trình xem ảnh | `PhotoViewerComponent`                                       | Tái sử dụng nguyên tắc focus/swipe/keyboard                                  |
| Nhạc           | `core/content/music-tracks.content.ts` + player theo feature | Dùng track hợp lệ; tạo audio riêng có vòng đời rõ ràng                 |
| Ngày/giờ      | `features/miss-you/days-apart.ts`                            | Tái dùng logic ngày xa nhau, dùng IANA timezones                              |
| Three.js        | Đang dùng trong Museum                                       | **Không dùng cho P0**; tránh tải engine chỉ để xem nhà              |
| Phaser          | Đang dùng trong LOVE FIGHT                                   | **Không dùng cho P0**                                                     |
| Kiểm thử      | `test/*.test.mjs`, Playwright E2E                            | Bổ sung test chuyên biệt                                                       |
| Hosting         | GitHub Actions → GitHub Pages                                 | Giữ`base href` và static SPA fallback                                         |

## 2.2. Các file bắt buộc Codex đọc trước khi thay đổi

```text
AGENTS.md
.agent/CONTEXT.md
.agent/PROJECT_MAP.md
.agent/TASK_ROUTING.md
.agent/GITHUB_PAGES.md
package.json
angular.json
src/app/app.routes.ts
src/app/app.component.ts
src/app/core/content/hub.content.ts
src/app/core/models/hub.model.ts
src/app/core/services/memory.service.ts
src/app/core/models/memory.model.ts
src/app/shared/components/photo-viewer/photo-viewer.component.ts
src/app/features/miss-you/days-apart.ts
src/app/core/content/music-tracks.content.ts
.github/workflows/deploy-pages.yml
playwright.config.ts
```

## 2.3. Ràng buộc tuyệt đối

1. Không tự ý thêm backend, database, Supabase/Firebase hoặc API server: đây là Angular static site.
2. Không sửa file `src/app/generated/memories.generated.ts` bằng tay.
3. Không chạy `npm run migrate:memories` nếu task không yêu cầu di chuyển ảnh nguồn.
4. Tôn trọng `public/images/memories/` và pipeline WebP hiện tại.
5. Không thay đổi `LOVE_LETTER_ORIGINAL.md`, source thư Miss You hoặc bất kỳ hash/contract nào của feature cũ.
6. Không ảnh hưởng asset/engine của LOVE FIGHT, Museum và các route khác.
7. Giữ `prefers-reduced-motion`, hỗ trợ bàn phím và thao tác chạm.
8. Trước mọi phase: chạy `git status --short`, giữ nguyên thay đổi chưa commit của người dùng.
9. Chỉ tạo commit/push/deploy khi người dùng hoặc quy trình làm việc cho phép; plan này **không tự động cấp phép**.
10. Mọi media đặt trong GitHub Pages là **công khai**; mã bí mật trong JS hoặc `sessionStorage` không phải xác thực.

## 2.4. Ranh giới sản phẩm

**Trong P0:** căn nhà 2.5D, 5 phòng, ảnh, thư, ghi âm tùy chọn, nhạc, hai múi giờ, progress nội bộ trình duyệt, quà cuối, mobile và QA.

**P1:** nhân vật Hùng/Quỳnh hoạt hình với animation tinh tế; âm thanh không gian; thiệp QR cá nhân hóa; chủ đề mùa.

**Ngoài P0:** chat thời gian thực, hiện diện trực tuyến thật, định vị GPS, camera/micro liên tục, nhắn tin hai chiều đồng bộ, thông báo push, tài khoản, backend hoặc lưu trữ private. Những phần này chỉ nghiên cứu riêng nếu sản phẩm đổi phạm vi.

---

# 3. Bản đồ trải nghiệm và điều hướng

## 3.1. Luồng lần đầu

```mermaid
flowchart TD
  A[QR/link từ Hùng] --> B[/our-home]
  B --> C[Màn chào trước căn nhà]
  C --> D{Bắt đầu hay bỏ qua intro?}
  D --> E[Nhân vật/biển: Vợ iu về nhà rồi]
  D --> F[Đi thẳng vào nhà]
  E --> F
  F --> G[Phòng khách - ảnh ký ức]
  F --> H[Căn bếp - quan tâm]
  F --> I[Góc học tập - động viên]
  F --> J[Phòng ngủ - hộp thư]
  F --> K[Ban công - hai múi giờ]
  G --> L[Thu thập mảnh ánh sáng]
  H --> L
  I --> L
  J --> L
  K --> L
  L --> M[Hộp quà cuối hành trình]
  M --> N[Ôm xuyên màn hình + lời hẹn]
  N --> O[Quay lại khám phá tự do]
```

**Điều chỉnh quan trọng:** chỉ cần hoàn thành **4/5 dấu ấn** để gợi ý mở quà; luôn có nút **“Mở quà ngay”**. Không ép xem hết mọi thư hoặc phải bật âm thanh mới được xem kết thúc.

## 3.2. Luồng khi quay lại

- Mở `/our-home` → thấy nhà đang ở trạng thái hiện tại theo giờ Nhật (sáng/chiều/tối).
- Nếu đã xem intro, hiện nút “Vào nhà” và “Xem lại bất ngờ” thay vì bắt xem intro.
- Các phòng truy cập trực tiếp; thư đã xem vẫn đọc lại được.
- Có thể đặt lại tiến trình qua “Xem từ đầu” trong menu; yêu cầu xác nhận đơn giản.
- URL `/our-home?room=bedroom` **có thể hỗ trợ P1** nếu cần chia sẻ điểm vào; P0 giữ route duy nhất và scene state nội bộ.

## 3.3. Nguyên tắc camera và điều hướng

- **Mặc định:** góc nhìn isometric giả lập / 2.5D bằng ảnh nền tối ưu và các hotspot HTML phủ lên; không đi lại WASD bắt buộc.
- Desktop: bản đồ nhà và phím mũi tên/trái-phải để chuyển phòng; Enter/Space để mở đồ vật.
- Mobile: vuốt giữa các phòng hoặc bấm thanh điều hướng, hotspot chạm đủ rộng.
- Luôn có nút `Trở về`, `Danh sách phòng`, `Bật/tắt nhạc`, `Giảm hiệu ứng`, `Xem lại lời nhắn`.
- Focus khi mở dialog/viewer phải chuyển vào nội dung và quay về đúng điểm bấm khi đóng.
- Hành vi “thoát” không làm mất kỷ niệm đã xem.

---

# 4. Concept thiết kế hình ảnh — 2.5D Storybook House

## 4.1. Hướng nghệ thuật

- **Phong cách:** ngôi nhà gỗ nhỏ, minh họa storybook/isometric 2.5D, dễ thương nhưng tinh tế, giàu ánh sáng.
- **Màu chính:** kem giấy `#FFF7E9`, hồng phấn `#F5CDD4`, gỗ nâu `#986B58`, rượu vang dịu `#7B3549`, vàng đèn `#F6CE7E`, đêm tím `#29243E`.
- **Chất liệu:** gỗ, vải linen, đèn vàng, ô cửa kính, bưu thiếp, giấy thư, chậu cây.
- **Typography:** ưu tiên font tiếng Việt hiện đã có `Be Vietnam Pro`, `Noto Serif Display`; không nạp font mới nếu không cần.
- **Phối cảnh:** mỗi phòng có một background WebP/AVIF; foreground có các lớp ánh sáng/lá cây/nhân vật vẽ từ SVG hoặc PNG/WebP trong suốt.
- **Lớp tương tác:** hotspots là `<button>` thực với nhãn đọc màn hình, không chỉ là tọa độ canvas vô hình.

## 4.2. Mood theo giờ Nhật

| Giờ Nhật (Asia/Tokyo) | Trạng thái nghệ thuật | Hiệu ứng                       |
| ----------------------- | ------------------------- | -------------------------------- |
| 05:00–10:59            | Bình minh                | Ánh hồng, tia nắng nhẹ       |
| 11:00–16:59            | Ban ngày                 | Ánh kem tự nhiên              |
| 17:00–18:59            | Chiều tà                | Cam hồng qua cửa sổ           |
| 19:00–04:59            | Buổi tối                | Đèn vàng, trời tím, sao ít |

**Chỉ là giao diện mô phỏng theo giờ**, không hiển thị như thời tiết thực tế tại Nhật. Dùng `Intl.DateTimeFormat(..., {timeZone: 'Asia/Tokyo'})`; không lấy múi giờ của thiết bị làm nguồn thật.

## 4.3. Kích thước và breakpoint

| Kích thước | Bố cục                                   | Cách tương tác              |
| ------------- | ------------------------------------------ | ------------------------------- |
| 320–479 px   | Một cảnh một lần; navbar dưới        | Touch + swipe + nút minh bạch |
| 480–767 px   | Cảnh rộng hơn, hotspot bố trí thoáng | Touch + nút                    |
| 768–1023 px  | Scene lớn, sidebar nhỏ                   | Touch/chuột/bàn phím         |
| ≥1024 px     | Scene trung tâm + room rail/túi quà     | Chuột/bàn phím               |

- Tỉ lệ artwork đề xuất 16:10 hoặc 16:9, nhưng thiết kế **safe-zone 80% chiều ngang trung tâm** để không mất đồ vật ở điện thoại.
- Nếu ảnh bị crop, hotspot dùng tọa độ tương đối theo vùng scene thực tế (cùng phép biến đổi/crop), hoặc chuyển sang bố cục riêng cho mobile; **không đặt `left: 42%` cố định rồi hy vọng khớp trên mọi tỉ lệ**.
- Không dùng hover làm tương tác duy nhất; tooltip phải mở bằng tap/focus.

## 4.4. Chuyển động

| Animation                               | Độ ưu tiên | Mức độ                                |
| --------------------------------------- | -------------- | ---------------------------------------- |
| Đèn nhà bật khi bắt đầu          | P0             | CSS opacity/brightness 450–800 ms       |
| Chuyển phòng                          | P0             | Crossfade + slide 250–500 ms            |
| Đồ vật phát sáng khi có thể bấm | P0             | Glow rất nhẹ, chu kỳ dài             |
| Giấy thư bung ra                      | P0             | Scale/fade, không gây chóng mặt      |
| Trái tim khi nhận ôm                 | P0             | 3–7 trái tim, không confetti vô hạn |
| Lá cây/khói cốc trà                | P1             | Dùng CSS/SVG, tối đa vài phần tử   |
| Nhân vật đi và vẫy tay             | P1             | Sprite/animation nhỏ                    |
| Camera bay xuyên 3D                    | P2             | Chỉ khi đo được hiệu năng thực   |

Nếu `prefers-reduced-motion: reduce` hoặc người dùng chọn giảm hiệu ứng: tắt parallax, chuyển động lặp vô hạn, tự cuộn camera; chuyển trạng thái tức thì hoặc fade ngắn.

---

# 5. Lời kể mở đầu và nhịp cảm xúc

## 5.1. Kịch bản mở đầu (P0)

**Cảnh A — Màn đêm trước ngôi nhà (0–3 giây, có thể bỏ qua)**

- Nền trời tím, một ô cửa sáng đèn.
- Dòng chữ nhỏ: `H ♡ Q · Có một nơi đang chờ em về.`
- Nút chính: **“Mở cánh cửa của chúng mình”**.
- Nút phụ: **“Bỏ qua lời chào”**.
- Không phát âm thanh khi chưa có thao tác của Quỳnh.

**Cảnh B — Ngôi nhà thức giấc (sau khi bấm)**

- Đèn sáng dần; tiếng chuông/gió nhỏ chỉ phát nếu được cho phép.
- Bảng trước cửa: **“Vợ iu về nhà rồi đấyyy! 🏡❤️”**.
- Lời kể: “Chồng chưa thể ở cạnh em mỗi tối, nên chồng làm cho hai đứa mình một ngôi nhà nhỏ. Khi nào mệt, em cứ về đây nhé.”

**Cảnh C — Cửa mở**

- Nút “Vào nhà của chúng mình”.
- Thấy phòng khách đầu tiên và một lời chỉ dẫn ngắn: “Chạm những đồ vật lấp lánh để khám phá nha.”
- Chỉ dẫn có thể ẩn vĩnh viễn trên thiết bị.

## 5.2. Dòng thoại định hướng (bản thảo, không bắt buộc phải nguyên văn)

- Chào: “Vợ iu của chồng về rùiii! Chồng giữ đèn sáng đợi em nè.”
- Phòng khách: “Có những ngày bình thường, nhưng vì có em nên thành kỷ niệm.”
- Căn bếp: “Nếu hôm nay em mệt, mình cùng ăn ngon và nghỉ một chút nhé.”
- Góc học tập: “Chồng biết em đang cố gắng thật nhiều. Chồng tự hào về em.”
- Phòng ngủ: “Ở đây có những lá thư dành cho từng cảm xúc của em.”
- Ban công: “Việt Nam và Nhật Bản khác giờ, nhưng anh vẫn nhìn về phía em.”
- Quà cuối: “Khoảng cách là điều chúng mình đang đi qua, không phải nơi tình yêu dừng lại.”

**Biên tập cảm xúc:** câu chữ mang giọng Hùng, có thể đáng yêu, nhưng không lạm dụng kéo dài âm tiết; điều quan trọng là Quỳnh đọc dễ, chân thành, không bị quá tải chữ.

---

# 6. Tính năng chi tiết theo không gian

## 6.1. Sơ đồ nhà

```text
                         ┌───────────────────┐
                         │ BAN CÔNG  🌙       │
                         │ Mặt trăng + 2 giờ  │
                         └─────────┬─────────┘
                                   │
   ┌────────────────┬──────────────┴───┬─────────────────┐
   │ GÓC HỌC TẬP 📚  │  PHÒNG KHÁCH 🛋️ │ PHÒNG NGỦ 🛏️    │
   │ Bàn, đèn, lời  │  Ảnh, sofa,      │ Hộp thư         │
   │ động viên      │  đồ kỷ niệm      │ Mở khi em...    │
   └────────────────┴───────┬──────────┴─────────────────┘
                            │
                      ┌─────┴───────────┐
                      │ CĂN BẾP 🍵      │
                      │ Bữa ăn, chăm em │
                      └─────┬───────────┘
                            │
                       CỬA CHÀO 🚪
```

**Lưu ý:** sơ đồ logic điều hướng, không phải blueprint thi công. Mỗi scene tự chủ nhưng cùng hệ ánh sáng và bản đồ mini.

## 6.2. Ma trận tính năng theo phòng

| Scene          | Tương tác P0                                      | Dữ liệu                         | Phần thưởng cảm xúc |
| -------------- | ---------------------------------------------------- | --------------------------------- | ------------------------ |
| Trước nhà   | Mở cửa, xem lời chào                             | Script chào                      | Welcome overlay          |
| Phòng khách  | Khung ảnh, sofa/album, nút nghe nhạc              | MemoryService + track             | Dấu ấn 1               |
| Căn bếp      | Ly trà, tờ note trên tủ lạnh, bánh nhỏ        | Static content                    | Dấu ấn 2               |
| Góc học tập | Đèn bàn, cuốn sổ lời động viên, bảng lịch | Static content, giờ Nhật        | Dấu ấn 3               |
| Phòng ngủ    | Hộp 5 thư, đèn ngủ, gối ôm                    | Letter content/audio tùy chọn   | Dấu ấn 4               |
| Ban công      | Mặt trăng, hai đồng hồ, lời hẹn               | IANA clock + static copy          | Dấu ấn 5               |
| Quà cuối     | Hộp quà, bức thư cuối, ôm xuyên màn hình    | Ending content + voice tùy chọn | Kết thúc / replay      |

---

# 7. Chi tiết từng cảnh: scene, thao tác, phản hồi, lỗi

## 7.1. SCENE 00 — Cửa nhà (Entrance)

**Mục tiêu:** tạo ấn tượng trong 10 giây đầu, tránh màn intro lê thê.

**Giao diện**

- Ngôi nhà mái nâu, cửa gỗ, 2 ô cửa sổ có ánh đèn.
- Biển `Hùng ♡ Quỳnh` nhỏ trước cửa.
- Bầu trời và ánh đèn ứng với giờ Nhật.
- CTA lớn và dễ chạm.

**Hotspots**

1. `door`: mở vào phòng khách; lần đầu hiện lời chào.
2. `nameplate`: hiển thị “Nhà của chúng mình, không ai phải một mình ở đây.”
3. `mailbox`: mở thiệp “Chồng gửi em một điều nhỏ...” (gợi ý, không tiết lộ quà cuối).

**Các trạng thái:** loading ảnh → skeleton/gradient → ready; lỗi ảnh → fallback minh họa CSS với nút vẫn dùng được; người dùng bấm nhanh nhiều lần → chống double navigation.

**Nghiệm thu:** 320 px mở được cửa trong tối đa 2 thao tác, không cần chuột; nút skip hoạt động.

## 7.2. SCENE 01 — Phòng khách: “Ký ức của chúng mình”

**Thiết kế**

- Sofa màu be, đèn đứng, thảm, khung ảnh trên tường, kệ nhạc.
- Không chép toàn bộ Museum/Timeline vào đây. Chỉ chọn vài ảnh như vật trang trí có chủ đích.

**Hotspots**

1. `photo-wall`: mở lightbox bằng `PhotoViewerComponent`, 4–8 ảnh có thật lấy từ `MemoryService` theo ID đã kiểm tra; fallback nếu ID bị thiếu.
2. `sofa`: hiện câu “Có ghế trống cho em nè, ngồi nghỉ với chồng một chút.”
3. `record-player`: chọn nhạc từ catalog `MUSIC_TRACKS`; chỉ phát sau khi người dùng bấm.
4. `memory-album` (P1): mở một mini album kéo ngang, không ép duyệt hết.

**Dấu ấn:** nhận khi mở bất kỳ ảnh hoặc ngồi sofa; nhận tối đa một lần.

**Không được:** hardcode đường dẫn ảnh gốc jpg/heic; không ngẫu nhiên ảnh mỗi render làm thay đổi thứ tự gây khó đoán.

## 7.3. SCENE 02 — Căn bếp: “Chồng nhắc em ăn ngon nhé”

**Thiết kế:** bàn ăn hai ghế, bếp nhỏ, bình hoa, ly trà bốc hơi nhẹ, tờ giấy gắn tủ lạnh.

**Hotspots**

1. `tea`: bấm rót trà (animation 1–2 giây có skip), hiện: “Một cốc ấm cho vợ, vì hôm nay em cũng đã cố gắng rồi.”
2. `fridge-note`: note 3 dòng chăm sóc: ăn đủ bữa, uống nước, ngủ đủ; lời dịu dàng, không giáo huấn.
3. `two-plates`: hiện “Bây giờ mình chưa ngồi cạnh nhau mỗi bữa, nhưng chồng vẫn luôn muốn nghe hôm nay em ăn gì.”
4. `little-cake` (P1): hoạt ảnh bánh và lời chúc cho ngày đặc biệt.

**Dấu ấn:** khi đọc note hoặc rót trà.

**Không được:** mô phỏng đã biết Quỳnh ăn/ngủ ra sao; không giả dữ liệu cá nhân hoặc push notification không tồn tại.

## 7.4. SCENE 03 — Góc học tập: “Cố lên, em bé của anh”

**Thiết kế:** cửa sổ nhìn ra Nhật, bàn gỗ, sách, đèn vàng, tờ giấy viết tay, chậu cây.

**Hotspots**

1. `desk-lamp`: bật/tắt đèn; mở lời động viên trong một panel giấy nhỏ.
2. `notebook`: mở danh sách các lời nhắn ngắn. Ví dụ: “Không cần giỏi ngay hôm nay; mỗi ngày em tiến thêm một chút là điều đáng quý.”
3. `window`: hiện lời nói “Nhìn ra ngoài một chút nhé. Thế giới rộng, nhưng em không đơn độc.”
4. `calendar`: hiển thị **ngày/giờ Nhật thực**; không ghi lịch học giả.

**Dấu ấn:** đọc một câu động viên.

**Accessibility:** bật/tắt đèn không làm thay đổi nội dung thiết yếu; text vẫn đọc được khi tắt đèn.

## 7.5. SCENE 04 — Phòng ngủ: “Mở khi em...”

**Thiết kế:** giường ấm, đèn ngủ, cửa sổ trăng, gấu bông, hộp gỗ đựng 5 phong thư.

**Các phong thư P0**

| ID          | Nhãn trên thư            | Mục tiêu                            |
| ----------- | --------------------------- | ------------------------------------- |
| `sad`     | Mở khi em buồn 🥺         | An ủi, không ép tích cực         |
| `miss-me` | Mở khi em nhớ chồng ❤️ | Gần gũi qua lời thương           |
| `tired`   | Mở khi em mệt 🌷          | Cho phép nghỉ, được trân trọng |
| `lonely`  | Mở khi em cô đơn 🌙     | Tạo cảm giác được nhớ đến    |
| `happy`   | Mở khi em có tin vui ✨   | Cùng ăn mừng một thành quả      |

**Hotspots**

1. `letter-box`: mở hộp 5 phong thư, hiện danh sách và biểu tượng; người dùng chọn tự do.
2. `pillow`: hoạt ảnh ôm gối 1 lần và lời chúc ngủ ngon.
3. `night-lamp`: bật/tắt ánh đèn, không liên quan progress.
4. `voice-recorder` (chỉ khi file thật có sẵn): phát giọng Hùng; nếu không có audio thì không hiện nút giả hoặc hiện rõ “Chồng sẽ để lời ghi âm ở đây khi có nhé.”

**Cách hiển thị thư**

- Dialog dạng tờ giấy chiếm tối đa khung nhìn, riêng mobile có scroll tự nhiên.
- Chữ tiếng Việt dễ đọc; nút đóng luôn thấy được.
- Không auto đánh dấu tất cả thư là đã xem chỉ vì mở hộp.
- Mỗi lá thư có text content riêng và có thể đọc lại vô hạn.
- Có placeholder nội dung nhưng Codex không được tự bịa những chuyện riêng tư như đã xảy ra thật.

**Dấu ấn:** chỉ cần mở 1 trong 5 lá thư.

## 7.6. SCENE 05 — Ban công: “Hai phương trời, một ánh trăng”

**Thiết kế:** ban công nhỏ có 2 cốc trà, ghế đôi, bầu trời đúng mood giờ Nhật, sao tinh tế.

**Hotspots**

1. `moon`: màn hình tối nhẹ; câu `“Dù ở hai nơi, mình vẫn có thể cùng nhìn một bầu trời.”`
2. `two-clocks`: đồng hồ VN và Nhật hiển thị giờ thực bằng `Intl.DateTimeFormat`, cập nhật khi tab trở lại hoặc mỗi phút.
3. `empty-chair`: câu `“Bên cạnh anh vẫn luôn có một chỗ dành cho em.”`
4. `distance-note`: mô tả “Một hành trình mình đang cùng nhau đi qua.”; **không gán quãng đường km chính xác khi chưa xác định địa điểm thực tế**.

**Dấu ấn:** xem mặt trăng hoặc đồng hồ.

**Lưu ý múi giờ:** Việt Nam `Asia/Ho_Chi_Minh`, Nhật `Asia/Tokyo`; không suy ra “online/offline” từ đồng hồ.

## 7.7. SCENE 06 — Hộp quà cuối hành trình

**Nơi đặt:** một chiếc hộp nhỏ trong phòng khách hoặc icon quà góc giao diện; ban đầu hiện gợi ý dịu nhẹ.

**Quy tắc mở:** đủ 4/5 dấu ấn sẽ nổi bật nút; dù chưa đủ vẫn có lối **“Mở quà ngay”**. Đây là trải nghiệm tình cảm, không phải game khóa chức năng.

**Sequence**

1. Nhấp hộp, màn hình làm mờ xung quanh, hộp mở 300–600 ms.
2. 5 đốm sáng di chuyển về giữa (tắt trong reduced-motion).
3. Hiện thư cuối, văn bản luôn đọc được ngay cả khi animation/audio lỗi.
4. Có nút `Nghe lời chồng nói` **chỉ khi asset giọng thật tồn tại**.
5. Hiện hai nhân vật chibi hoặc hai biểu tượng trái tim ôm nhau; không giả ảnh mặt người thật nếu chưa được cho phép.
6. Dòng cuối: **“Em không phải đi qua những ngày xa nhà một mình. Chúng mình có nhau.”**
7. Nút **“Chồng ôm vợ một cái nhé 🫂”** → hoạt ảnh ôm và phản hồi.
8. Nút `Xem lại`, `Quay về căn nhà`, `Về góc kỷ niệm`.

**Chú ý:** không tự phát video/nhạc có tiếng; nếu nhạc đang bật, hạ âm lượng dịu hoặc tạm dừng trước đoạn giọng nói; khôi phục đúng sau khi đóng.

---

# 8. Storyboard nội dung và microcopy

## 8.1. Giọng văn thống nhất

- Người kể: “chồng”; người nhận: “vợ iu / Quỳnh / em”.
- Thân mật, dịu dàng, thỉnh thoảng đáng yêu; không sến ở mọi câu.
- Các câu ngắn cho overlay; lá thư dài để trong dialog.
- Không đổ lỗi cho khoảng cách, không kể khổ, không ép Quỳnh phải thể hiện cảm xúc.
- Nội dung cần được Hùng duyệt trước khi công khai.

## 8.2. Mẫu nội dung cho 5 phong thư (bản thảo có thể chỉnh)

### Khi em buồn (`sad`)

> Vợ iu ơi, hôm nay có chuyện khiến em buồn à? Chồng không biết chính xác điều gì đã xảy ra, nhưng chồng mong em đừng phải gồng mình mọi lúc. Nếu muốn kể, chồng sẽ lắng nghe. Nếu chưa muốn nói, em cứ nghỉ một chút cũng được. Chồng thương em, kể cả những ngày em không vui. ❤️

### Khi em nhớ chồng (`miss-me`)

> Chồng cũng nhớ em nhiều lắm. Có những lúc chỉ ước được ngồi cạnh em, nghe em kể một ngày rất bình thường. Mình chưa thể ở ngay bên nhau, nhưng tình cảm của chồng dành cho em vẫn ở đây, ngày nào cũng vậy. 🥹

### Khi em mệt (`tired`)

> Em đã cố gắng rồi, bé yêu ạ. Mình nghỉ một chút nhé, uống nước, ăn một bữa ngon và ngủ đủ nếu có thể. Hôm nay không cần phải hoàn thành tất cả mọi thứ mới xứng đáng được yêu thương đâu. 🌷

### Khi em cô đơn (`lonely`)

> Ở một nơi xa lạ, đôi khi sẽ có những buổi tối thật yên. Chồng ước gì có thể nắm tay em ngay lúc ấy. Nếu em muốn, hãy nhắn cho chồng một câu thật ngắn thôi: “Em nhớ nhà.” Chồng sẽ biết em đang cần một cái ôm. 🌙

### Khi em có tin vui (`happy`)

> Ơ kìa, vợ iu có tin vui phải khum! Chồng chúc mừng em bé của chồng nhóooo! Dù là chuyện lớn hay nhỏ, chồng đều muốn được nghe. Chồng tự hào về em và mong em cũng tự hào về chính mình. ✨

## 8.3. Thư kết thúc — dự thảo

> **Gửi vợ yêu của anh,**
> Chồng làm căn nhà nhỏ này vì có những điều đôi khi một cuộc gọi vẫn chưa nói hết được. Anh biết Nhật Bản có thể mang đến cho em nhiều trải nghiệm mới, cả những ngày vui lẫn những buổi tối nhớ nhà. Anh muốn em nhớ rằng, dù không thể đứng ngay cạnh em lúc này, anh vẫn luôn mong em được bình an, được yêu thương và được là chính mình.
>
> Từng căn phòng ở đây không thay cho một cái ôm thật. Nó chỉ là cách chồng nói với em rằng: trong lòng anh, chúng mình vẫn đang cùng xây một mái nhà. Và anh sẽ tiếp tục cố gắng, để một ngày những lời hẹn này được kể ngay bên cạnh em.
>
> **Chồng yêu Quỳnh. Hôm nay, ngày mai và trong những ngày mình còn cùng nhau cố gắng.** ❤️

**Quy trình duyệt:** Hùng được thay toàn bộ câu chữ. Không copy/trộn nguyên thư bất biến của `/hint/miss-you` vào đây; file `LOVE_LETTER_ORIGINAL.md` phải giữ nguyên.

## 8.4. Nội dung luôn phải có fallback

- Ảnh chưa chọn → ảnh minh họa nhà/khung ảnh trống có lời giải thích, không render ảnh lỗi.
- File ghi âm chưa có → ẩn nút nghe hoặc text placeholder trung thực.
- Nhạc bị trình duyệt chặn → bấm thủ công, không hiện thông báo lỗi nghiêm trọng.
- Text dài → tự cuộn được, có nút đóng và điều khiển bàn phím.

---

# 9. Thiết kế phần mềm: kiến trúc module

## 9.1. Quyết định kiến trúc chủ đạo

**Chọn Angular standalone + HTML semantic + CSS/SVG + ảnh WebP làm P0.**

**Lý do:** repo đã có Angular, là static site; CSS/SVG phù hợp căn nhà tương tác theo điểm chạm, dễ đảm bảo hỗ trợ mobile, accessibility, giảm motion, không tăng bundle engine. Three.js/Phaser đã tồn tại nhưng import chúng cho feature này sẽ tăng độ phức tạp và tài nguyên không cần thiết. Nếu sau này cần walkable house 3D, hãy làm nhánh P2 và đo hiệu năng trước.

### Tách hai lớp

1. **Presentation:** scene image, character, hotspots, menus, dialogs, transitions.
2. **State/content:** dữ liệu từng phòng, progression, content letter, đồng hồ/mood, audio lifecycle.

Không tạo một `our-home.page.ts` dài hàng nghìn dòng với tất cả text và logic; chia thành feature page, components, content, model và service.

## 9.2. Thư mục đề xuất (file MỚI, không khẳng định đã tồn tại)

```text
src/app/
├── app.routes.ts                       # SỬA: thêm lazy route
├── core/
│   └── content/
│       └── hub.content.ts              # SỬA: link sau khi feature sẵn sàng
└── features/
    └── our-home/                       # MỚI
        ├── our-home.page.ts            # Route container/orchestrator
        ├── our-home.page.scss          # Style cục bộ (nếu cần external style)
        ├── models/
        │   └── our-home.model.ts
        ├── content/
        │   ├── room-map.content.ts     # Room, hotspots, coordinate maps
        │   ├── house-copy.content.ts   # Lời thoại, ghi chú
        │   ├── letters.content.ts      # 5 thư + thư cuối
        │   └── photo-selection.ts      # ID ảnh hợp lệ, được xác minh
        ├── services/
        │   ├── our-home-progress.service.ts
        │   ├── our-home-audio.service.ts
        │   └── house-time.service.ts
        ├── components/
        │   ├── house-intro.component.ts
        │   ├── house-scene.component.ts
        │   ├── house-hotspot.component.ts
        │   ├── room-navigation.component.ts
        │   ├── house-dialog.component.ts
        │   ├── letter-box.component.ts
        │   ├── final-gift.component.ts
        │   ├── two-clocks.component.ts
        │   └── ambient-controls.component.ts
        └── utils/
            └── house-state.ts          # Pure functions: progression/validation

public/
└── our-home/                            # MỚI, media trang trí RIÊNG
    ├── rooms/
    │   ├── entrance.webp
    │   ├── living-room.webp
    │   ├── kitchen.webp
    │   ├── study.webp
    │   ├── bedroom.webp
    │   └── balcony.webp
    ├── overlays/
    │   ├── lamp-glow.webp             # Chỉ khi cần overlay ảnh
    │   ├── envelopes.svg
    │   ├── gift-box.svg
    │   └── couple-hug.svg
    ├── audio/
    │   ├── door-chime.ogg             # Nếu có license/asset hợp lệ
    │   └── hung-final-message.mp3      # CHỈ nếu Hùng cung cấp bản thu thật
    └── README-assets.md               # Nguồn và license tài nguyên

test/
└── our-home-content.test.mjs           # MỚI; hợp đồng content/assets

e2e/
└── our-home.spec.ts                    # MỚI; hành trình desktop/mobile

docs/
└── BD/
    └── HUNG_QUYNH_OUR_HOME_IMPLEMENTATION_PLAN.md   # file bàn giao này
```

**Lưu ý:** Nếu import content TypeScript trong `.mjs` test không thuận tiện với Node runner hiện tại, kiểm tra cấu trúc/asset qua source hoặc đưa data thuần vào JSON có schema validate; không làm test giả luôn pass.

## 9.3. Cấu trúc dữ liệu TypeScript đề xuất

```ts
type HouseRoomId =
  | 'entrance' | 'living' | 'kitchen'
  | 'study' | 'bedroom' | 'balcony';

type HouseTimeMood = 'dawn' | 'day' | 'sunset' | 'night';
type HouseHotspotAction =
  | 'navigate' | 'dialog' | 'photo-gallery'
  | 'letter-box' | 'toggle-light' | 'audio'
  | 'gift' | 'reveal' | 'clocks';

interface HouseHotspot {
  id: string;
  roomId: HouseRoomId;
  label: string;               // accessible name bắt buộc
  action: HouseHotspotAction;
  payloadId?: string;          // trỏ content theo ID, không gắn HTML thô
  position: {
    x: number; y: number;      // 0..1 trên vùng scene logic
    mobileX?: number;
    mobileY?: number;
  };
  awardsStamp?: string;
}

interface HouseRoom {
  id: HouseRoomId;
  title: string;
  subtitle: string;
  backgroundAsset: string;
  hotspots: readonly HouseHotspot[];
}

interface HouseProgressV1 {
  schemaVersion: 1;
  introSeen: boolean;
  exploredRooms: string[];
  collectedStamps: string[];
  openedLetters: string[];
  finaleSeen: boolean;
  audioEnabled: boolean;       // là sở thích, không có nghĩa autoplay thành công
  reducedMotionOverride: boolean | null;
}
```

**Quy tắc model:**

- `roomId`, `hotspotId`, `stampId`, `letterId` ổn định; không dùng index làm khóa.
- `position` được validate 0..1, có fallback mobile khi artwork thay đổi.
- `content` tách khỏi HTML; Angular render text an toàn (không dùng `innerHTML` cho thư từ người dùng).
- Các action chỉ chạy qua whitelist handler; không có dynamic-eval.
- `schemaVersion` bắt buộc để xử lý thay đổi phiên bản `localStorage` về sau.

## 9.4. Cấu trúc component và ownership

| Component/service          | Trách nhiệm                                 | Tuyệt đối không làm                   |
| -------------------------- | --------------------------------------------- | ------------------------------------------ |
| `OurHomePage`            | orchestration, chuyển scene, mở dialog/gift | Trực tiếp thao tác DOM khắp ứng dụng |
| `HouseSceneComponent`    | nền, hotspot, chuyển scene                  | Lưu progress vào storage                 |
| `HouseHotspotComponent`  | button accessible và tooltip                 | Quyết định nội dung lời thoại        |
| `HouseDialogComponent`   | dialog/focus/backdrop/escape                  | Chứa literal content mọi thư            |
| `LetterBoxComponent`     | chọn thư, đọc lại                        | Sửa`LOVE_LETTER_ORIGINAL.md`            |
| `FinalGiftComponent`     | trình diễn quà/replay                      | Ép phải hoàn thành mọi scene          |
| `HouseTimeService`       | JST/VN time, mood                             | Gọi API thời tiết giả                  |
| `OurHomeProgressService` | state, storage validation/version             | Dùng storage như auth                    |
| `OurHomeAudioService`    | phát/dừng âm, cleanup                      | Tự khởi động audio ngoài user gesture |
| `MemoryService` (reuse)  | ảnh có thật                                | Sửa generator theo nhu cầu UI            |

## 9.5. Đường dẫn tài nguyên và GitHub Pages

**Bắt buộc xử lý base path** `https://daovanhung-dev.github.io/hung-quynh-our-story/`.

- Dùng URL tương đối dưới Angular `document.baseURI` hoặc một helper chuẩn hóa theo base href hiện hành.
- Tránh đường dẫn tuyệt đối root `/our-home/rooms/entrance.webp`: trên Pages kiểu project site sẽ trỏ sai.
- Không tạo file `.html` riêng cho route; dựa trên Angular Router và `404.html` fallback hiện hành.
- Verify `dist/our-story/our-home/...` thực sự có asset mới, và route trực tiếp `/hung-quynh-our-story/our-home` hoạt động qua fallback.
- Khi thay đổi artifact/script ignore paths, đánh giá tại `angular.json` và `scripts/verify-static-artifact.mjs` cùng lúc.

---

# 10. Media: ảnh thật, artwork, âm thanh

## 10.1. Phân biệt 2 loại media

**A. Ảnh kỷ niệm thật**: từ `MemoryService` và pipeline hiện tại.
**B. Minh họa ngôi nhà**: chỉ lưu dưới `public/our-home/`; không lẫn vào thư mục memories nếu không phải kỷ niệm theo ngày.

## 10.2. Checklist asset P0

| Asset                                       | Mục đích     | Fallback nếu chưa có                 |
| ------------------------------------------- | --------------- | --------------------------------------- |
| 6 background scene (entrance + 5 phòng)    | Nền căn nhà  | CSS gradient + card nội dung           |
| 1 hộp thư SVG                             | Phòng ngủ     | CSS illustration/icon                   |
| 1 hộp quà SVG                             | Finale          | CSS gift card                           |
| 1 cặp nhân vật/chibi SVG                 | Cái ôm        | Hai trái tim emoji/icon chuyển động |
| 4–8 ảnh kỷ niệm thật                   | Phòng khách   | Tủ ảnh trống + lời nhắn            |
| Nhạc có quyền dùng công khai           | Đĩa nhạc     | Không phát nhạc                      |
| Bản ghi âm của Hùng (không bắt buộc) | Lời yêu cuối | Chữ và nút đọc thư                |

### Asset chưa được cung cấp

Nếu chưa có **ảnh minh họa chuẩn, giọng ghi âm hoặc lựa chọn ảnh riêng**, Codex cần dùng **placeholder có gắn nhãn nội bộ**, không giả vờ đã có giọng nói của Hùng. Các asset cuối phải do Hùng duyệt trước khi deploy.

## 10.3. Quy tắc xuất asset

- Ưu tiên WebP/AVIF; ảnh nền không cần chất lượng gốc vượt kích thước hiển thị.
- Cung cấp desktop và mobile crop nếu tọa độ hotspot không đồng nhất.
- Dùng `<img width height>` hoặc aspect-ratio để tránh layout shift.
- Tránh auto tải toàn bộ sáu background độ phân giải cao ngay trang đầu: preload cảnh hiện tại + prefetch cảnh kế tiếp khi idle.
- Lazy load thumbnail/ảnh album; lightbox lấy bản lớn qua variant phù hợp.
- Có `alt` cho ảnh có ý nghĩa, `alt=""` cho ảnh trang trí; SVG icon có label trên button.
- Ghi license, author, nguồn của mọi asset bên ngoài trong `README-assets.md`; không sao chép tranh nghệ sĩ/cảnh có bản quyền khi chưa được phép.
- Không tái dùng nhạc trong repo theo giả định quyền phát hành đã đủ: rà lại quyền sử dụng trước khi công khai.

## 10.4. Kế hoạch đưa ảnh kỷ niệm vào phòng khách

1. Đọc `MemoryService.getAllImageMedia()` và model `MemoryMedia`.
2. Chọn 4–8 ID ảnh có thật; ghi vào `photo-selection.ts` cùng lý do sử dụng.
3. Validate mỗi ID tồn tại; nếu một ID vắng, dùng ít ảnh hơn hoặc fallback rõ ràng.
4. Render `thumbnailSrc` trong khung, dùng `displaySrc`/`mediumSrc` cho viewer.
5. Không thêm bản sao ảnh vào `public/our-home/`.
6. Giữ chú thích thật (nếu có); không tự suy ra địa điểm/ngày tháng.

---

# 11. Trạng thái, sự riêng tư và vòng đời

## 11.1. Progress lưu trên thiết bị

- Dùng `localStorage` cho lần thăm sau **cùng trình duyệt/cùng thiết bị**; không giả là đồng bộ được giữa hai điện thoại.
- Key đề xuất: `hq:our-home:progress:v1`.
- Load an toàn: parse lỗi/JSON bị sửa → reset về cấu trúc mặc định mà không crash.
- Validate dữ liệu trước dùng: known room/stamp/letter IDs, giới hạn độ dài mảng, loại trùng.
- Storage bị browser chặn → dùng in-memory fallback; UX vẫn hoạt động.
- Có nút `Xem lại từ đầu`; có thể xóa tiến trình **chỉ cho Our Home**, không xóa dữ liệu sinh nhật hoặc Miss You.
- Không ghi âm/ghi lại click cá nhân gửi về server; không tích hợp analytics bên thứ ba mặc định.

## 11.2. Mật mã và bất ngờ

**Quyết định P0:** không thêm gate mật khẩu thứ hai; Hùng gửi QR/link ngẫu nhiên trong đúng thời điểm. Có thể ẩn card Event Hub trước giờ tặng thông qua cờ cấu hình build, **nhưng đó chỉ là cơ chế tạo bất ngờ**, không bảo mật.

**Sự thật bảo mật:** mã PIN phía client, URL khó đoán, `sessionStorage` hoặc `localStorage` **không bảo vệ ảnh/giọng nói/thư đã có trong bundle GitHub Pages**. Nếu muốn chỉ Hùng và Quỳnh truy cập, phải triển khai mô hình xác thực/phân quyền thật hoặc chuyển nội dung nhạy cảm sang hạ tầng private riêng. Đây là **quyết định kiến trúc mới, không tự ý thực hiện trong P0**.

## 11.3. Audio lifecycle

- Chỉ phát sau tương tác chủ động (click play hoặc chọn bài); khi audio play bị từ chối, hiện nút thử lại.
- Chỉ một audio source được phát trong Our Home mỗi lúc; khi mở voice message phải pause/duck background.
- Khi đóng dialog hoặc rời route: hủy listener, dừng audio, reset object nếu cần.
- Không để hai player của các feature khác nhau cùng chạy sau route navigation.
- Có điều khiển volume, mute; nhớ sở thích mute nhưng không ép autoplay.

## 11.4. Time lifecycle

- Tính mood và đồng hồ theo `Asia/Tokyo` / `Asia/Ho_Chi_Minh`, không theo timezone hệ điều hành.
- Cập nhật mỗi phút, khi `visibilitychange` và khi tab trở lại foreground.
- Hủy interval/listeners khi route bị destroy.
- Nếu đồng hồ device sai, đây là giới hạn browser client, không hứa độ chính xác đồng hồ server.

---

# 12. UX/A11y: chuẩn tương tác bắt buộc

1. Mọi hotspot là button có `aria-label` mô tả hành động, ví dụ “Mở hộp thư ở phòng ngủ”, không chỉ “Mở”.
2. Tab focus có vòng sáng rõ; các nút điều hướng có thứ tự hợp lý.
3. Modal dùng `<dialog>` hoặc component tương đương có focus trap, Escape, close button, return focus.
4. Đổi phòng cần cập nhật tiêu đề, thông báo vừa đủ cho screen reader; không đọc to toàn bộ scene tự động.
5. Vùng chạm mục tiêu tối thiểu ~44×44 CSS px, khoảng cách giữa hotspot đủ tránh bấm nhầm.
6. Tỷ lệ tương phản văn bản thông thường hướng tới WCAG AA (4.5:1), chữ lớn 3:1; chữ luôn nằm trên bề mặt đủ tương phản.
7. Ở mobile, overlay và nút đóng không bị che bởi tai thỏ/gesture navigation; dùng `safe-area-inset-*`.
8. Tránh scroll-jacking. Vuốt chuyển phòng chỉ kích hoạt khi gesture bắt đầu trong vùng scene và không tranh với thao tác scroll nội dung dialog.
9. Người dùng tắt animation không bị mất nội dung hoặc không mở được quà.
10. Khi mạng chậm/offline: text, điều hướng nội bộ và fallback vẫn sử dụng được phần lớn; hiển thị lỗi media thân thiện.
11. Không khóa thông tin sau hiệu ứng: bỏ qua intro, bỏ qua animation và xem lại đều có sẵn.
12. Không dùng `title` hover làm phương thức hướng dẫn duy nhất.

---

# 13. Hiệu năng và giới hạn triển khai

## 13.1. Mục tiêu chất lượng (ngưỡng phấn đấu, cần đo thực tế)

| Chỉ tiêu                              | Mục tiêu P0                                                  | Cách chứng minh                     |
| --------------------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| Không tải game/3D engine cho Our Home | 0 import Three/Phaser trực tiếp                              | Xem network/chunk analyzer            |
| Scene đầu trên 4G                    | Ưu tiên nội dung/nút trước ảnh nặng                    | Test throttling DevTools              |
| Background scene                        | Ưu tiên ≤300–500 KB mỗi ảnh nếu chất lượng cho phép | `du`, artifact report               |
| CLS                                     | Gần 0, mục tiêu <0.1                                        | Lighthouse/DevTools                   |
| LCP mobile                              | Mục tiêu ≤2.5 s trên cấu hình test thực tế             | Lighthouse với môi trường ghi rõ |
| Không long task kéo dài do animation | Hướng 60 fps trên thiết bị trung bình                    | Performance profiler                  |
| Không lỗi JS runtime                  | 0 lỗi trong flow P0                                           | Playwright console/pageerror          |
| Không media 404                        | 0 request lỗi asset trong flow                                | Network/browser E2E                   |

**Các số trên là mục tiêu sản phẩm**, không phải kết quả hiện tại. Ưu tiên trải nghiệm mượt trên điện thoại hơn điểm benchmark trong một môi trường duy nhất.

## 13.2. Nguyên tắc giảm tải

- Feature lazy-loaded qua route.
- Không import Three.js/Phaser chỉ để làm animation căn nhà.
- Không prefetch toàn bộ ảnh kỷ niệm và MP3 từ đầu.
- Tận dụng Angular `ChangeDetectionStrategy.OnPush`, signals nếu hợp cấu trúc.
- Không animation `top/left` liên tục; dùng transform/opacity khi phù hợp.
- Dọn timers, subscriptions, audio event listeners khi rời route.
- Test thiết bị cấu hình yếu, chế độ giảm chuyển động và portrait rotation.

---

# 14. Tích hợp với những module hiện có

## 14.1. Routing

Thêm route lazy ở `src/app/app.routes.ts`:

```ts
{
  path: 'our-home',
  loadComponent: () => import('./features/our-home/our-home.page')
    .then((m) => m.OurHomePage)
}
```

Đây là **đoạn mã mẫu** cho Codex tham khảo, không phải thay đổi đã thực hiện.

## 14.2. Event Hub

- Thêm `id: 'our-little-home'`, `category: 'utility'`, `title: 'Ngôi nhà của chúng mình'`, `route: '/our-home'` trong `UTILITY_ITEMS` sau khi QA thông qua.
- Không thay đổi status/type của các card cũ.
- Nếu muốn giữ bất ngờ đến ngày tặng, dùng một cờ cấu hình rõ ràng, mặc định **không công khai card mới trước thời điểm tặng**; route bản build public vẫn có thể được tìm ra nên không gọi đó là bảo mật.
- Nút ở Our Home quay về `/events` và `/timeline` khi phù hợp; không tự chuyển hướng sang Miss You.

## 14.3. App shell

- Giữ `AppComponent` và các route cũ.
- Tạo style cục bộ cho Our Home; nếu cần ẩn header/footer để immersion, sử dụng route-aware explicit state **chỉ cho `/our-home`** và có test bảo đảm route cũ không đổi.
- Đặc biệt không phụ thuộc `BirthdayJourneyService` để điều khiển state căn nhà.

## 14.4. Dữ liệu dùng chung

- `MemoryService`: ảnh thật, ngày thật, viewer dùng chung.
- `MUSIC_TRACKS`: nhạc dùng chung nếu quyền sử dụng công khai được xác nhận.
- Date utilities: có thể tái dùng hàm định dạng đã có hoặc bổ sung wrapper service cho `Asia/Tokyo`, không sửa cách `daysApart` hiện hành.
- `PhotoViewerComponent`: mở/đóng ảnh, keyboard/swipe/focus; không dựng lại một viewer thiếu khả năng tiếp cận.

---

# 15. Kế hoạch kiểm thử và nghiệm thu theo lớp

## 15.1. Unit/content contract

Tạo test phù hợp với Node Test Runner hiện hành, ít nhất bao phủ:

- Sơ đồ phòng có đúng `entrance`, `living`, `kitchen`, `study`, `bedroom`, `balcony`.
- Room ID/hotspot ID là duy nhất; mỗi hotspot có accessible label.
- Mỗi payload ID trỏ tới content có thật.
- Mỗi phòng nội thất có ≥2 tương tác P0.
- Đủ 5 thư với ID ổn định, không có nội dung rỗng.
- Tọa độ hotspot trong khoảng 0–1 và mobile layout có fallback.
- Logic đủ 4/5 stamp hoặc nút skip mở finale; không nhân đôi điểm.
- `localStorage` parse JSON hỏng, schema cũ, key lạ, duplicate IDs đều không crash.
- Timezone/mood cho các mốc 04:59, 05:00, 10:59, 11:00, 16:59, 17:00, 18:59, 19:00 ở Nhật.
- Asset manifest và đường dẫn scene tồn tại, không tham chiếu file binary giả.

## 15.2. Playwright E2E (desktop + mobile)

**Luồng A — Lần đầu:**

1. Mở `/our-home` trực tiếp.
2. Thấy CTA ở cổng, có thể bỏ qua intro.
3. Vào phòng khách, mở ảnh rồi đóng, focus quay đúng vị trí.
4. Chuyển sang bếp, bấm ly trà, đọc note.
5. Sang góc học tập, bật đèn và đọc lời nhắn.
6. Sang phòng ngủ, mở thư `sad`; đóng và đọc thư khác.
7. Sang ban công, đồng hồ VN và Nhật hiển thị phù hợp.
8. Mở quà cuối và xem kết thúc.
9. Về `/events`, trở lại `/our-home` và kiểm tra progress được giữ.

**Luồng B — Khả năng truy cập:**

- Tab qua từng hotspot; Enter/Space kích hoạt.
- Escape đóng modal; nhấn nút close và click backdrop hoạt động.
- Screen reader labels có nội dung mô tả (ít nhất kiểm tra attributes và axe nếu dự án đã có).
- Không dùng audio để truyền tải thông tin bắt buộc.

**Luồng C — Lỗi và môi trường:**

- Chặn tải `entrance.webp` → UI còn thao tác được.
- Chặn ảnh memory → không tạo lỗi JS, hiện fallback hợp lệ.
- Mock `HTMLMediaElement.play()` reject → có fallback manual.
- Storage throws `SecurityError` → phiên làm việc vẫn chạy.
- Bật reduced motion → không có animation lặp chính.
- Vào bằng deep link dưới Pages base path → route và asset đúng.
- Bật/tắt portrait, thử 320, 360, 375, 390, 768, 1024, 1366 và 1440 px.

**Luồng D — Regression:**

- `/events` vẫn có các card cũ.
- `/timeline` và viewer bình thường.
- `/hint/miss-you` không thay đổi thư/gate.
- `/museum` không bị ảnh hưởng bởi global styles.
- `/love-fight` vẫn tải game asset.

## 15.3. Câu lệnh QA

```bash
node --version
npm ci
npm run check:scripts
npm test
npx playwright test e2e/our-home.spec.ts
npm run test:e2e
npm run build:pages
npm run verify:artifact
git status --short
git diff --check
```

- Dùng `npm run build:pages`, **không** chỉ `ng build` rồi khẳng định GitHub Pages chạy được.
- Nếu full E2E có lỗi tồn tại từ baseline Museum/LOVE FIGHT, ghi chính xác test nào fail, so với baseline và cung cấp log. Không mặc định tất cả lỗi đều do feature mới hoặc đều là lỗi cũ.
- Playwright/web server có thể tạo file tạm; xem `git status` trước khi commit.
- Kết quả build local **không xác nhận** đã push/deploy thành công; xem GitHub Actions và URL thật riêng.

---

# 16. ROADMAP CODEX — triển khai từng PHASE, có đầu ra và điều kiện dừng

> Mỗi PHASE: (A) xác minh worktree → (B) code đúng phạm vi → (C) kiểm thử tập trung → (D) báo cáo đường dẫn/diff/kết quả → (E) chỉ chuyển phase khi nghiệm thu đạt.
> Không gom tất cả phase thành một commit khổng lồ. Không tự ý sửa unrelated files.
> Tổng số phase: **16 phase (0–15)**. P0 từ phase 0 tới 14 (bao gồm nghiệm thu/xuất bản có kiểm soát); phase 15 là P1 tùy chọn.

## PHASE 0 — Đọc code, chụp baseline, xác định quyền sở hữu (P0)

**Mục đích:** mọi quyết định bám đúng repo hiện tại, không mất thay đổi cũ.

**Bước thực hiện:**

1. Kiểm tra `git branch --show-current`, `git status --short`, `git log -1 --oneline`.
2. Đọc toàn bộ các file được liệt kê ở mục 2.2 theo đúng thứ tự `AGENTS.md` → `.agent/CONTEXT.md` → tài liệu chuyên đề.
3. Rà `src/app/features/`, `MemoryService`, theme tokens và routing; xác định import/component có thể tái dùng.
4. Liệt kê tài nguyên hiện có đủ dùng và tài nguyên còn thiếu; không tự tạo hoặc sao chép ảnh thật khi chưa xác nhận.
5. Chạy baseline `npm run check:scripts`, `npm test`, `npm run build:pages`; ghi rõ PASS/FAIL cùng warning. Chạy E2E nền nếu môi trường cho phép; phân biệt fail có sẵn.
6. Chốt danh sách file mới/file cần sửa và rủi ro liên feature.

**Đầu ra:** `docs/worklog/our-home-implementation.md` (tạo mới) có baseline, route/file map, asset gap; **chưa viết feature**.

**DoD:** không thay đổi file sản phẩm; hiểu cơ chế Pages; có baseline kiểm chứng.

## PHASE 1 — Chuẩn hóa BD, nội dung và storyboard (P0)

**Bước thực hiện:**

1. Đưa plan này vào `docs/BD/HUNG_QUYNH_OUR_HOME_IMPLEMENTATION_PLAN.md` trong repo khi người dùng cho phép.
2. Định nghĩa `HouseRoomId`, `HouseHotspotAction`, progress model.
3. Tạo `room-map.content.ts` với danh sách phòng/hotspots và payload keys.
4. Tạo `house-copy.content.ts` và `letters.content.ts` với nội dung bản thảo ở mục 8.
5. Viết bảng liên kết scene → hotspot → action → content ID → stamp ID.
6. Đánh dấu từng lời/asset cần Hùng duyệt thay vì tự cho là đã được duyệt.

**File chính:** `features/our-home/models/*`, `content/*`.

**DoD:** không còn hotspot thiếu action/text; data không phải copy rải rác ở template.

## PHASE 2 — Asset plan và hình minh họa P0 (P0)

**Bước thực hiện:**

1. Tạo asset inventory `public/our-home/README-assets.md`.
2. Tạo hoặc đưa vào 6 background đồng nhất phong cách; chỉ dùng asset có quyền sử dụng.
3. Thiết kế safe-zone/mobile crop; lưu tọa độ vật dụng trong reference sheet.
4. Xuất WebP/SVG hợp lệ, tối ưu dung lượng và kiểm tra độ rõ chữ/nút.
5. Thiết lập CSS gradient/illustration fallback khi thiếu file.
6. Rà lại path dưới `base href` của Pages.

**DoD:** 6 scene hiển thị nhất quán trên điện thoại và desktop; asset thiếu không làm app ngừng hoạt động.

**Ghi chú:** Nếu chưa có artwork cuối, vẫn có thể triển khai scene skeleton để test logic, nhưng không được đánh dấu là đã hoàn thiện hình ảnh.

## PHASE 3 — Khung route và shell Our Home (P0)

**Bước thực hiện:**

1. Tạo `OurHomePage` standalone + `ChangeDetectionStrategy.OnPush`.
2. Khai báo lazy route `/our-home` trong `app.routes.ts`.
3. Tạo loading/error/ready states và nền fallback.
4. Tạo layout responsive + title/landmark chính.
5. Kiểm tra route trực tiếp và navigation vào/ra.
6. Chưa gắn card trên `/events` trước khi route đủ chất lượng.

**DoD:** route mới chạy được, route cũ không khác hành vi, bundle lazily loaded.

## PHASE 4 — Scene renderer + hotspots + điều hướng (P0)

**Bước thực hiện:**

1. Tạo `HouseSceneComponent` nhận room data.
2. Tạo `HouseHotspotComponent` dưới dạng `<button>` có aria-label/tooltip.
3. Xây hệ tọa độ responsive, canh theo artwork, có mobile mapping.
4. Tạo `RoomNavigationComponent` với nút room, previous/next và mini map.
5. Wire action dispatcher theo whitelist action type.
6. Viết fallback cho hotspot khi asset background chưa tải.
7. Ngăn double click và focus sai sau transition.

**DoD:** đi tới tất cả phòng bằng touch/chuột/bàn phím; hotspot không lệch ở 320–1440 px.

## PHASE 5 — Cửa nhà và lời chào (P0)

**Bước thực hiện:**

1. Implement scene `entrance`, ánh đèn và nút vào nhà.
2. Tạo intro có thể skip/đọc lại.
3. Hook introSeen vào progress state (tạm dùng memory fallback nếu chưa có storage).
4. Thêm lời chào và hướng dẫn chỉ xuất hiện đúng ngữ cảnh.
5. Kiểm thử lần đầu/lần sau/refresh trong tab.

**DoD:** lần đầu cảm xúc rõ; lần sau không ép xem intro; không autoplay tiếng.

## PHASE 6 — Phòng khách + MemoryService + PhotoViewer (P0)

**Bước thực hiện:**

1. Chọn và xác minh 4–8 memory IDs thực sự tồn tại.
2. Kết nối khung ảnh thumbnail từ `MemoryService`.
3. Mở `PhotoViewerComponent` khi bấm khung ảnh.
4. Thêm tương tác sofa và nguồn nhạc (player chỉ phát khi bấm).
5. Đánh dấu stamp 1 và lưu trạng thái.
6. Kiểm tra fallback ảnh thiếu, keyboard, focus restore.

**DoD:** mở ảnh thật, không copy media gốc, không tạo 404.

## PHASE 7 — Căn bếp + góc học tập (P0)

**Bước thực hiện:**

1. Implement `kitchen` scene, note, tea animation và hai phần lời thoại.
2. Implement `study` scene, notebook, desk lamp, calendar Nhật.
3. Thêm stamp 2 và 3.
4. Mọi animation có reduced-motion alternative.
5. Test overflow chữ dài trên 320 px.

**DoD:** mỗi phòng có ít nhất 2 hotspot meaningful; không có data học tập giả.

## PHASE 8 — Phòng ngủ và hộp thư (P0)

**Bước thực hiện:**

1. Tạo `LetterBoxComponent`, modal chọn 5 phong thư.
2. Dữ liệu thư lấy từ `letters.content.ts` chứ không hardcode vào HTML.
3. Thực hiện open/close/focus/scroll/reopen.
4. Thêm tương tác pillow/night lamp, stamp 4.
5. Khi có audio thật: hiện nút phát voice theo content ID; thiếu thì fallback văn bản.
6. Unit/Playwright kiểm tra đủ 5 thư và quay lại màn hình cũ.

**DoD:** đọc thư trên di động thoải mái, không lỗi focus, không làm thay đổi thư Miss You.

## PHASE 9 — Ban công và hai đồng hồ (P0)

**Bước thực hiện:**

1. Xây `HouseTimeService` và `TwoClocksComponent`.
2. Hiển thị đồng hồ VN/Nhật, mood theo giờ Nhật.
3. Tạo moon/two chairs/hotspots; stamp 5.
4. Update trên minute boundary/visibility change, cleanup khi destroy.
5. Test daylight boundary theo giờ Nhật và host timezone khác.

**DoD:** không phụ thuộc timezone máy, không giả weather/online status.

## PHASE 10 — Progress và lưu trạng thái phiên quay lại (P0)

**Bước thực hiện:**

1. Tạo `OurHomeProgressService` với schema v1.
2. Pure functions để add unique stamp/room/letter, validate dữ liệu.
3. Implement safe storage read/write + memory fallback.
4. Điều khiển introSeen, collectedStamps, finaleSeen, openedLetters.
5. Tạo `Xem từ đầu` với xác nhận; chỉ reset key Our Home.
6. Test dữ liệu bị sửa tay, storage disabled, refresh, tab mới.

**DoD:** tiến trình ổn định cùng trình duyệt, không phụ thuộc cloud, không coi storage là xác thực.

## PHASE 11 — Hộp quà cuối và cái ôm (P0)

**Bước thực hiện:**

1. Tạo `FinalGiftComponent` với button xem bất kỳ lúc nào.
2. Dấu ấn 4/5 chỉ kích hoạt gợi ý, không khóa truy cập.
3. Render lời cuối ở mục 8.3; ưu tiên text trước animation.
4. Tạo animation quà và ôm có reduced-motion fallback.
5. Có nút `Xem lại` / `Quay về nhà` / `Về góc kỷ niệm`.
6. Nếu có voice: phát theo user gesture, tạm dừng nhạc nền rồi phục hồi phù hợp.
7. Test mở quà khi 0/5, 4/5, 5/5 stamp.

**DoD:** finale không kẹt bởi audio hay animation; cảm xúc rõ ràng, dễ replay.

## PHASE 12 — Accessibility, audio, responsive và performance (P0)

**Bước thực hiện:**

1. Test 320, 360, 375, 390, 768, 1024, 1366, 1440 px.
2. Rà tab/Enter/Escape/focus trap; hit target; safe areas.
3. Reduced-motion, text scaling 200%, keyboard-only.
4. Đo scene background size, route chunk, CLS/LCP trên môi trường test ghi rõ.
5. Lazy/prefetch các scene; ngăn phát nhạc chồng chéo.
6. Kiểm tra lifecycle timers/listeners/audio khi liên tục chuyển route.
7. Rà toàn bộ nội dung theo giọng Hùng và sửa lỗi dấu tiếng Việt.

**DoD:** không có lỗi tương tác, trường hợp mạng yếu có fallback, không có heavy engine trong chunk Our Home.

## PHASE 13 — Test tự động + build Pages + regression (P0)

**Bước thực hiện:**

1. Viết `test/our-home-content.test.mjs` và `e2e/our-home.spec.ts`.
2. Chạy focused unit/E2E trước.
3. Chạy toàn bộ test + check scripts + `npm run build:pages` + verify.
4. Rà `dist/our-story/our-home/` và asset paths; deep link dưới `/hung-quynh-our-story/our-home`.
5. Kiểm tra trang cũ: `/events`, `/timeline`, `/birthday`, `/museum`, `/love-fight`, `/hint/miss-you`.
6. Ghi rõ mọi fail/warning, phân loại lỗi mới vs baseline.
7. Chỉ đánh dấu P0 DONE nếu tiêu chí mục 20 đều đạt.

**DoD:** build & test có bằng chứng; không làm mất chức năng cũ.

## PHASE 14 — Tặng quà / hiển thị Event Hub / deploy (P0, cần quyết định xuất bản)

**Bước thực hiện:**

1. Hùng duyệt các lá thư, lời cuối, ảnh thật và quyền phát hành audio/ảnh.
2. Quyết định public card trên Event Hub ngay hay chỉ gửi direct link để giữ bất ngờ.
3. Nếu bật Event Hub card: sửa `hub.content.ts`, thêm test navigation.
4. Hoàn tất nghiệm thu local và kiểm tra `git diff`.
5. Chỉ commit/push sau khi được Hùng đồng ý; GitHub Actions chạy build/deploy.
6. Xem workflow run `Deploy GitHub Pages` **kết luận success**, không suy đoán.
7. Truy cập URL thật và kiểm tra opening, ảnh, nhạc, back/forward, refresh route con trên thiết bị thực tế.
8. Tạo QR dẫn tới `https://daovanhung-dev.github.io/hung-quynh-our-story/our-home`, kiểm tra bằng camera điện thoại.
9. Gửi link/QR vào lúc Hùng muốn tạo bất ngờ.

**DoD:** hành trình hoạt động thực tế trên Pages, QA xác nhận bản đã deploy, có đường rollback.

## PHASE 15 — Polish tùy chọn sau khi P0 ổn định (P1)

**Thứ tự ưu tiên gợi ý:**

1. Nhân vật Hùng chibi vẫy tay, Quỳnh chibi chạy lại ôm.
2. Tích hợp giọng ghi âm thật vào nhiều đồ vật.
3. Thêm ngày kỷ niệm đặc biệt dưới dạng room decoration có cấu hình.
4. Thay mood theo mùa với asset tự tạo.
5. Mini game nhẹ như ghép hai mảnh trái tim (có nút skip).
6. Cho phép Hùng xuất bản nhiều bộ lời nhắn theo phiên bản thông qua file content versioned (vẫn static).

**DoD:** không phá P0, có test regression và đo ảnh hưởng bundle/performance.

---

# 17. Thứ tự commit và cách review an toàn

**Không tự động commit.** Nếu được phép, tách commit theo nhóm có thể review:

```text
feat(our-home): add route and typed room content
feat(our-home): implement scene navigation and hotspots
feat(our-home): build living kitchen and study experiences
feat(our-home): add letter box and balcony clocks
feat(our-home): implement progress and final surprise
test(our-home): add content contracts and playwright coverage
chore(our-home): optimize assets and verify pages build
```

Mỗi commit cần:

- `git diff --check` không báo lỗi whitespace.
- Không vô ý stage ảnh `public/images/memories/` không liên quan hoặc generated artifact vô nghĩa.
- Không sửa quyền riêng tư của Miss You, không thay hash lá thư gốc.
- Không đưa binary thiếu nguồn gốc/license vào public.

---

# 18. Rủi ro và phương án xử lý

| Rủi ro                                                  | Mức        | Phòng ngừa / phản ứng                                                                   |
| -------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| Ảnh/văn bản riêng tư bị công khai                 | Cao         | Duyệt nội dung; không gắn secret vào static build; auth riêng nếu cần private thật |
| Ảnh nền to làm tải lâu                              | Cao         | WebP, lazy scenes, fallback CSS, đo mạng yếu                                             |
| Hotspots lệch trên mobile                              | Cao         | Scene safe-zone, mapping responsive, test viewport nhỏ                                     |
| Audio autoplay bị chặn                                 | Trung bình | Luôn play sau gesture, nút fallback                                                       |
| CSS phá Museum/LOVE FIGHT                               | Trung bình | Isolate style theo component, regression test                                               |
| Progress hỏng vì storage bị xóa                      | Thấp       | Fallback in-memory, content vẫn truy cập được                                          |
| Thư quá nhiều chữ khiến Quỳnh ngại xem            | Trung bình | Mỗi overlay ngắn, thư dài nằm trong hộp riêng                                        |
| QR mở deep route nhận 404                              | Cao         | Kiểm tra static fallback`404.html` và deploy live                                       |
| Asset không có bản quyền                             | Cao         | Tự tạo hoặc license rõ, ghi attribution                                                 |
| Deploy surprise sớm bị lộ ở Event Hub                | Trung bình | Trì hoãn hiển thị card; thừa nhận bundle public vẫn có thể tìm thấy              |
| Hình chibi gây cảm giác không giống hai người    | Thấp       | Kiểu biểu tượng/không dùng mặt thật cho P0, xin duyệt P1                           |
| Hành trình khóa quà cuối làm người xem bỏ cuộc | Trung bình | Luôn cho skip/mở quà trực tiếp                                                         |

---

# 19. PROMPT BÀN GIAO CHO CODEX — COPY NGUYÊN KHỐI

```text
Bạn là Principal Angular Engineer + UI/UX Motion Designer + QA Engineer
được giao triển khai feature “Ngôi nhà nhỏ của Hùng và Quỳnh” vào repo hiện tại.

Nguồn sự thật:
- docs/BD/HUNG_QUYNH_OUR_HOME_IMPLEMENTATION_PLAN.md
- AGENTS.md
- .agent/CONTEXT.md, .agent/PROJECT_MAP.md, .agent/TASK_ROUTING.md,
  .agent/GITHUB_PAGES.md
- Source, package.json, angular.json, scripts, tests và workflow thực tế.

Mục tiêu:
- Thêm Angular lazy route /our-home.
- Trải nghiệm nhà 2.5D mobile-first, 6 scene (cửa + 5 phòng), 5 lá thư,
  ảnh kỷ niệm thật từ MemoryService, đồng hồ VN/Nhật,
  state trong localStorage có validate, hộp quà/cái ôm cuối.
- Không thay đổi luồng của route cũ, không thêm backend/Three/Phaser cho P0.
- Không tự bịa ảnh/giọng nói là dữ liệu thật.

QUY TẮC BẮT BUỘC:
1. Trước khi sửa, chạy git status --short và giữ nguyên thay đổi đã có.
2. Đọc AGENTS.md -> .agent/CONTEXT.md -> tài liệu cần thiết rồi đối chiếu code.
3. Không chỉnh src/app/generated/memories.generated.ts trực tiếp;
   không chạy migrate:memories; không sửa LOVE_LETTER_ORIGINAL.md.
4. Không đặt credentials/token/private content trong GitHub Pages.
5. Làm từng phase 0..15 theo kế hoạch, chỉ làm phase được giao;
   không nhảy phase hay refactor unrelated features.
6. Dùng Angular standalone, TypeScript strict, SCSS scoped, OnPush,
   accessible HTML, keyboard/touch, prefers-reduced-motion.
7. Với asset chưa được cung cấp, dùng placeholder/fallback trung thực;
   không đánh dấu hoàn thành art/voice khi chưa có file thật.
8. Giữ base href /hung-quynh-our-story/; verify artifact và deep links.
9. Viết test contract + E2E cho feature, chạy command thực;
   báo PASS/FAIL có bằng chứng, phân biệt lỗi baseline.
10. Không tự ý commit, push, deploy hay thay đổi GitHub settings.

BẮT ĐẦU TỪ PHASE 0:
- Đọc context.
- Báo baseline repo, phạm vi tác động và những asset còn thiếu.
- Tạo worklog, không đổi file sản phẩm ở phase 0.
- Sau mỗi phase báo:
  (a) mục tiêu; (b) file thay đổi; (c) chi tiết triển khai;
  (d) test thực sự chạy và kết quả; (e) rủi ro;
  (f) điều kiện còn thiếu để sang phase tiếp theo.

Tiêu chí cuối:
- Mobile 320px trở lên hoạt động; 6 scene truy cập được.
- 5 thư đọc lại được; quà cuối có thể mở hoặc skip.
- Không âm thanh tự phát trái browser policy; có reduced-motion.
- Không 404 media, không lỗi console trong P0 flow.
- npm test, focused Playwright, build:pages, verify:artifact có báo cáo.
- Các route cũ không regression; GitHub Pages chỉ coi thành công sau
  khi xem workflow deploy và truy cập website thật.
```

## 19.1. Prompts ngắn để điều khiển từng giai đoạn

Sau khi agent hoàn thành và báo cáo phase trước, dùng:

> “Tiếp tục **PHASE N** trong `docs/BD/HUNG_QUYNH_OUR_HOME_IMPLEMENTATION_PLAN.md`. Chỉ triển khai phạm vi phase này, tuân thủ AGENTS.md, giữ nguyên mọi thay đổi sẵn có, chạy QA tương ứng và gửi báo cáo DoD trước khi sang phase tiếp theo. Không commit/push/deploy.”

Để đánh giá thay vì code:

> “Rà toàn bộ implementation Our Home theo mục 15 và 20 của BD. Chỉ báo cáo thiếu sót, severity, file/line và bước tái hiện; không sửa gì trong lượt này.”

Để bảo đảm bản tặng hoạt động trên Pages:

> “Kiểm tra bản deploy thực tế của `/our-home`: GitHub Actions, Pages base path, direct route refresh, load media, iPhone/Android touch, autoplay fallback và regressions. Phân biệt kết quả kiểm tra local với website đã deploy. Không push hoặc đổi Settings nếu chưa được phép.”

---

# 20. MASTER ACCEPTANCE CHECKLIST — dùng trước khi gửi cho Quỳnh

## 20.1. Kịch bản và nội dung

- [ ] Thông điệp cảm xúc được giữ xuyên suốt, không lan man.
- [ ] Hùng đã duyệt lời chào, 5 lá thư và lời kết.
- [ ] Không có lời thoại giả nhận đã biết chuyện thật xảy ra với Quỳnh.
- [ ] Không sao chép/sửa thư nguyên bản của tính năng Miss You.
- [ ] Quỳnh có thể mở quà mà không phải làm xong mọi tương tác.

## 20.2. Chức năng

- [ ] `/our-home` hoạt động với deep link.
- [ ] Entrance mở được bằng touch và keyboard.
- [ ] 5 phòng nội thất xem được, có ≥2 hotspot meaningful/phòng.
- [ ] Phòng khách sử dụng ảnh kỷ niệm thật từ `MemoryService`.
- [ ] 5 lá thư đọc, đóng, mở lại đầy đủ.
- [ ] VN/Japan clocks có timezone đúng, update khi tab quay lại.
- [ ] Có mô phỏng day/night theo giờ Nhật, không giả thời tiết thật.
- [ ] Progress lưu cùng browser, có xử lý storage lỗi.
- [ ] Quà cuối mở được lúc 0/5 và có gợi ý sau 4/5.
- [ ] Có nút replay và về Event Hub.

## 20.3. Trải nghiệm

- [ ] Thao tác được trên 320, 360, 390, 768, 1024, 1440 px.
- [ ] Không cuộn ngang, không hotspot chồng nhau.
- [ ] Tất cả hotspot có aria-label và focus ring.
- [ ] Escape/close/background click/modal focus hoạt động.
- [ ] `prefers-reduced-motion` tắt motion đáng kể.
- [ ] Nhạc không tự phát trái browser policy; nút mute rõ ràng.
- [ ] Voice button chỉ xuất hiện khi có file thật; lỗi có fallback.
- [ ] Ảnh lỗi vẫn có nút/luồng đi tiếp.

## 20.4. Tích hợp và kiểm chứng

- [ ] Không sửa tay generated memory index.
- [ ] Không thêm backend/database ngoài phạm vi.
- [ ] Không thay đổi route/asset/nhạc của Museum và LOVE FIGHT ngoài nhu cầu xác định.
- [ ] `npm run check:scripts` PASS hoặc lý do FAIL được ghi.
- [ ] `npm test` PASS hoặc baseline issues đã phân loại.
- [ ] `npx playwright test e2e/our-home.spec.ts` PASS.
- [ ] Full E2E được chạy hoặc có giải thích môi trường và log phần chưa chạy.
- [ ] `npm run build:pages` và `npm run verify:artifact` PASS.
- [ ] `git diff --check` PASS, không vô ý đưa artifact thừa vào commit.
- [ ] Nếu push: Actions deploy kết luận success và website thật đã được mở kiểm thử.
- [ ] Quyền công khai của ảnh, nhạc, giọng nói và nội dung đã được Hùng duyệt.
- [ ] QR mở đúng `/hung-quynh-our-story/our-home` trên điện thoại.

---

# 21. Kế hoạch tặng quà — trải nghiệm ngoài website

1. **Chuẩn bị nội dung thật:** Hùng chọn vài ảnh kỷ niệm yêu thích, đọc lại từng lá thư, có thể tự ghi âm 20–60 giây lời nhắn cuối. Nếu không muốn ghi âm, bản text vẫn trọn vẹn.
2. **Duyệt trên điện thoại giống Quỳnh sẽ dùng:** thử bằng Android/iPhone, ưu tiên browser và mạng di động thực tế.
3. **Giữ bất ngờ:** nếu chưa muốn lộ, chưa đưa card mới vào Event Hub; chỉ gửi QR trực tiếp. Cần hiểu đây là giấu lối vào, không phải bảo vệ dữ liệu.
4. **Tin nhắn mở quà (gợi ý):** “Vợ iu ơiii, chồng có xây một thứ nhỏ xíu cho hai đứa mình. Khi nào em có một chút thời gian yên tĩnh, mở cái này giúp chồng nhé 🏡❤️”.
5. **Cách thưởng thức:** nên để Quỳnh tự khám phá; không gửi hướng dẫn dài hay bắt buộc xem vào thời điểm cụ thể.
6. **Sau khi xem:** hỏi Quỳnh căn phòng nào cô ấy thích nhất và muốn đặt thêm món đồ gì trong ngôi nhà chung.
7. **Cập nhật về sau:** mỗi dịp đặc biệt có thể thêm một món đồ/thư nhỏ; luôn giữ trải nghiệm ban đầu ổn định.

---

# 22. Bàn giao cuối cùng Codex phải nộp

Khi triển khai xong P0, yêu cầu agent tạo báo cáo trong `docs/worklog/our-home-implementation.md` bao gồm:

1. Branch, commit nền, worktree trước/sau và phạm vi file thay đổi.
2. Bảng “yêu cầu → file thực hiện → test/ảnh chứng minh → PASS/FAIL”.
3. Danh sách room/hotspot đã triển khai thực tế.
4. Danh mục asset, kích thước/định dạng, license, thiếu sót.
5. Kết quả unit/E2E/build/Pages verifier và regressions.
6. Giới hạn public-content/privacy đã báo cho Hùng.
7. Kết quả kiểm tra deployment thật **nếu được phép deploy**; nếu chưa deploy phải ghi rõ “Chưa kiểm tra website production”.
8. Các công việc P1/P2 còn lại và lý do chưa làm.
9. Cách thay nội dung thư, chọn ảnh và thêm phòng mới mà không phá kiến trúc.
10. Hướng dẫn rollback: revert commit theo phạm vi (không reset làm mất worktree khác), hoặc deploy lại commit production đã được kiểm chứng.

---

# 23. Tóm tắt quyết định chốt để tránh Codex hiểu sai

| Quyết định           | Đã chốt                                                      |
| ----------------------- | --------------------------------------------------------------- |
| Nền tảng              | Angular standalone + HTML/CSS/SVG                               |
| Kiểu không gian       | 2.5D isometric storybook,**không cần 3D engine cho P0** |
| Route                   | `/our-home`                                                   |
| Cấu trúc              | 1 cửa nhà + 5 phòng + finale                                 |
| Nội dung cốt lõi     | 5 thư, 5 dấu ấn, ảnh thật, hai múi giờ, hộp quà        |
| Tương tác đầu vào | Touch + mouse + keyboard; không phụ thuộc hover              |
| Trạng thái            | `localStorage` versioned + memory fallback                    |
| Dữ liệu ảnh          | `MemoryService`, không sửa `memories.generated.ts`        |
| Nhạc                   | Theo user gesture, cleanup khi rời route                       |
| Voice                   | Tùy chọn, chỉ ghi âm thật nếu Hùng cung cấp             |
| Hosting                 | GitHub Pages dưới`/hung-quynh-our-story/`                   |
| Riêng tư              | Nội dung static Pages công khai,**không có auth**     |
| Quà cuối              | Có thể mở trực tiếp; 4/5 stamp chỉ gợi ý                |
| Triển khai             | Theo từng phase; báo test/DoD trước khi tiếp tục          |
| Push/deploy             | Chỉ khi được cho phép                                      |

> **Câu chốt tinh thần của dự án:**
> “Anh không thể rút ngắn khoảng cách ngay lúc này. Nhưng anh có thể làm một nơi mà mỗi khi em bước vào, em biết rằng mình luôn được chờ đợi.” ❤️

# PHỤ LỤC A — Prompt tạo bộ minh họa đồng nhất (giao cho họa sĩ / công cụ tạo ảnh)

> **Mục đích:** tạo background tĩnh để làm scene, KHÔNG tạo component hoạt động bằng ảnh. Chữ, hotspot, nút, popup, đồng hồ và ảnh thật phải do Angular render thành layer riêng. Nội dung prompt này chỉ để Codex/họa sĩ sử dụng sau khi nhận được quyền tạo/duyệt asset.

## A.1. Art direction chung (áp dụng cho cả 6 cảnh)

```text
Create a cohesive set of six original 2.5D isometric storybook illustrations
for a romantic Vietnamese couple's small virtual home. Warm beige and cream,
soft dusty rose, natural walnut wood, gentle golden lamps, delicate Japanese
seasonal details without stereotypical clichés. Cozy, intimate, handmade,
subtle painterly texture, clean object separation, high readability.
Slightly elevated 3/4 isometric room perspective. Consistent camera angle,
proportions, palette, brushwork, and furniture style in every room.
No written text, no letters, no logos, no watermark, no UI, no photorealistic
faces, no existing copyrighted characters. Leave breathing room for overlays.
Deliver desktop-wide and mobile-safe compositions with the interactable
objects fully visible inside a central safe area. No cut-off doors, lamps,
letters, tables or clickable items.
```

**Cấu hình xuất đề xuất:**

- Source master: độ phân giải đủ cho desktop (ví dụ 1920×1200 hoặc tương đương), không ép một kích thước duy nhất nếu ảnh nguồn khác.
- Artifact sử dụng: WebP tối ưu (test quality ở 75–85 làm điểm khởi đầu rồi đánh giá bằng mắt, không coi là ngưỡng cứng).
- Mobile: một crop/compose riêng hoặc dùng `object-fit: contain` với background fill; hotspot chỉ map khi asset/layout đã chốt.
- Hotspot minh họa đồ vật có silhouette rõ; **không** có ánh sáng hover vẽ sẵn gây lẫn với trạng thái tương tác.
- Text do Angular render, không sinh text tiếng Việt vào ảnh vì dễ lỗi dấu/chữ.
- Dùng brand tokens của dự án, tránh thêm font mới và ảnh không rõ nguồn.

## A.2. Prompt từng cảnh (chỉ bổ sung sau art direction chung)

| Cảnh          | Bổ sung prompt                                                                                                                                                                           | Vị trí đồ vật phải nhìn rõ    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Cửa nhà      | `A tiny welcoming wooden cottage at twilight, a warm front door, glowing window lights, little mailbox, nameplate area, winding stone path, tiny flower pots.`                          | Door, mailbox, signboard              |
| Phòng khách  | `Cozy miniature living room with beige sofa, wall photo frames intentionally blank, vintage record player, soft standing lamp, low wooden table, comfortable rug.`                      | Photo wall, sofa, record player       |
| Căn bếp      | `Small cozy kitchen for two, gentle cream cupboards, round wooden breakfast table with two plates, steaming tea cup, fridge with blank pinned note, simple flowers.`                    | Tea cup, fridge note, two plates      |
| Góc học tập | `Warm little study nook with reading desk, notebook open with blank pages, adjustable desk lamp, plant, window hinting at a quiet Japanese neighborhood, subtle books.`                 | Lamp, notebook, window, date corner   |
| Phòng ngủ    | `Calm intimate small bedroom, warm bedside lamp, blanket and soft pillows, a wooden box with blank letter envelopes, teddy-bear-like pillow, moonlit window.`                           | Letter box, pillow, night lamp        |
| Ban công      | `Small peaceful balcony at night overlooking dreamy Japanese rooftops, a shared moon, two cozy chairs, two cups of tea, stars subtle and sparse, clear empty space for digital clocks.` | Moon, two chairs, clock overlay space |

**Lưu ý về phong cách thời gian:** mỗi cảnh được thiết kế trước với một trạng thái ánh sáng trung tính; các mood sáng/tối dùng CSS overlay hoặc asset variant kiểm soát. Không tạo 4×6 bộ ảnh chỉ để đổi giờ nếu chưa có nhu cầu và benchmark.

## A.3. Phiếu nghiệm thu asset

- [ ] Góc nhìn, chất liệu gỗ và palette 6 cảnh thống nhất.
- [ ] Tất cả đồ vật tương tác nhận diện được ở cỡ điện thoại 320 px.
- [ ] Bản crop mobile giữ đủ đồ vật dùng làm hotspot.
- [ ] Artwork không chứa chữ giả/đoạn thư/ảnh chân dung giả.
- [ ] Có thể tách hiệu ứng sáng/tối khỏi nền mà vẫn giữ tương phản văn bản.
- [ ] Nguồn/license và kích thước file ghi trong `public/our-home/README-assets.md`.
- [ ] Mất asset vẫn giữ UX đọc thư/điều hướng bằng HTML fallback.

---

# PHỤ LỤC B — Ma trận hotspot để giao task song song

| Mã    | Scene    | Object ID         | Action        | Content ID/nguồn       | Stamp             | P              |
| ------ | -------- | ----------------- | ------------- | ----------------------- | ----------------- | -------------- |
| ENT-01 | entrance | `door`          | navigate      | `living`              | —                | P0             |
| ENT-02 | entrance | `nameplate`     | dialog        | `home-welcome`        | —                | P0             |
| ENT-03 | entrance | `mailbox`       | dialog        | `door-postcard`       | —                | P0             |
| LIV-01 | living   | `photo-wall`    | photo-gallery | `selectedMemoryIds`   | `stamp-memory`  | P0             |
| LIV-02 | living   | `sofa`          | dialog        | `sofa-comfort`        | `stamp-memory`  | P0             |
| LIV-03 | living   | `record-player` | audio         | `music-tracks`        | —                | P0             |
| KIT-01 | kitchen  | `tea`           | reveal        | `tea-comfort`         | `stamp-care`    | P0             |
| KIT-02 | kitchen  | `fridge-note`   | dialog        | `kitchen-note`        | `stamp-care`    | P0             |
| KIT-03 | kitchen  | `two-plates`    | dialog        | `kitchen-table`       | —                | P0             |
| STU-01 | study    | `desk-lamp`     | toggle-light  | `study-lamp`          | —                | P0             |
| STU-02 | study    | `notebook`      | dialog        | `study-encouragement` | `stamp-courage` | P0             |
| STU-03 | study    | `window`        | dialog        | `study-window`        | `stamp-courage` | P0             |
| BED-01 | bedroom  | `letter-box`    | letter-box    | `sad                    | miss-me           | tired          |
| BED-02 | bedroom  | `pillow`        | reveal        | `bedtime-hug`         | —                | P0             |
| BED-03 | bedroom  | `night-lamp`    | toggle-light  | `bedroom-lamp`        | —                | P0             |
| BAL-01 | balcony  | `moon`          | reveal        | `moon-promise`        | `stamp-moon`    | P0             |
| BAL-02 | balcony  | `two-clocks`    | clocks        | `Asia/Ho_Chi_Minh       | Asia/Tokyo`       | `stamp-moon` |
| BAL-03 | balcony  | `empty-chair`   | dialog        | `empty-chair`         | —                | P0             |
| FIN-01 | common   | `gift-box`      | gift          | `final-letter`        | —                | P0             |

**Cảnh báo khi code:** `stamp` là idempotent (một dấu ấn chỉ thu một lần). Dấu ấn được quyết định bởi tương tác, không phải bởi việc render cảnh. Có thể mở finale trực tiếp dù chưa có dấu ấn.

---

**HẾT — HUNG_QUYNH_OUR_HOME_IMPLEMENTATION_PLAN.md**
