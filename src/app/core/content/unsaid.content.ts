export interface UnsaidNote {
  readonly id: string;
  readonly text: string;
}

export const UNSAID_NOTES: readonly UnsaidNote[] = [
  {
    id: 'late-night-messages',
    text: 'Có những đêm em đã ngủ rồi, anh vẫn mở lại tin nhắn của mình — chỉ để được nghe giọng em qua những dòng chữ thêm một lần.'
  },
  {
    id: 'you-are-okay',
    text: 'Có những ngày anh mỏi mệt đến mức chẳng muốn nói gì, nhưng chỉ cần biết em vẫn bình an, lòng anh đã dịu xuống.'
  },
  {
    id: 'ordinary-days',
    text: 'Anh yêu cả những ngày mình chẳng làm gì đặc biệt — một bữa cơm, một đoạn đường, một khoảng im lặng — vì bên em, bình thường cũng hóa thành kỷ niệm.'
  },
  {
    id: 'future-plans',
    text: 'Từ khi có em, những dự định của anh không còn chỉ có một mình; trong mỗi ngày mai, anh đều muốn chừa một chỗ thật đẹp cho em.'
  },
  {
    id: 'understand-you',
    text: 'Anh biết mình chưa phải người luôn hiểu em ngay từ lần đầu, nhưng anh thương cả những điều cần thời gian để lắng nghe.'
  },
  {
    id: 'love-better',
    text: 'Vì thế, anh muốn học cách yêu em dịu dàng hơn mỗi ngày — biết lắng nghe, biết ở lại, và biết ôm em lâu hơn khi em mỏi mệt.'
  },
  {
    id: 'hard-days',
    text: 'Rồi sẽ có những ngày mình giận nhau, bận rộn, mỏi mệt, thậm chí cách xa; nhưng anh mong mình luôn nhớ đường quay về bên nhau.'
  },
  {
    id: 'choose-you',
    text: 'Nếu được trở lại ngày đầu tiên, giữa vô vàn ngã rẽ, anh vẫn sẽ đi về phía em — chậm thôi, nhưng chắc chắn và bằng cả trái tim.'
  }
] as const;

export const UNSAID_FINAL = {
  prelude: 'Thật ra, sau tất cả những điều chưa kịp nói, điều anh muốn em nhớ nhất là:',
  main: 'Anh vẫn muốn chọn em.',
  after: 'Chọn em trong những ngày rực rỡ, trong những ngày bình thường, hôm nay, ngày mai, và cả những ngày rất xa sau này.'
} as const;
