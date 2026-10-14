# Our Home implementation worklog

## PHASE 0 — Baseline and scope

- Date: 2026-10-13 (Asia/Bangkok)
- Branch: `main`
- Baseline commit: `40d35ea feat(miss-you): implement autoplay functionality for music player with manual fallback`
- Initial worktree: one existing user change, `?? docs/tasks/HUNG_QUYNH_OUR_HOME_IMPLEMENTATION_PLAN.md`; kept in place and unchanged.
- Requested outcome: implement the P0 Our Home experience at `/our-home` from the supplied plan.
- In scope: lazy route, six rooms, room hotspots and navigation, room copy and five letters, real memory photos through `MemoryService` and `PhotoViewerComponent`, Vietnam/Japan clocks, validated local progress, skip-able finale, reduced motion, responsive and keyboard support, focused contract/E2E coverage, Pages build verification.
- Out of scope: P1/P2 polish, private hosting or backend, copying/changing Miss You content, changes to Museum/LOVE FIGHT, an Event Hub card (Hùng chose a direct link), commit, push, deploy, and QR creation (not authorized for now).
- Baseline asset gap: no Our Home artwork or curated photo IDs existed. The repo already had five public music tracks with Hùng's public-use approval recorded in the 2026-10-10 Miss You worklog, but the initial Our Home implementation did not connect them. Six small original SVG room illustrations, a four-photo selection, and a gesture-gated room music player are now supplied. Hùng approved the current welcome, five letters, final message, six SVG scenes, and four selected photos for public release. No Hùng voice recording was supplied.
- Photo source: use a deterministic slice of existing `MemoryService.getAllImageMedia()`; do not copy source media or edit generated memory files.
- Route impact: `/our-home` and its lazy route registration. `AppComponent` hides the shared footer only while the `/our-home` chunk is loading, then restores it after navigation; a local CLS probe showed this removes a footer shift without changing other routes. Event Hub content, Museum, LOVE FIGHT, Miss You, and GitHub Pages configuration are unchanged.

### Baseline commands

| Command | Result | Notes |
| --- | --- | --- |
| `node --version` | PASS | `v22.23.3`, meets project requirement. |
| `npm ci` | PASS | Installed lockfile dependencies; npm reported 11 audit advisories (3 moderate, 5 high, 3 critical). No audit fix was applied. |
| `npm run check:scripts` | PASS | All listed script syntax checks passed. |
| `npm test` before `npm ci` | BLOCKED | `heic-convert` was absent from `node_modules`; no tests ran. |
| `npm test` after `npm ci` | PASS | 26 tests passed, 0 failed. Media preparation generated variants for 349 images. |
| `npm run build:pages` | PASS | Build and artifact verification passed; 1520 asset references verified, letter hash intact, no original images deployed. Two existing component CSS budget warnings were reported for LOVE TREASURE and LOVE FIGHT. |

### Baseline source map and risks

- Route ownership: `src/app/app.routes.ts`; standalone lazy pages; no existing Our Home feature.
- Shared frame: `src/app/app.component.ts`; keep current header/footer behavior.
- Memory integration: `MemoryService.getAllImageMedia()` returns generated responsive media; `PhotoViewerComponent` supplies native dialog, keyboard, swipe, focus restore, and cleanup.
- Date precedent: `features/miss-you/days-apart.ts` uses IANA time zones; Our Home will use independent Japan/Vietnam clock logic.
- Pages: base href `/hung-quynh-our-story/`, static `404.html` fallback and artifact verifier are already in place; no Pages configuration changes are needed.
- Main risks: all static content and media in Pages are public; the existing public music catalog is available only after a user gesture, and no Hùng voice recording exists; generated media preparation is CPU intensive and may rewrite ignored output. Production deployment remains unapproved.

### Baseline verification evidence

- Initial `git status --short` showed only the untracked plan file.
- `npm run check:scripts`: exit 0.
- `npm test`: exit 0 after dependencies were installed; 26/26 passing.
- `npm run build:pages`: exit 0; artifact verifier reported `Static artifact OK: 1520 asset references verified; letter hash verified; no original images deployed.`
- Generated `src/app/generated/memories.generated.ts` had no diff after the baseline build.

