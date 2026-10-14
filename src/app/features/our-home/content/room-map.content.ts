import type { HouseRoom } from '../models/our-home.model';

export const HOUSE_ROOMS: readonly HouseRoom[] = [
  {
    id: 'entrance',
    title: 'Cửa nhà',
    subtitle: 'H ♡ Q · Có một nơi đang chờ em về.',
    hotspots: [
      { id: 'door', label: 'Mở cửa vào phòng khách', visualLabel: 'Cửa', icon: '↗', action: 'navigate', payloadId: 'living' },
      { id: 'nameplate', label: 'Đọc tấm biển trước nhà', visualLabel: 'Biển nhà', icon: '♡', action: 'dialog', payloadId: 'home-welcome' },
      { id: 'mailbox', label: 'Mở hộp thư ngoài cửa', visualLabel: 'Hộp thư', icon: '✉', action: 'dialog', payloadId: 'door-postcard' }
    ]
  },
  {
    id: 'living',
    title: 'Phòng khách · Ký ức của chúng mình',
    subtitle: 'Một góc nhỏ để ngồi lại bên những ngày đã qua.',
    hotspots: [
      { id: 'photo-wall', label: 'Mở khung ảnh kỷ niệm', visualLabel: 'Ảnh', icon: '▧', action: 'photo-gallery', awardsStamp: 'memory' },
      { id: 'sofa', label: 'Ngồi nghỉ trên chiếc sofa', visualLabel: 'Sofa', icon: '♡', action: 'dialog', payloadId: 'sofa-comfort', awardsStamp: 'memory' },
      { id: 'record-player', label: 'Mở máy phát nhạc', visualLabel: 'Máy nhạc', icon: '♫', action: 'audio' }
    ]
  },
  {
    id: 'kitchen',
    title: 'Căn bếp · Mình cùng nghỉ một chút nhé',
    subtitle: 'Một cốc trà ấm và lời nhắc dịu dàng dành cho em.',
    hotspots: [
      { id: 'tea', label: 'Rót một cốc trà ấm', visualLabel: 'Trà ấm', icon: '♨', action: 'reveal', payloadId: 'tea-comfort', awardsStamp: 'care' },
      { id: 'fridge-note', label: 'Đọc lời nhắn trên tủ lạnh', visualLabel: 'Lời nhắn', icon: '▤', action: 'dialog', payloadId: 'kitchen-note', awardsStamp: 'care' },
      { id: 'two-plates', label: 'Ngắm bàn ăn của hai đứa mình', visualLabel: 'Bàn ăn', icon: '◉', action: 'dialog', payloadId: 'kitchen-table' }
    ]
  },
  {
    id: 'study',
    title: 'Góc học tập · Chồng tự hào về em',
    subtitle: 'Không cần làm tất cả hôm nay. Từng bước nhỏ cũng đáng quý.',
    hotspots: [
      { id: 'desk-lamp', label: 'Bật hoặc tắt đèn bàn', visualLabel: 'Đèn bàn', icon: '☼', action: 'toggle-light', payloadId: 'study-lamp' },
      { id: 'notebook', label: 'Mở trang sổ động viên', visualLabel: 'Sổ tay', icon: '▤', action: 'dialog', payloadId: 'study-encouragement', awardsStamp: 'courage' },
      { id: 'window', label: 'Nhìn ra ngoài cửa sổ', visualLabel: 'Cửa sổ', icon: '⌂', action: 'dialog', payloadId: 'study-window', awardsStamp: 'courage' }
    ]
  },
  {
    id: 'bedroom',
    title: 'Phòng ngủ · Mở khi em…',
    subtitle: 'Năm lá thư ở đây; em có thể chọn lá nào cũng được.',
    hotspots: [
      { id: 'letter-box', label: 'Mở hộp năm lá thư', visualLabel: 'Hộp thư', icon: '✉', action: 'letter-box' },
      { id: 'pillow', label: 'Nhận một cái ôm qua chiếc gối', visualLabel: 'Gối ôm', icon: '♡', action: 'reveal', payloadId: 'bedtime-hug' },
      { id: 'night-lamp', label: 'Bật hoặc tắt đèn ngủ', visualLabel: 'Đèn ngủ', icon: '☾', action: 'toggle-light', payloadId: 'bedroom-lamp' }
    ]
  },
  {
    id: 'balcony',
    title: 'Ban công · Hai phương trời, một ánh trăng',
    subtitle: 'Hai múi giờ, cùng một lời hẹn bình yên.',
    hotspots: [
      { id: 'moon', label: 'Ngắm cùng một vầng trăng', visualLabel: 'Mặt trăng', icon: '☾', action: 'reveal', payloadId: 'moon-promise', awardsStamp: 'moon' },
      { id: 'two-clocks', label: 'Xem đồng hồ Việt Nam và Nhật Bản', visualLabel: 'Đồng hồ', icon: '◷', action: 'clocks', awardsStamp: 'moon' },
      { id: 'empty-chair', label: 'Đọc lời nhắn bên chiếc ghế trống', visualLabel: 'Ghế đôi', icon: '♡', action: 'dialog', payloadId: 'empty-chair' }
    ]
  }
];

export const HOUSE_STAMP_IDS = ['memory', 'care', 'courage', 'letters', 'moon'] as const;
export const HOUSE_LETTER_IDS = ['sad', 'miss-me', 'tired', 'lonely', 'happy'] as const;
