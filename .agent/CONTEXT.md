# AI Coding Context — Our Story

## Goal

Build a private-feeling, romantic static photo timeline for Hùng and Quỳnh. The experience should feel like opening a digital memory book, not using a photo-management dashboard.

## Hard constraints

1. Frontend Angular standalone components.
2. Static-only: no backend, database, Supabase, Firebase or server API.
3. Photos live under `public/images/memories/YYYY/MM/DD/`.
4. Never hard-code memories in components.
5. `src/app/generated/memories.generated.ts` is build-generated and must not be manually edited.
6. Keep animation subtle; respect `prefers-reduced-motion`.
7. Mobile-first and image-first.
8. Avoid new dependencies unless native browser/CSS/Angular cannot solve the requirement cleanly.
9. No secrets or credentials in source.
10. Preserve GitHub Pages static fallback behavior.

## Main flow

```text
Images + optional metadata.json
  -> validate-memories.mjs
  -> generate-memory-index.mjs
  -> MemoryService
  -> Home/Timeline
  -> Memory Detail
  -> Photo Viewer
```

## Next implementation priorities

1. Real image optimization pipeline (thumbnail/medium/original).
2. Reserve aspect ratio to reduce CLS.
3. Image error placeholder.
4. Prefetch adjacent viewer images.
5. Better month grouping inside year timeline.
6. E2E tests for direct route / refresh / mobile viewer.