## PHASES 1–13 — Local implementation and QA

- Date completed: 2026-10-14 (Asia/Bangkok).
- Local P0 route, interaction, storage, accessibility, asset-fallback, and test work is implemented. Hùng approved the current welcome, five letters, final message, original SVG art, and four selected photos. Phase 14 production actions remain deferred because Hùng chose direct-link sharing and explicitly declined commit/deploy for now.

| Requirement | Implementation | Evidence/result |
| --- | --- | --- |
| Typed rooms, actions, progress, and content | `src/app/features/our-home/models/our-home.model.ts`; `content/room-map.content.ts`, `house-copy.content.ts`, `letters.content.ts` | Contract tests confirm six rooms, 18 unique in-bounds hotspots, known payloads, five letter IDs, and final-letter content. The approved letters and finale are shown without draft warnings. |
| Six house scenes with honest fallback | `public/our-home/rooms/*.svg`; `components/house-scene.component.ts/.scss`; `public/our-home/README-assets.md` | Six original, locally served SVGs, 1.9–2.25 KB each (12,368 bytes total); no external references or scripts. The current room loads directly; after idle, one adjacent room gets a base-aware `rel=prefetch` image hint. The 800:520 artwork, stage, and hotspot coordinates stay aligned at every target width; E2E verifies all load and that controls continue when requests fail. |
| Lazy route and scene shell | `src/app/app.routes.ts`; `our-home.page.ts/.scss` | Direct `/our-home` browser flow passes. The latest production output contains a lazy `our-home-page` chunk (80.31 KB raw; estimated 19.03 KB transfer after idle prefetch and the contrast adjustment). No Three.js or Phaser import was added to that route. |
| Entrance and free navigation | `room-map.content.ts`; `components/room-navigation.component.ts`; page intro handlers | First visit darkens the entrance, the greeting fades the overlay, then entry opens the living room. Reduced motion skips the wake animation. The skip path remains available; all rooms can be selected directly, touch swipes move to adjacent rooms, and left/right arrows move among focused room controls. Scene art fades and slides in after each load. |
| Memory gallery and photo viewer | `content/photo-selection.ts`; `our-home.page.ts` | Uses four explicit existing IDs from the relationship-start date, without copying source photos, and reuses `PhotoViewerComponent`. Hùng approved IDs 3745, 7226, 7230, and 7235 (elevator and photo-booth couple portraits) for public release. Failed image requests show a fallback. |
| Kitchen, study, lights, and clocks | `house-copy.content.ts`; `services/house-time.*`; `components/two-clocks.component.ts` | Tea and lamp interactions, Japan date, IANA Japan/Vietnam clocks and mood boundaries are covered by unit/E2E checks. No study timetable or weather is fabricated. |
| Five letters, replayable gift, and local progress | `content/letters.content.ts`; `components/final-gift.component.ts`; `services/our-home-progress.service.ts` | All five approved letters reopen; gift is available at 0/5, highlights after 4/5 without locking, animates the lid and five light particles, and includes replay/home/Event Hub/timeline actions. Storage schema, duplicate/unknown IDs, refresh, blocked storage, and reset behavior are covered. |
| Accessibility and small-screen behavior | `house-scene.component.scss`; `house-dialog.component.ts`; page/component styles | Keyboard, Escape, roving arrow navigation, focus trapping/restoration, backdrop dismissal, 200% text scaling, reduced motion, safe-area dialog sizing, no horizontal overflow, adjacent-room touch swipe and non-overlapping >=44 px hotspots pass. Uncollected stamp text uses the shared muted-text token; its measured contrast is 5.31:1 against the paper surface. Hotspots have a soft slow glow; letters unfold, tea steams, the pillow gives a one-shot hug, and the finale sends five hearts. Those effects stop under reduced motion. The desktop matrix covers 320, 360, 375, 390, 768, 1024, 1366, and 1440 px, and also verifies the art/stage ratio; mobile runs the interaction flows separately. A 320 px visual audit found and fixed the prior 4:3 mobile crop plus several hotspot/object mismatches. |
| Automated verification and Pages artifact | `test/our-home-content.test.mjs`; `e2e/our-home.spec.ts` | Results below. Production artifact includes all six SVGs at `dist/our-story/our-home/rooms/`. |

