export type HubItemCategory = 'event' | 'utility';
export type HubItemStatus = 'available' | 'coming-soon';

export interface HubItem {
  id: string;
  category: HubItemCategory;
  title: string;
  description: string;
  dateLabel?: string;
  route?: string;
  status: HubItemStatus;
}
