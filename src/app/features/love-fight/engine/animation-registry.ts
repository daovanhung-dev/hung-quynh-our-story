import { HUNG_ACTION_SOURCES, QUYNH_ACTION_SOURCES } from '../data/love-fight-assets';

export const loadQuynhActionTextures = (load: { image: (key: string, url: string) => void }): void => {
  Object.entries(QUYNH_ACTION_SOURCES).forEach(([action, source]) => load.image(`q-action-${action}`, source));
};

export const loadHungActionTextures = (load: { image: (key: string, url: string) => void }): void => {
  Object.entries(HUNG_ACTION_SOURCES).forEach(([action, source]) => load.image(`h-action-${action}`, source));
};

export const actionTextureKey = (fighter: 'q' | 'h', action: string): string => `${fighter}-action-${action}`;