### Implemented room actions

| Room | Hotspots / actions |
| --- | --- |
| Entrance | door → living, nameplate copy, mailbox copy |
| Living room | photo gallery, sofa comfort copy, record-player playlist using the existing public `MUSIC_TRACKS` catalog |
| Kitchen | tea reveal, refrigerator note, two-plate copy |
| Study | desk lamp toggle, encouragement copy, window copy |
| Bedroom | five-letter chooser, pillow reveal, night-lamp toggle |
| Balcony | moon reveal, two clocks, empty-chair copy |

### Approved photo set

These four approved IDs make up the gallery selection; all are from 2026-01-04 (the configured relationship start date). A temporary contact sheet was used locally to inspect the full 15-image date group; it was kept outside the repository and removed after review.

| ID | Selected image |
| --- | --- |
| `2026-01-04-img-3745` | Couple portrait in an elevator |
| `2026-01-04-img-7226` | Themed photo-booth portrait |
| `2026-01-04-img-7230` | Wider elevator portrait |
| `2026-01-04-img-7235` | Playful photo-booth pose |

The selector excludes the two pre-relationship solo photos and avoids the ring closeups. Hùng approved this selection for public release.

### Final verification

| Command | Result | Notes |
| --- | --- | --- |
| `npm test` | PASS | 35 tests passed, 0 failed after adding the contrast contract for uncollected stamp labels. |
| `npx playwright test e2e/our-home.spec.ts --reporter=line` | PASS | Final route-suite run: 28 passed, 2 skipped across desktop/mobile. The skips are the desktop copy of touch-only swipe and mobile copy of the desktop viewport matrix. It covers keyboard/touch entry, one-room idle prefetch with base-path resolution, reduced motion, swipe and arrow navigation, minute-boundary and visibility-return clock updates, hotspot glow, tea/pillow/letter/gift motion, music lifecycle, and the 800:520 stage/art ratio across the viewport matrix. |
| `npm run check:scripts` | PASS | Re-run after the static-host font-path fix; all repository script syntax checks passed. |
| `npm run build:pages` | PASS | Rebuilt after the final contrast adjustment. Static-host preparation rewrites HTML and emitted CSS before making the 404 fallback; artifact verification rejects remaining root-relative font URLs. Production base path retained; 1520 references, letter hash intact, no original images deployed, and all six Our Home SVG files present. |
| `npm run verify:artifact` | PASS | The final `npm run build:pages` ran the verifier; 1520 references, letter hash intact, no original images deployed, and the six room SVGs present. |
| `git diff --check` | PASS | No whitespace errors. |
| `npm run test:e2e -- --reporter=line` | PARTIAL | Final full run after prefetch and contrast updates: 135 passed, 15 failed, 12 skipped (162 total, 4 workers). All 30 Our Home desktop/mobile cases passed apart from the two expected project-specific skips. Failures are in Miss You, Museum, Origami/Unsaid, and LOVE FIGHT; the baseline comparison and serial reruns below classify recurring and load-sensitive results. |

The latest full E2E run's 15 failures were: Miss You reduced-motion (desktop/mobile); Museum Event Hub entry (desktop/mobile), photo catalog (desktop/mobile), audio/HUD (desktop/mobile), dialogue bubbles (desktop/mobile), visitor/texture budget (desktop), and mobile-control sizing (mobile); Origami reduced-motion (desktop); and Event Hub → LOVE FIGHT navigation (desktop/mobile). No Our Home test failed. A baseline comparison on untouched commit `40d35ea` ran the same 18 selected test/project cases in a temporary detached worktree using its own `ng serve` and the existing generated media. Baseline reported 15 failed and 3 skipped; the current tree reported 12 failed, 3 passed, and 3 skipped in that selected run. That comparison established that recurring Miss You, Museum, and LOVE FIGHT failures predate Our Home, but it did not cover every pair in this latest full run. After earlier full runs, the additional Museum Event Hub mobile, LOVE FIGHT Event Hub mobile, and LOVE TREASURE Enter-key hold desktop pairs passed in serial reruns across both projects (6/6 passes). The Origami reduced-motion pair from the latest full run also passed when rerun serially (2/2). These results vary with full-suite load; the isolated route suite remains green.

