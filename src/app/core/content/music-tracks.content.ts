export interface MusicTrack {
  readonly id: string;
  readonly title: string;
  readonly src: string;
}

/** Local tracks that are already part of the public Museum and Love Treasure experiences. */
export const MUSIC_TRACKS: readonly MusicTrack[] = [
  { id: 'cafe', title: 'Cà phê đắng như ly cafe', src: `mp3/${encodeURIComponent('Cà phê đắng như ly cafe.mp3')}` },
  { id: 'mascara', title: 'Mascara', src: `mp3/${encodeURIComponent('Mascara.mp3')}` },
  { id: 'mo', title: 'Mơ', src: `mp3/${encodeURIComponent('Mơ.mp3')}` },
  { id: 'thang-dien', title: 'Thằng Điên', src: `mp3/${encodeURIComponent('Thằng Điên.mp3')}` },
  { id: 'vi-anh-dau-co-biet', title: 'Vì anh đâu có biết', src: `mp3/${encodeURIComponent('Vì anh đâu có biết.mp3')}` }
];
