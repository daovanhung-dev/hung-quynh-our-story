export interface HouseLetter {
  readonly id: 'sad' | 'miss-me' | 'tired' | 'lonely' | 'happy';
  readonly label: string;
  readonly icon: string;
  readonly body: string;
}

export const HOUSE_LETTERS: readonly HouseLetter[] = [
  {
    id: 'sad', label: 'Mở khi em buồn', icon: '🥺',
    body: 'Vợ iu ơi, hôm nay có chuyện khiến em buồn à? Chồng không biết chính xác điều gì đã xảy ra, nhưng chồng mong em đừng phải gồng mình mọi lúc. Nếu muốn kể, chồng sẽ lắng nghe. Nếu chưa muốn nói, em cứ nghỉ một chút cũng được. Chồng thương em, kể cả những ngày em không vui. ❤️'
  },
  {
    id: 'miss-me', label: 'Mở khi em nhớ chồng', icon: '❤️',
    body: 'Chồng cũng nhớ em nhiều lắm. Có những lúc chỉ ước được ngồi cạnh em, nghe em kể một ngày rất bình thường. Mình chưa thể ở ngay bên nhau, nhưng tình cảm của chồng dành cho em vẫn ở đây, ngày nào cũng vậy. 🥹'
  },
  {
    id: 'tired', label: 'Mở khi em mệt', icon: '🌷',
    body: 'Em đã cố gắng rồi, bé yêu ạ. Mình nghỉ một chút nhé, uống nước, ăn một bữa ngon và ngủ đủ nếu có thể. Hôm nay không cần phải hoàn thành tất cả mọi thứ mới xứng đáng được yêu thương đâu. 🌷'
  },
  {
    id: 'lonely', label: 'Mở khi em cô đơn', icon: '🌙',
    body: 'Ở một nơi xa lạ, đôi khi sẽ có những buổi tối thật yên. Chồng ước gì có thể nắm tay em ngay lúc ấy. Nếu em muốn, hãy nhắn cho chồng một câu thật ngắn thôi: “Em nhớ nhà.” Chồng sẽ biết em đang cần một cái ôm. 🌙'
  },
  {
    id: 'happy', label: 'Mở khi em có tin vui', icon: '✨',
    body: 'Ơ kìa, vợ iu có tin vui phải khum! Chồng chúc mừng em bé của chồng nhóooo! Dù là chuyện lớn hay nhỏ, chồng đều muốn được nghe. Chồng tự hào về em và mong em cũng tự hào về chính mình. ✨'
  }
];

export const FINAL_LETTER = `Gửi vợ yêu của anh,\n\nChồng làm căn nhà nhỏ này vì có những điều đôi khi một cuộc gọi vẫn chưa nói hết được. Anh biết Nhật Bản có thể mang đến cho em nhiều trải nghiệm mới, cả những ngày vui lẫn những buổi tối nhớ nhà. Anh muốn em nhớ rằng, dù không thể đứng ngay cạnh em lúc này, anh vẫn luôn mong em được bình an, được yêu thương và được là chính mình.\n\nTừng căn phòng ở đây không thay cho một cái ôm thật. Nó chỉ là cách chồng nói với em rằng: trong lòng anh, chúng mình vẫn đang cùng xây một mái nhà. Và anh sẽ tiếp tục cố gắng, để một ngày những lời hẹn này được kể ngay bên cạnh em.\n\nChồng yêu Quỳnh. Hôm nay, ngày mai và trong những ngày mình còn cùng nhau cố gắng. ❤️`;