The production build reported only the same two component CSS warnings seen at baseline: LOVE TREASURE (19.99 KB against a 12 KB budget) and LOVE FIGHT (19.09 KB against a 12 KB budget). The new Our Home scene stylesheet is below budget and produced no new CSS warning. The final Our Home lazy chunk is 80.31 KB raw / 19.03 KB estimated transfer; initial bundles are 292.34 KB raw / 78.29 KB estimated transfer. The six scene SVGs total 12,368 bytes; the largest is 2,251 bytes. The player uses existing MP3s and loads no audio in the initial route.

### Local performance probe

A temporary Playwright `PerformanceObserver` probe on Chromium through `ng serve` at 390×844 measured LCP 1.05 s and CLS 0.019 after the route-aware footer loading state. Before that state, CLS was 0.215; the large shift source was the shared footer appearing before the lazy page and moving below the viewport. The remaining CLS entries came from the welcome/control/scene layout during rendering.

A first 4G-throttled artifact probe exposed a real deployment-path issue: font URLs in the HTML's inline critical CSS still pointed to `/fonts/`, although emitted external CSS was already rewritten. `scripts/prepare-static-host.mjs` now rewrites root-relative font URLs in both HTML and emitted styles before copying the prepared HTML to `404.html`, and `scripts/verify-static-artifact.mjs` checks that neither HTML nor CSS contains root-relative font URLs. The final artifact was tested in Chromium at 390×844 with cache disabled, 150 ms RTT, 1.6 Mbps down, and 750 Kbps up, with gzip enabled for HTML/CSS/JS/SVG. After the base-aware idle-prefetch implementation, the rerun measured LCP at 1.888 s and CLS at 0.01975; the living-room art response completed about 344 ms after skipping the welcome, and all four selected gallery images decoded by 5.449 s from navigation. The correct Pages-style server returned the expected 404 document for the direct route while serving real scene/gallery assets under `/hung-quynh-our-story/`; Angular rendered the route with no failed asset requests or page errors. A separate 320 px visual audit confirmed the full artwork remains visible and hotspots align with the named objects. A separate real-media smoke loaded the first catalog MP3 only after the Play click, received HTTP 200 under the Pages base path, decoded 215.2 seconds of duration, and closed/released the audio element after Escape. These are local Chromium measurements, not a Lighthouse run, physical-device test, or evidence from live GitHub Pages.

### Phase 14 publication gate and remaining work

- Phase 14 status: Hùng approved the current welcome, five letters, final message, six original SVG scenes, and four selected photos. He chose to share a direct link, so no Event Hub card was added. Existing public music catalog tracks are available in the Our Home player under the earlier public-use approval record. The implementation is committed locally; push, GitHub Actions deploy, live Pages/mobile verification, and QR generation are not authorized yet. No voice recording is included.
- The record-player uses the existing five-track public catalog, whose public-use approval is recorded in the existing Miss You worklog. It requires a play gesture, uses `preload="none"`, persists mute preference, and pauses/releases the source when its dialog or route closes. No Hùng voice recording is included. There is no new Event Hub card. The project remains a static public site; browser-local progress is not access control, and any shipped asset/content is public.
- P1/P2 are deferred: character/chibi animation, real voice, seasonal themes, mini-game, and shareable room query state. No backend or new runtime engine was added.
- The implementation plan file was user-provided and remains unchanged and uncommitted. No push or deployment was made. Production URL has not been checked; local Pages build is not deployment evidence.

### Editing and rollback notes

- Hùng can revise the copy in `content/house-copy.content.ts` and `content/letters.content.ts`, change the approved photo IDs in `content/photo-selection.ts`, and replace project-owned art under `public/our-home/rooms/` while preserving the six room IDs/viewBox and hotspot-safe composition.
- To add a room, update `HouseRoomId`, `room-map.content.ts`, add a corresponding local art file, update the SVG contract test and the E2E room matrix, then rerun the documented checks.
- To revert this implementation after it is committed, use `git revert <commit-sha>`. The supplied plan remains outside that commit; retain or separately edit this worklog as desired.
