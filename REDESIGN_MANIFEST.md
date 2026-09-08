# Redesign Manifest

Base repository: `daovanhung-dev/hung-quynh-our-story`
Base branch: `main`
Base commit audited: `7ad63def28c6d642db5332c6aea5cd21698af247`

## Files in this overlay

```text
hung-quynh-our-story-redesign/
├── APPLY_OVERLAY.md
├── REDESIGN_MANIFEST.md
├── angular.json
├── docs/
│   └── UI_REDESIGN_2026.md
└── src/
    └── styles/
        └── redesign.scss
```

## Covered views/components

- Global app shell/header/footer
- Home / Birthday Home
- Birthday Celebration
- Gift Reveal
- Envelope
- Love Letter
- Birthday Cake
- Timeline Page + Timeline Component
- Memory Card
- Memory Detail
- Photo Viewer
- Japan Notes
- Love Treasure + compact music dock
- Not Found / 404
- Desktop/tablet/mobile responsive behavior
- Reduced-motion behavior

## Safety choices

- No generated memory data edited.
- No routes edited.
- No business/state logic edited.
- No MP3/media removed.
- No hidden feature event logic edited.
- Existing `src/styles.scss` remains unchanged; redesign is loaded after it.

## Local validation performed for exported overlay

- `angular.json` JSON parse: PASS
- `redesign.scss` brace/parenthesis balance: PASS
- CSS parse using `tinycss2`: 0 parse errors

A full Angular build/E2E run requires the complete repository and installed dependencies/media; those are intentionally not duplicated inside this overlay ZIP.
