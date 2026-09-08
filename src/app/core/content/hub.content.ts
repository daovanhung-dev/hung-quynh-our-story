import type { HubItem } from '../models/hub.model';

export const EVENT_ITEMS: readonly HubItem[] = [
  {
    id: 'birthday-2026',
    category: 'event',
    title: 'Sinh nhật vợ yêu',
    description: 'Một món quà nhỏ dành riêng cho tuổi 22 của Quỳnh.',
    dateLabel: '05 · 09 · 2026',
    route: '/birthday',
    status: 'available'
  }
];

export const UTILITY_ITEMS: readonly HubItem[] = [];
