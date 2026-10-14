# Build và triển khai GitHub Pages

## Mô hình hosting

Đây là Angular project site được phục vụ dưới `/<repository-name>/`, không phải ứng dụng ở domain root. GitHub Actions build output tĩnh, upload `dist/our-story`, rồi triển khai lên môi trường `github-pages`. Ứng dụng không có route handler phía server hoặc xác thực.

## Build production trên máy local

Yêu cầu Node `>=22.22.3`, npm và dependency theo `package-lock.json`.

```bash
npm ci
npm run build:pages
```

`build:pages` chạy prebuild pipeline (tạo media variants, kiểm tra memory, sinh memory index), Angular production build với base href `/hung-quynh-our-story/`, bước chuẩn bị static host và artifact verification. Output là `dist/our-story/`. Lệnh có thể ghi lại file sinh có theo dõi `src/app/generated/memories.generated.ts`; xem `git status` và diff sau khi chạy.

Tác động phụ của các lệnh khác:

- `npm start` có `prestart` để chuẩn bị media và tạo lại memory index.
- `npm test` chạy `prepare:media` trước Node test runner.
- `npm run test:e2e` khởi động `npm start`, nên cũng gọi `prestart`.
- `npm run migrate:memories` di chuyển/đổi tên media nguồn theo EXIF. Đây là lệnh migration có chủ đích, không thuộc build.

## Build và các bước kiểm tra

- `angular.json` copy `public/` nhưng loại `images/memories/**/*.{jpg,jpeg,png,heic}`, `games/sf2.zip` và `games/LOVE_FIGHT_ASSET_PACK_v1/**/*`.
- Memory variants sinh tự động và asset runtime `public/games/love-fight/` nằm trong cây public được copy. Asset pack chỉ để tham khảo, không được copy như app asset.
- Dù tên có đuôi `.zip`, nội dung hiện tại của `public/games/sf2.zip` được nhận diện là trang HTML challenge, không phải ZIP archive. App không dùng file này và build loại nó theo path.
- `scripts/prepare-static-host.mjs` đổi font URL root-relative `/fonts/` thành `fonts/` tương đối trong HTML (kể cả critical CSS inline) và CSS đã compile, rồi copy HTML đã sửa thành `404.html` để SPA fallback và tạo `.nojekyll`. `scripts/verify-static-artifact.mjs` từ chối artifact nếu HTML/CSS còn font URL root-relative.
- `scripts/verify-static-artifact.mjs` yêu cầu `index.html`, `404.html`, `.nojekyll`, `favicon.svg` và media manifest của memory đã sinh; kiểm tra base href mong đợi, asset trong manifest, public path tuyệt đối không hợp lệ và file ảnh gốc theo matcher JPG/JPEG/PNG/HEIC hiện tại.
- Artifact verifier cũng yêu cầu `content/love-letter-miss-you.md`, đối chiếu SHA-256 `1752b77b6170143ff4ab77181da28d3a1a2e166d40c9901831f46bca58804186`, 30 dòng/10,220 bytes và byte equality giữa file gốc, public copy và artifact. Không cập nhật expected hash trừ khi chủ dự án thay thư có chủ đích.
- Trang `/hint/miss-you` fetch thư theo URL tương đối từ `document.baseURI`; track MP3 và background/gallery image cũng dùng path tương đối/base href. `angular.json` copy các asset mới từ `public/` vào `dist/our-story/`.
- Matcher ảnh gốc của artifact verifier chưa bao phủ WebP, AVIF, GIF hoặc HEIF. Nếu thêm các định dạng đó làm source memory, kiểm tra exclusion trong `angular.json` và verifier trước khi cho rằng chúng không vào artifact.

## Workflow hiện hành

`.github/workflows/deploy-pages.yml` chạy khi push lên `main` và khi gọi `workflow_dispatch`.

1. Build job checkout repo, chọn Node `22.22.3`, chạy `npm ci`, chuẩn bị media, validate/generate memory, chạy `npm test`, rồi build Angular production.
2. Workflow lấy `REPO_NAME` từ `GITHUB_REPOSITORY` để tạo `--base-href` cho Angular.
3. Workflow chuẩn bị static hosting, kiểm tra file bắt buộc, chạy `npm run verify:artifact`, cấu hình Pages và upload `dist/our-story` bằng `actions/upload-pages-artifact@v4`.
4. Deploy job chờ build, dùng môi trường `github-pages` và deploy qua `actions/deploy-pages@v4`.

Workflow cấp quyền `contents: read`, `pages: write`, `id-token: write`; deploy phụ thuộc build job. Đây là luồng GitHub mô tả: build → upload artifact → deploy với quyền Pages/OIDC phù hợp. [Tài liệu GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Phụ thuộc vào tên repository

Tên repo hiện tại là `hung-quynh-our-story`. Các vị trí sau còn chứa path cố định `/hung-quynh-our-story/`:

- Script `build:pages` trong `package.json`.
- Base href kỳ vọng trong `scripts/verify-static-artifact.mjs`.
- Lệnh `grep` kiểm tra sau build trong `.github/workflows/deploy-pages.yml`.

Workflow có tính base href trong lệnh build, nhưng bước kiểm tra cuối và artifact verifier vẫn đòi path cố định hiện tại. Trước khi đổi tên repo hoặc URL Pages, cập nhật và kiểm tra đồng bộ cả ba vị trí. Một mình lệnh build động không làm workflow portable.

## Giới hạn của bằng chứng

- `npm run build:pages` chứng minh artifact production local đã được tạo và kiểm tra bởi script của repo.
- GitHub Actions build thành công chứng minh artifact đã upload; deploy job thành công và URL Pages được truy cập mới chứng minh bước triển khai hoàn tất.
- Build local không xác nhận cấu hình Pages của repository, khả năng truy cập từ xa, refresh route con trên site đã deploy hoặc hành vi trình duyệt sau deploy. Báo cáo riêng các phần đó.
- Artifact upload là static content công khai. Không để secret trong đó hoặc mô tả site là private/có kiểm soát truy cập.
- Gate `HyeuQ` chỉ là surprise gate phía client; thư, nhạc và ảnh được đóng gói vào artifact vẫn tải công khai qua Pages. Không đưa private credentials vào static build.
