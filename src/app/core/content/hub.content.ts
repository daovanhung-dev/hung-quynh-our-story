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
  },
  {
    id: 'love-fight-2026',
    category: 'event',
    title: 'Dỗ Vợ — LOVE FIGHT',
    description: 'Vợ đang dỗi? Vào đây xử chồng một trận rồi mình làm lành ❤️',
    dateLabel: 'MỘT TRẬN LÀM LÀNH',
    route: '/love-fight',
    status: 'available'
  }
];

export const UTILITY_ITEMS: readonly HubItem[] = [
  {
    id: 'memory-museum',
    category: 'utility',
    title: 'Bảo tàng ký ức 3D',
    description: 'Đi bộ qua những căn phòng được dựng từ tất cả ngày chúng mình đã có nhau.',
    route: '/museum',
    status: 'available'
  }
];
