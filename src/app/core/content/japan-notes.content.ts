export interface JapanNoteChapter {
  id: string;
  japanese: string;
  title: string;
  text: string;
}

export const JAPAN_NOTE_CHAPTERS: readonly JapanNoteChapter[] = [
  {
    id: 'dormitory',
    japanese: 'ただいま',
    title: 'Ký túc xá',
    text: 'Về đến ký túc xá nhớ khóa cửa, giữ chìa khóa và thẻ thật cẩn thận. Về phòng rồi báo anh một tiếng nhé, để anh biết em đã an toàn.'
  },
  {
    id: 'study',
    japanese: 'がんばって',
    title: 'Học tập',
    text: 'Đi học đúng giờ, mang đủ tài liệu và đừng ngại hỏi khi chưa hiểu. Anh không cần em lúc nào cũng giỏi ngay, chỉ cần em cố gắng và nhớ nghỉ một chút.'
  },
  {
    id: 'food',
    japanese: 'ごはん',
    title: 'Ăn uống',
    text: 'Nhớ ăn đủ bữa và uống nước, dù hôm đó có bận đến đâu. Thử những món mới của Nhật nhé, nhưng đừng bỏ bữa vì anh sẽ lo.'
  },
  {
    id: 'sleep',
    japanese: 'おやすみ',
    title: 'Ngủ',
    text: 'Trời lạnh thì mặc ấm, về phòng nhớ sưởi ấm rồi hãy ngủ. Ngủ đủ giấc nhé, ngày mai mình còn có thêm một ngày mới để cố gắng.'
  },
  {
    id: 'road',
    japanese: '気をつけて',
    title: 'Đi đường',
    text: 'Đi đúng làn, nhìn đèn giao thông và giữ điện thoại thật kỹ. Nếu lạc đường hoặc có chuyện gì không ổn, đứng lại ở nơi sáng và gọi anh ngay nhé.'
  }
];
