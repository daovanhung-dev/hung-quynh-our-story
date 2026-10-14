# Our Home asset inventory

## Room art

Each room now uses an original square 2.5D miniature diorama as its primary scene. The six WebP backgrounds were generated with the built-in image-generation tool using the supplied bedroom image as a camera and style reference, then saved locally. Each is 1024 × 1024 pixels; together they are about 667 KB. They make no runtime calls to an image service and load without a 3D engine. The corresponding project-authored SVG is retained as a lightweight local fallback; a CSS fallback keeps the navigation and controls available if both files fail.

The scene stage preserves a 1:1 ratio and uses `object-fit: contain`; hotspot percentages align with the objects in the matching scene. Keep both assets and the coordinates in `content/room-map.content.ts` in sync when replacing artwork. The current room loads directly, and the next room's WebP is prefetched after the browser is idle.

| Primary scene | Interactable objects placed for hotspots | Fallback |
| --- | --- | --- |
| `rooms/entrance-isometric.webp` | Door, name plaque, mailbox | `rooms/entrance.svg` |
| `rooms/living-isometric.webp` | Memory frames, sofa, record player | `rooms/living.svg` |
| `rooms/kitchen-isometric.webp` | Kettle, fridge note, dining table | `rooms/kitchen.svg` |
| `rooms/study-isometric.webp` | Window, notebook, desk lamp | `rooms/study.svg` |
| `rooms/bedroom-isometric.webp` | Pillows, letter box, night lamp | `rooms/bedroom.svg` |
| `rooms/balcony-isometric.webp` | Moon, two clocks, chair | `rooms/balcony.svg` |

The prompt set used one shared direction—square orthographic isometric cutaway-room diorama, warm storybook materials, deep plum surround, no people or text—with one composition prompt per room placing its interactive objects near their hotspot locations. The entrance prompt applies the same miniature-render style to the cottage exterior.

| Asset | Source | License/status |
| --- | --- | --- |
| Six `*-isometric.webp` scenes | Original generated illustrations guided by the user-provided style reference | Project assets; no external asset or runtime service |
| Six `*.svg` fallbacks | Project-authored SVG shapes and gradients | Original project assets; no external asset |
| Memory gallery | Existing responsive variants supplied by `MemoryService` | Hùng approved the four selected photos for public release; existing public site media pipeline |
| Music | Existing `MUSIC_TRACKS` catalog from `public/mp3/` | Five tracks already used by public site features; the 2026-10-10 Miss You worklog records Hùng's public-use approval. Our Home loads a selected track only after a play action and stops it when its dialog/route closes. |
| Hùng voice recording | None included | Optional; no recording was supplied |
| Couple character/chibi | None included | None supplied; no likeness is implied |

## Publication status

Hùng approved the current welcome, five letters, final message, original room artwork and four selected photos for public release. Public-use rights for the existing music catalog were recorded in `docs/worklog/2026-10-10-miss-you-secret-page.md`; the Our Home player uses those already-public files, never autoplays, and does not preload audio before a play action. No Hùng voice recording was supplied. This is a static public feature: all pages and media included in a GitHub Pages artifact are public, and the feature does not add authentication or private storage. Production deployment has not been authorized or performed.
