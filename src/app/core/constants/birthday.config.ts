import type { BirthdayLetterBlock } from '../models/birthday.model';

export const BIRTHDAY_LETTER: readonly BirthdayLetterBlock[] = [
  { kind: 'salutation', text: 'Gửi người phụ nữ của đời anh!' },
  {
    kind: 'paragraph',
    text: 'Ngày 05 tháng 09 năm 2004, một cô gái đã xuất hiện trên thế giới. Và đến ngày 04 tháng 01 năm 2026, chúng mình chính thức gọi tên câu chuyện ấy bằng tình yêu.'
  },
  {
    kind: 'paragraph',
    text: 'Hôm nay em 22 tuổi. Anh đã nghĩ rất nhiều về món quà này, và cuối cùng anh muốn dành cho em một nơi có thể giữ lại những ngày chúng mình đã đi qua — những tấm ảnh, những kỷ niệm và cả những điều đôi khi anh không nói thành lời.'
  },
  {
    kind: 'paragraph',
    text: 'Cảm ơn em vì đã cùng anh đi qua những ngày vui, những ngày mệt, những lần chúng mình hiểu nhau và cả những lúc còn vụng về. Tình yêu của chúng mình không phải lúc nào cũng hoàn hảo, nhưng nếu được chọn lại, anh vẫn muốn gặp em.'
  },
  { kind: 'emphasis', text: 'Vẫn chọn làm quen với em.' },
  { kind: 'emphasis', text: 'Vẫn chọn yêu em.' },
  { kind: 'emphasis', text: 'Và vẫn muốn người cùng anh đi tiếp là em.' },
  {
    kind: 'paragraph',
    text: 'Tuổi 22 rồi, anh mong em sẽ thương bản thân mình nhiều hơn. Mong em khỏe mạnh, bình an, được làm những điều em yêu thích và ngày càng trở thành phiên bản mà chính em cảm thấy tự hào.'
  },
  {
    kind: 'paragraph',
    text: 'Anh không biết tương lai sẽ đưa chúng mình đến đâu. Nhưng nếu em vẫn muốn nắm tay anh, anh vẫn muốn cùng em đi qua thật nhiều ngày bình thường, thật nhiều chuyến đi, thật nhiều cột mốc và thật nhiều sinh nhật nữa.'
  },
  {
    kind: 'paragraph',
    text: 'Nếu có những ngày thế giới không dịu dàng với em, anh sẽ cố gắng dịu dàng với em nhiều hơn.'
  },
  { kind: 'emphasis', text: 'Chúc mừng sinh nhật 22 tuổi, tình yêu của anh.' },
  { kind: 'emphasis', text: 'Anh yêu em.' },
  { kind: 'signature', text: '— Hùng, người vẫn muốn cùng em đi qua thật nhiều sinh nhật nữa.' }
];
