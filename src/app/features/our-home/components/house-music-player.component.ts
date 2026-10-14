import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, computed, inject, signal } from '@angular/core';
import { MUSIC_TRACKS } from '../../../core/content/music-tracks.content';

@Component({
  selector: 'app-house-music-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="house-music" data-music-player aria-label="Trình phát nhạc căn nhà">
      <audio #audio preload="none" (loadedmetadata)="onLoadedMetadata()" (timeupdate)="onTimeUpdate()" (ended)="onEnded()" (error)="onAudioError()"></audio>
      <p class="music-intro">Chọn một bài nếu em muốn nghe. Nhạc chỉ phát khi em bấm nút.</p>
      <div class="active-track">
        <span class="record-icon" aria-hidden="true">♫</span>
        <div><strong>{{ activeTrack().title }}</strong><small>{{ statusText() }}</small></div>
      </div>

      <div class="playback-actions">
        <button class="play-button" type="button" (click)="togglePlayback()">{{ isPlaying() ? 'Tạm dừng' : 'Phát nhạc' }}</button>
        <button type="button" (click)="previousTrack()" aria-label="Chọn bài trước">Bài trước</button>
        <button type="button" (click)="nextTrack()" aria-label="Chọn bài tiếp theo">Bài tiếp</button>
        <button type="button" [attr.aria-pressed]="!audioEnabled" (click)="toggleMute()">{{ audioEnabled ? 'Tắt âm' : 'Bật âm' }}</button>
      </div>

      <div class="audio-position">
        <label for="house-track-position">Tiến trình bài hát</label>
        <input id="house-track-position" type="range" min="0" [max]="duration()" step="0.1" [value]="currentTime()" [disabled]="duration() <= 0" (input)="seekAudio($event)" />
        <span>{{ formatTime(currentTime()) }} / {{ formatTime(duration()) }}</span>
      </div>
      <label class="volume-control">Âm lượng
        <input type="range" min="0" max="1" step="0.05" [value]="volume()" (input)="setVolume($event)" />
      </label>

      <div class="track-list" role="group" aria-label="Chọn bài hát">
        @for (track of tracks; track track.id; let index = $index) {
          <button type="button" [class.is-selected]="index === trackIndex()" [attr.aria-pressed]="index === trackIndex()" (click)="selectTrack(index)">
            <span aria-hidden="true">{{ index === trackIndex() && isPlaying() ? 'Ⅱ' : '♫' }}</span>{{ track.title }}
          </button>
        }
      </div>

      @if (audioError()) { <p class="audio-error" role="status">{{ audioError() }}</p> }
    </section>
  `,
  styles: [`
    :host{display:block}.house-music{display:grid;gap:.8rem;color:var(--text-secondary)}audio{display:none}.music-intro{margin:0;font-size:.76rem;line-height:1.55}.active-track{display:flex;align-items:center;gap:.75rem;min-width:0;padding:.7rem;border:1px solid var(--border);border-radius:12px;background:#fffdf8}.record-icon{display:grid;flex:0 0 42px;width:42px;height:42px;place-items:center;border-radius:50%;background:#7b3549;color:#fff;font-size:1.4rem}.active-track div{display:grid;gap:.2rem;min-width:0}.active-track strong{overflow:hidden;color:var(--ink);font-family:var(--font-display);font-size:.95rem;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.active-track small{color:var(--text-muted);font-size:.65rem}.playback-actions{display:flex;flex-wrap:wrap;gap:.4rem}.playback-actions button,.track-list button{min-height:44px;padding:.55rem .7rem;border:1px solid var(--border-strong);border-radius:999px;background:#fffdf8;color:var(--wine);font:600 .67rem var(--font-body);cursor:pointer}.playback-actions .play-button{border-color:#713648;background:#713648;color:white}.playback-actions button:focus-visible,.track-list button:focus-visible,.audio-position input:focus-visible,.volume-control input:focus-visible{outline:3px solid var(--champagne);outline-offset:2px}.audio-position{display:grid;grid-template-columns:auto minmax(80px,1fr) auto;align-items:center;gap:.5rem;font-size:.62rem}.audio-position input,.volume-control input{width:100%;min-width:0;accent-color:var(--wine)}.volume-control{display:grid;grid-template-columns:auto minmax(90px,1fr);align-items:center;gap:.7rem;font-size:.68rem}.track-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem}.track-list button{display:flex;align-items:center;gap:.4rem;min-width:0;overflow:hidden;border-radius:9px;text-align:left;text-overflow:ellipsis;white-space:nowrap}.track-list button span{flex:0 0 auto}.track-list button.is-selected{border-color:var(--wine);background:#f2e5dc}.audio-error{margin:0;padding:.65rem;border-left:3px solid #a84851;border-radius:4px;background:#f8e9e6;color:#772c3a;font-size:.72rem;line-height:1.5}@media(max-width:380px){.audio-position{grid-template-columns:1fr auto}.audio-position label{grid-column:1/-1}.track-list{grid-template-columns:1fr}}
  `]
})
export class HouseMusicPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() audioEnabled = false;
  @Output() readonly audioEnabledChange = new EventEmitter<boolean>();
  @ViewChild('audio', { static: true }) private readonly audioRef!: ElementRef<HTMLAudioElement>;

  protected readonly tracks = MUSIC_TRACKS;
  protected readonly trackIndex = signal(0);
  protected readonly activeTrack = computed(() => this.tracks[this.trackIndex()] ?? this.tracks[0]);
  protected readonly isPlaying = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly volume = signal(.65);
  protected readonly audioError = signal('');
  private readonly document = inject(DOCUMENT);
  private activeSource = '';
  private destroyed = false;

  ngAfterViewInit(): void {
    const audio = this.audioRef.nativeElement;
    audio.volume = this.volume();
    audio.muted = !this.audioEnabled;
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    const audio = this.audioRef?.nativeElement;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    this.activeSource = '';
  }

  protected togglePlayback(): void {
    if (this.isPlaying()) {
      this.audioRef.nativeElement.pause();
      this.isPlaying.set(false);
      return;
    }
    void this.playCurrentTrack();
  }

  protected selectTrack(index: number): void {
    if (index < 0 || index >= this.tracks.length || index === this.trackIndex()) return;
    const wasPlaying = this.isPlaying();
    this.audioRef.nativeElement.pause();
    this.isPlaying.set(false);
    this.trackIndex.set(index);
    this.currentTime.set(0);
    this.duration.set(0);
    this.audioError.set('');
    if (wasPlaying) void this.playCurrentTrack();
  }

  protected previousTrack(): void {
    this.selectTrack((this.trackIndex() - 1 + this.tracks.length) % this.tracks.length);
  }

  protected nextTrack(): void {
    this.selectTrack((this.trackIndex() + 1) % this.tracks.length);
  }

  protected toggleMute(): void {
    this.audioEnabled = !this.audioEnabled;
    this.audioRef.nativeElement.muted = !this.audioEnabled;
    this.audioEnabledChange.emit(this.audioEnabled);
  }

  protected setVolume(event: Event): void {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    this.volume.set(Math.max(0, Math.min(1, value)));
    this.audioRef.nativeElement.volume = this.volume();
  }

  protected seekAudio(event: Event): void {
    const value = Number((event.currentTarget as HTMLInputElement).value);
    const audio = this.audioRef.nativeElement;
    if (!Number.isFinite(value) || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(value, audio.duration));
    this.currentTime.set(audio.currentTime);
  }

  protected onLoadedMetadata(): void {
    const value = this.audioRef.nativeElement.duration;
    this.duration.set(Number.isFinite(value) ? value : 0);
  }

  protected onTimeUpdate(): void {
    this.currentTime.set(this.audioRef.nativeElement.currentTime || 0);
  }

  protected onEnded(): void {
    this.isPlaying.set(false);
  }

  protected onAudioError(): void {
    if (!this.activeSource || this.destroyed) return;
    this.isPlaying.set(false);
    this.audioError.set('Bài hát chưa phát được. Em có thể thử lại hoặc chọn bài khác nhé.');
  }

  protected statusText(): string {
    if (this.audioError()) return 'Chưa phát được';
    return this.isPlaying() ? 'Đang phát' : 'Đang chờ em chọn';
  }

  protected formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const wholeSeconds = Math.floor(seconds);
    return `${String(Math.floor(wholeSeconds / 60)).padStart(2, '0')}:${String(wholeSeconds % 60).padStart(2, '0')}`;
  }

  private async playCurrentTrack(): Promise<void> {
    const audio = this.audioRef.nativeElement;
    const source = new URL(this.activeTrack().src, this.document.baseURI).href;
    this.audioError.set('');
    audio.volume = this.volume();
    audio.muted = !this.audioEnabled;
    if (source !== this.activeSource) {
      audio.pause();
      audio.src = source;
      this.activeSource = source;
      audio.load();
    }
    try {
      await audio.play();
      this.isPlaying.set(true);
    } catch (error) {
      this.isPlaying.set(false);
      this.audioError.set(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Trình duyệt chưa bật được bài hát. Em chạm Phát nhạc để thử lại nhé.'
        : 'Bài hát chưa phát được. Em có thể thử lại hoặc chọn bài khác nhé.');
    }
  }
}
