# Our Home asset inventory

## Room art

The six room scenes are original, locally served SVG illustrations. They use no third-party artwork, external image service, scripts, or game engine. If an illustration cannot load, the room keeps its controls and shows an in-page CSS fallback.

All six scenes use a `800 × 520` viewBox. The responsive stage preserves that ratio, and hotspot coordinates map directly to percentages of the full illustration; keep the viewBox and artwork composition aligned when replacing a scene. The image uses `object-fit: contain` to prevent the mobile crop from shifting hotspots away from the objects.

| Asset | Source | License/status |
| --- | --- | --- |
| `rooms/entrance.svg`, `living.svg`, `kitchen.svg`, `study.svg`, `bedroom.svg`, `balcony.svg` | Project-authored SVG shapes and gradients | Original project assets; no external asset |
| Memory gallery | Existing responsive variants supplied by `MemoryService` | Hùng approved the four selected photos for public release; existing public site media pipeline |
| Music | Existing `MUSIC_TRACKS` catalog from `public/mp3/` | Five tracks already used by public site features; the 2026-10-10 Miss You worklog records Hùng's public-use approval. Our Home loads a selected track only after a play action and stops it when its dialog/route closes. |
| Hùng voice recording | None included | Optional; no recording was supplied |
| Couple character/chibi | None included | Replaced with simple heart illustration; no likeness is implied |

## Publication status

Hùng approved the current welcome, five letters, final message, six original SVG scenes, and four selected photos for public release. Public-use rights for the existing music catalog were recorded in `docs/worklog/2026-10-10-miss-you-secret-page.md`; the Our Home player uses those already-public files, never autoplays, and does not preload audio before a play action. No Hùng voice recording was supplied. This is a static public feature: all pages and media included in a GitHub Pages artifact are public, and the feature does not add authentication or private storage. Production deployment has not been authorized or performed.
