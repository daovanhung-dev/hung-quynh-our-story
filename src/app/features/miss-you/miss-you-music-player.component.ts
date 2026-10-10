import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import { MUSIC_TRACKS } from '../../core/content/music-tracks.content';

@Component({
  selector: 'app-miss-you-music-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="music-player" aria-labelledby="music-title">
      <audio
        #audio
        preload="none"
        (loadedmetadata)="onLoadedMetadata()"
        (timeupdate)="onTimeUpdate()"
        (play)="onPlay()"
        (pause)="onPause()"
        (ended)="onEnded()"
        (error)="onAudioError()"
      ></audio>
      <div class="music-heading">
        <div>
          <p class="music-kicker">Nhạc mình vẫn hay nghe</p>
          <h2 id="music-title">Một bài cho em</h2>
        </div>
        <span class="music-heart" aria-hidden="true">♡</span>
      </div>

      <div class="record-row">
        <div class="vinyl-record" [class.is-playing]="isPlaying()" aria-hidden="true">
          <span class="vinyl-groove"></span>
          <span class="vinyl-label">H <i>♡</i> Q</span>
          <span class="vinyl-center"></span>
        </div>
        <div class="active-track">
          <span class="track-caption">ĐANG CHỌN</span>
          <strong>{{ activeTrack.title }}</strong>
          <span class="playback-state" aria-live="polite">{{ isPlaying() ? 'Đang phát' : 'Chờ em bật nhạc' }}</span>
        </div>
      </div>

      <div class="player-controls" aria-label="Điều khiển nhạc">
        <button class="transport" type="button" aria-label="Bài trước" (click)="previousTrack()">↞</button>
        <button class="play-button" type="button" [attr.aria-label]="isPlaying() ? 'Tạm dừng nhạc' : 'Phát nhạc'" [attr.aria-pressed]="isPlaying()" (click)="togglePlayback()">
          <span aria-hidden="true">{{ isPlaying() ? 'Ⅱ' : '▶' }}</span>
        </button>
        <button class="transport" type="button" aria-label="Bài tiếp theo" (click)="nextTrack()">↠</button>
      </div>

      <div class="timeline-control">
        <span>{{ formatTime(currentTime()) }}</span>
        <input type="range" min="0" [max]="duration() || 0" step="0.1" [value]="currentTime()" [disabled]="duration() <= 0" aria-label="Tiến trình bài hát" (input)="seekAudio($event)">
        <span>{{ formatTime(duration()) }}</span>
      </div>
      <label class="volume-control"><span>Âm lượng</span><input type="range" min="0" max="1" step="0.05" [value]="volume()" aria-label="Âm lượng nhạc" (input)="setVolume($event)"></label>

      @if (audioError()) {
        <p class="audio-error" role="status">{{ audioError() }}</p>
      }

      <ol class="playlist" aria-label="Danh sách nhạc">
        @for (track of tracks; track track.id; let index = $index) {
          <li>
            <button type="button" class="track-button" [class.is-active]="index === trackIndex()" [attr.aria-current]="index === trackIndex() ? 'true' : null" (click)="selectTrack(index)">
              <span class="track-number">{{ (index + 1).toString().padStart(2, '0') }}</span>
              <span class="track-title">{{ track.title }}</span>
              <span class="track-action" aria-hidden="true">{{ index === trackIndex() && isPlaying() ? 'Ⅱ' : '▶' }}</span>
            </button>
          </li>
        }
      </ol>
    </section>
  `,
  styles: [`
    :host { display:block; min-width:0; }
    .music-player { min-width:0; padding:1rem; border:1px solid rgba(255,239,213,.19); background:rgba(61,45,48,.62); color:#fff8ec; }
    audio { display:none; }
    .music-heading { display:flex; align-items:center; justify-content:space-between; gap:.6rem; }
    .music-kicker,.track-caption { margin:0; color:#d8ad85; font-size:.55rem; font-weight:700; letter-spacing:.15em; text-transform:uppercase; }
    .music-heading h2 { margin:.2rem 0 0; color:#fff7ec; font-family:var(--font-display,Georgia,serif); font-size:1.2rem; font-weight:400; }
    .music-heart { color:#e9b798; font-size:1.5rem; }
    .record-row { display:flex; align-items:center; gap:1rem; min-width:0; margin:1rem 0 .85rem; }
    .vinyl-record { position:relative; flex:0 0 clamp(92px,9vw,124px); width:clamp(92px,9vw,124px); aspect-ratio:1; overflow:hidden; border:1px solid rgba(255,248,236,.25); border-radius:50%; background:repeating-radial-gradient(circle at center,#302a31 0 2px,#18161b 3px 5px,#3c343a 6px 7px); box-shadow:0 8px 20px rgba(0,0,0,.28); }
    .vinyl-record.is-playing { animation:vinyl-spin 9s linear infinite; }
    .vinyl-groove { position:absolute; inset:12%; border:1px solid rgba(255,255,255,.12); border-radius:50%; box-shadow:0 0 0 4px rgba(255,255,255,.025),0 0 0 9px rgba(255,255,255,.025); }
    .vinyl-label { position:absolute; inset:30%; display:flex; align-items:center; justify-content:center; gap:.04rem; border:1px solid rgba(255,238,214,.35); border-radius:50%; background:radial-gradient(circle at 38% 30%,#d5a67e,#8a4b54 55%,#532b38); color:#fff6e8; font-family:var(--font-display,Georgia,serif); font-size:.5rem; white-space:nowrap; }
    .vinyl-label i { color:#ffe6d6; font-style:normal; }
    .vinyl-center { position:absolute; top:49%; left:49%; width:2%; aspect-ratio:1; border-radius:50%; background:#f6dfbf; }
    .active-track { display:grid; min-width:0; gap:.35rem; }
    .active-track strong { color:#fff9f1; font-family:var(--font-display,Georgia,serif); font-size:clamp(.95rem,1.35vw,1.2rem); font-weight:400; line-height:1.35; overflow-wrap:anywhere; }
    .playback-state { color:rgba(255,248,236,.64); font-size:.62rem; }
    .player-controls { display:flex; align-items:center; justify-content:center; gap:.8rem; }
    .player-controls button { display:grid; place-items:center; border:1px solid rgba(255,248,236,.24); background:rgba(255,248,236,.06); color:#fff8ec; cursor:pointer; }
    .transport { width:44px; height:44px; border-radius:50%; font-size:1.25rem; }
    .play-button { width:52px; height:52px; border-color:rgba(239,200,155,.64)!important; border-radius:50%; background:#8e4b58!important; font-size:1.05rem; }
    .player-controls button:hover,.player-controls button:focus-visible { background:rgba(255,248,236,.16); }
    .timeline-control { display:grid; grid-template-columns:2.4rem minmax(0,1fr) 2.4rem; align-items:center; gap:.45rem; margin-top:.75rem; color:rgba(255,248,236,.64); font-size:.56rem; font-variant-numeric:tabular-nums; }
    .timeline-control span:last-child { text-align:right; }
    input[type='range'] { min-width:0; min-height:44px; width:100%; accent-color:#e2bb8b; cursor:pointer; }
    .volume-control { display:flex; align-items:center; gap:.8rem; margin-top:.3rem; color:rgba(255,248,236,.58); font-size:.58rem; }
    .volume-control span { flex:0 0 auto; }
    .audio-error { margin:.7rem 0 0; padding:.55rem .65rem; border-left:2px solid #f0ac9c; background:rgba(133,51,63,.26); color:#ffe3dc; font-size:.72rem; line-height:1.55; }
    .playlist { display:grid; gap:.15rem; margin:.7rem 0 0; padding:0; list-style:none; }
    .track-button { display:grid; grid-template-columns:1.8rem minmax(0,1fr) 1.2rem; align-items:center; gap:.45rem; width:100%; min-height:42px; padding:.35rem .45rem; border:1px solid transparent; background:transparent; color:rgba(255,248,236,.72); cursor:pointer; text-align:left; }
    .track-button:hover,.track-button:focus-visible { border-color:rgba(226,187,139,.38); background:rgba(255,248,236,.08); }
    .track-button.is-active { border-color:rgba(226,187,139,.28); background:rgba(126,66,77,.4); color:#fff8ec; }
    .track-number { color:#d8ad85; font-size:.55rem; font-variant-numeric:tabular-nums; }
    .track-title { overflow:hidden; font-size:.66rem; text-overflow:ellipsis; white-space:nowrap; }
    .track-action { color:#e2bb8b; font-size:.62rem; text-align:center; }
    @keyframes vinyl-spin { to { transform:rotate(360deg); } }
    @media (max-width:700px) { .music-player { padding:.85rem; } .record-row { justify-content:center; } .active-track { flex:1; } .track-button { min-height:44px; } }
    @media (prefers-reduced-motion:reduce) { .vinyl-record.is-playing { animation:none; } }
  `]
})
export class MissYouMusicPlayerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('audio', { static: true }) private readonly audioRef!: ElementRef<HTMLAudioElement>;
  protected readonly tracks = MUSIC_TRACKS;
  protected readonly trackIndex = signal(0);
  protected readonly isPlaying = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly volume = signal(.72);
  protected readonly audioError = signal('');

  protected get activeTrack() {
    return this.tracks[this.trackIndex()] ?? this.tracks[0];
  }

  ngAfterViewInit(): void {
    this.audioRef.nativeElement.volume = this.volume();
    this.setAudioSource();
    void this.playCurrentTrack();
  }

  ngOnDestroy(): void {
    const audio = this.audioRef.nativeElement;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  protected togglePlayback(): void {
    if (this.isPlaying()) {
      this.audioRef.nativeElement.pause();
      return;
    }
    void this.playCurrentTrack();
  }

  protected selectTrack(index: number): void {
    if (index < 0 || index >= this.tracks.length) return;
    this.changeTrack(index, true);
  }

  protected previousTrack(): void {
    const audio = this.audioRef.nativeElement;
    if (audio.currentTime > 4) {
      audio.currentTime = 0;
      this.currentTime.set(0);
      return;
    }
    this.changeTrack((this.trackIndex() - 1 + this.tracks.length) % this.tracks.length, this.isPlaying());
  }

  protected nextTrack(): void {
    this.changeTrack((this.trackIndex() + 1) % this.tracks.length, this.isPlaying());
  }

  protected seekAudio(event: Event): void {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (!Number.isFinite(value) || this.duration() <= 0) return;
    this.audioRef.nativeElement.currentTime = value;
    this.currentTime.set(value);
  }

  protected setVolume(event: Event): void {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    this.volume.set(Math.max(0, Math.min(1, value)));
    this.audioRef.nativeElement.volume = this.volume();
  }

  protected onLoadedMetadata(): void {
    const duration = this.audioRef.nativeElement.duration;
    this.duration.set(Number.isFinite(duration) ? duration : 0);
  }

  protected onTimeUpdate(): void {
    this.currentTime.set(this.audioRef.nativeElement.currentTime || 0);
  }

  protected onPlay(): void {
    this.isPlaying.set(true);
    this.audioError.set('');
  }

  protected onPause(): void {
    this.isPlaying.set(false);
  }

  protected onEnded(): void {
    this.changeTrack((this.trackIndex() + 1) % this.tracks.length, true);
  }

  protected onAudioError(): void {
    this.isPlaying.set(false);
    this.audioError.set('Không mở được bài này. Em thử bài khác nhé.');
  }

  protected formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const total = Math.floor(seconds);
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private changeTrack(index: number, shouldPlay: boolean): void {
    this.audioRef.nativeElement.pause();
    this.trackIndex.set(index);
    this.currentTime.set(0);
    this.duration.set(0);
    this.audioError.set('');
    this.setAudioSource();
    if (shouldPlay) void this.playCurrentTrack();
  }

  private setAudioSource(): void {
    const audio = this.audioRef.nativeElement;
    audio.src = new URL(this.activeTrack.src, document.baseURI).href;
  }

  private async playCurrentTrack(): Promise<void> {
    this.audioError.set('');
    try {
      await this.audioRef.nativeElement.play();
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      this.isPlaying.set(false);
      this.audioError.set(name === 'NotAllowedError'
        ? 'Trình duyệt chưa cho phép phát nhạc. Em có thể chạm nút phát để thử lại.'
        : 'Bài hát chưa phát được. Em thử chọn bài khác nhé.');
    }
  }
}
