import type { MuseumAssetDefinition } from '../models/museum.model';

const KENNEY_SOURCE = 'https://www.kenney.nl/assets/blocky-characters';

/**
 * Local-only museum assets. Environment and prop entries describe the
 * procedural sets built by MuseumSceneComponent; visitor entries are the
 * downloaded Kenney GLB variants used when WebGL can load them.
 */
export const MUSEUM_ASSETS: readonly MuseumAssetDefinition[] = [
  {
    id: 'gallery-architecture',
    kind: 'environment',
    src: 'museum-assets/procedural/gallery-architecture.json',
    sourceUrl: 'https://polyhaven.com/license',
    license: 'CC0'
  },
  {
    id: 'gallery-props',
    kind: 'prop',
    src: 'museum-assets/procedural/gallery-props.json',
    sourceUrl: 'https://polyhaven.com/license',
    license: 'CC0'
  },
  ...(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const).map((variant) => ({
    id: `visitor-${variant}`,
    kind: 'visitor' as const,
    src: `museum-assets/kenney/blocky-characters/character-${variant}.glb`,
    sourceUrl: KENNEY_SOURCE,
    license: 'CC0' as const
  }))
];

export const MUSEUM_VISITOR_ASSETS = MUSEUM_ASSETS.filter((asset) => asset.kind === 'visitor');
