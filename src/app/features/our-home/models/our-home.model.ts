export type HouseRoomId = 'entrance' | 'living' | 'kitchen' | 'study' | 'bedroom' | 'balcony';

export type HouseHotspotAction =
  | 'navigate'
  | 'dialog'
  | 'photo-gallery'
  | 'letter-box'
  | 'toggle-light'
  | 'reveal'
  | 'clocks'
  | 'audio';

export interface HouseHotspot {
  readonly id: string;
  readonly label: string;
  readonly visualLabel: string;
  readonly icon: string;
  readonly action: HouseHotspotAction;
  readonly payloadId?: string;
  readonly awardsStamp?: string;
}

export interface HouseRoom {
  readonly id: HouseRoomId;
  readonly title: string;
  readonly subtitle: string;
  readonly hotspots: readonly HouseHotspot[];
}

export interface HouseProgressV1 {
  readonly schemaVersion: 1;
  readonly introSeen: boolean;
  readonly exploredRooms: readonly HouseRoomId[];
  readonly collectedStamps: readonly string[];
  readonly openedLetters: readonly string[];
  readonly finaleSeen: boolean;
  readonly audioEnabled: boolean;
  readonly reducedMotionOverride: boolean | null;
}

export type HouseDialogState =
  | { readonly kind: 'copy'; readonly title: string; readonly copyId: string }
  | { readonly kind: 'gallery'; readonly title: string }
  | { readonly kind: 'letters'; readonly title: string }
  | { readonly kind: 'letter'; readonly title: string; readonly letterId: string }
  | { readonly kind: 'music'; readonly title: string }
  | { readonly kind: 'clocks'; readonly title: string }
  | { readonly kind: 'gift'; readonly title: string }
  | { readonly kind: 'reset'; readonly title: string };
