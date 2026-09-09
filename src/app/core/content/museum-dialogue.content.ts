import type { MuseumDialogue, MuseumDialogueMood } from '../models/museum.model';

interface DialogueStarter {
  text: string;
  mood: MuseumDialogueMood;
  speakerProfile: string;
  roomTags: readonly string[];
}

const DIALOGUE_STARTERS: readonly DialogueStarter[] = [
  { text: 'Nhìn hai người trong ảnh này kìa,', mood: 'warm', speakerProfile: 'một người mẹ dịu dàng', roomTags: ['gallery', 'lobby'] },
  { text: 'Mình thích cách họ luôn đứng cạnh nhau,', mood: 'admiring', speakerProfile: 'một cô gái mê nhiếp ảnh', roomTags: ['gallery'] },
  { text: 'Không cần đọc chú thích cũng thấy họ hạnh phúc,', mood: 'tender', speakerProfile: 'một ông chú vui tính', roomTags: ['gallery', 'archive'] },
  { text: 'Bức ảnh này có ánh mắt thật trong trẻo,', mood: 'admiring', speakerProfile: 'một sinh viên mỹ thuật', roomTags: ['gallery'] },
  { text: 'Hai người làm cho căn phòng này ấm lên,', mood: 'warm', speakerProfile: 'một bà ngoại thích chuyện tình', roomTags: ['gallery'] },
  { text: 'Tớ đoán họ đã cười rất lâu trước khi chụp,', mood: 'playful', speakerProfile: 'một người bạn trẻ', roomTags: ['gallery', 'lobby'] },
  { text: 'Cách họ nhìn nhau thật hiếm có,', mood: 'tender', speakerProfile: 'một cặp đôi lớn tuổi', roomTags: ['gallery'] },
  { text: 'Nụ cười này chắc chắn là nụ cười của bình yên,', mood: 'warm', speakerProfile: 'một người kể chuyện', roomTags: ['gallery', 'archive'] },
  { text: 'Thật vui khi thấy một tình yêu được giữ lại qua nhiều ngày,', mood: 'admiring', speakerProfile: 'một khách tham quan trầm tính', roomTags: ['gallery'] },
  { text: 'Ảnh nào cũng có cảm giác như một lời cảm ơn,', mood: 'tender', speakerProfile: 'một cô giáo về hưu', roomTags: ['gallery', 'archive'] },
  { text: 'Có phải họ vừa đi qua một chuyến đi rất đẹp không,', mood: 'curious', speakerProfile: 'một cậu bé tò mò', roomTags: ['gallery'] },
  { text: 'Nhìn này, hạnh phúc của họ không hề ồn ào,', mood: 'admiring', speakerProfile: 'một biên tập viên ảnh', roomTags: ['gallery'] },
  { text: 'Mỗi góc máy đều giữ lại một chút thương nhau,', mood: 'tender', speakerProfile: 'một nhà thơ lang thang', roomTags: ['gallery', 'archive'] },
  { text: 'Tôi thích nhất là họ chẳng cần tạo dáng cầu kỳ,', mood: 'warm', speakerProfile: 'một nhiếp ảnh gia lớn tuổi', roomTags: ['gallery'] },
  { text: 'Cặp này có năng lượng dễ mến quá,', mood: 'playful', speakerProfile: 'một người bạn hoạt bát', roomTags: ['gallery', 'lobby'] },
  { text: 'Có những người chỉ cần ở cạnh nhau là đủ đẹp,', mood: 'tender', speakerProfile: 'một khách tham quan lãng mạn', roomTags: ['gallery'] },
  { text: 'Tớ muốn biết câu chuyện phía sau tấm ảnh này,', mood: 'curious', speakerProfile: 'một cô sinh viên làm phim', roomTags: ['gallery', 'archive'] },
  { text: 'Hai người này chắc đã cùng nhau vượt qua nhiều chuyện,', mood: 'admiring', speakerProfile: 'một người anh điềm đạm', roomTags: ['gallery'] },
  { text: 'Nhìn họ mà tự nhiên mình cũng mỉm cười,', mood: 'warm', speakerProfile: 'một khách tham quan hay cười', roomTags: ['gallery', 'lobby'] },
  { text: 'Bức tường này giống như một cuốn nhật ký biết thở,', mood: 'tender', speakerProfile: 'một nhà thiết kế nội thất', roomTags: ['gallery'] },
  { text: 'Tình yêu lâu bền thường có ánh mắt như thế này,', mood: 'admiring', speakerProfile: 'một cặp vợ chồng trung niên', roomTags: ['gallery', 'archive'] },
  { text: 'Tớ cá là họ vẫn kể lại kỷ niệm này mỗi năm,', mood: 'playful', speakerProfile: 'một người em họ tưởng tượng', roomTags: ['gallery'] },
  { text: 'Thật dịu dàng khi thấy hai người cùng lớn lên,', mood: 'tender', speakerProfile: 'một nhà nghiên cứu ký ức', roomTags: ['gallery'] },
  { text: 'Màu sắc trong ảnh khiến mình nghĩ đến một buổi chiều yên ả,', mood: 'warm', speakerProfile: 'một họa sĩ thích màu phim', roomTags: ['gallery', 'archive'] },
  { text: 'Nếu đây là một bộ phim, mình sẽ xem đến đoạn cuối,', mood: 'playful', speakerProfile: 'một người mê điện ảnh', roomTags: ['gallery', 'lobby'] },
  { text: 'Không khí quanh họ nhẹ nhàng giống một mái nhà,', mood: 'tender', speakerProfile: 'một người con xa quê', roomTags: ['gallery'] },
  { text: 'Mình tò mò ngày đầu tiên của họ trông như thế nào,', mood: 'curious', speakerProfile: 'một bạn trẻ thích lịch sử', roomTags: ['gallery', 'archive'] },
  { text: 'Có thể thấy họ luôn dành chỗ cho niềm vui của nhau,', mood: 'admiring', speakerProfile: 'một chuyên viên tâm lý', roomTags: ['gallery'] },
  { text: 'Hai người này có vẻ biết cách biến ngày thường thành ngày đáng nhớ,', mood: 'warm', speakerProfile: 'một người bán hoa', roomTags: ['gallery', 'lobby'] },
  { text: 'Tấm ảnh này làm mình tin vào những cuộc gặp đúng lúc,', mood: 'tender', speakerProfile: 'một khách tham quan tin vào duyên lành', roomTags: ['gallery'] },
  { text: 'Ôi, nụ cười này mà treo ở nhà chắc vui cả tuần,', mood: 'playful', speakerProfile: 'một cô bạn nói chuyện nhanh', roomTags: ['gallery', 'archive'] },
  { text: 'Mình cảm nhận được sự chân thành trước cả khi đọc ngày tháng,', mood: 'admiring', speakerProfile: 'một người lưu trữ bảo tàng', roomTags: ['gallery'] }
];

const DIALOGUE_ENDINGS: readonly string[] = [
  '— nhìn thôi cũng thấy họ đang chọn nhau mỗi ngày.',
  '— đúng là niềm vui đẹp nhất khi được chia sẻ cùng một người.',
  '— mong hai người cứ giữ được ánh sáng này thật lâu nhé.',
  '— ai đi qua đây cũng sẽ tin rằng hạnh phúc là có thật.'
];

export const MUSEUM_DIALOGUES: readonly MuseumDialogue[] = DIALOGUE_STARTERS.flatMap((starter, starterIndex) =>
  DIALOGUE_ENDINGS.map((ending, endingIndex) => ({
    id: `museum-dialogue-${String(starterIndex + 1).padStart(2, '0')}-${endingIndex + 1}`,
    text: `${starter.text} ${ending}`,
    mood: starter.mood,
    speakerProfile: starter.speakerProfile,
    roomTags: starter.roomTags,
    weight: 1 + ((starterIndex + endingIndex) % 3) * 0.25
  }))
);
