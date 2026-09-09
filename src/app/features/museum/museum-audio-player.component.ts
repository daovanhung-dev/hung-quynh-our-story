import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
  ViewChild,
  computed,
  signal
} from '@angular/core';

export interface MuseumMusicTrack {
  id: string;
  title: string;
  src: string;
}

export const MUSEUM_TRACKS: readonly MuseumMusicTrack[] = [
  { id: 'cafe', title: 'Cà phê đắng như ly cafe', src: `mp3/${encodeURIComponent('Cà phê đắng như ly cafe.mp3')}` },
  { id: 'mascara', title: 'Mascara', src: `mp3/${encodeURIComponent('Mascara.mp3')}` },
  { id: 'mo', title: 'Mơ', src: `mp3/${encodeURIComponent('Mơ.mp3')}` },
  { id: 'thang-dien', title: 'Thằng Điên', src: `mp3/${encodeURIComponent('Thằng Điên.mp3')}` },
  { id: 'vi-anh-dau-co-biet', title: 'Vì anh đâu có biết', src: `mp3/${encodeURIComponent('Vì anh đâu có biết.mp3')}` }
];

@Component({
  selector: 'app-museum-audio-player',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="museum-audio" aria-label="Âm nhạc bảo tàng">
      <audio
        #audio
        preload="metadata"
        [src]="activeTrack().src"
        (loadedmetadata)="onLoadedMetadata()"
        (timeupdate)="onTimeUpdate()"
        (play)="onPlay()"
        (pause)="onPause()"
        (ended)="onEnded()"
        (error)="onAudioError()"
      ></audio>
      <div class="audio-copy">
        <span class="audio-kicker">Nhạc nền</span>
        <strong>{{ activeTrack().title }}</strong>
        <small>{{ isPlaying() ? 'Đang phát trong các căn phòng' : (autoplayBlocked() ? 'Nhấn lại để bật nhạc' : 'Nhấn bật nhạc khi em sẵn sàng') }}</small>
      </div>
      <div class="audio-actions">
        <button class="audio-primary" type="button" (click)="togglePlayback()">
          <span aria-hidden="true">{{ isPlaying() ? 'Ⅱ' : '▶' }}</span>
          {{ isPlaying() ? 'Tạm dừng' : 'Bật nhạc' }}
        </button>
        <button class="audio-icon-button" type="button" aria-label="Bài trước" (click)="previousTrack()">↞</button>
        <button class="audio-icon-button" type="button" aria-label="Bài tiếp" (click)="nextTrack()">↠</button>
        <button class="audio-guest-button" type="button" (click)="toggleAmbient()">
          {{ ambientMuted() ? 'Bật tiếng khách' : 'Tắt tiếng khách' }}
        </button>
      </div>
      <div class="audio-progress">
        <input
          type="range"
          min="0"
          [max]="duration() || 0"
          step="0.1"
          [value]="currentTime()"
          aria-label="Tiến trình bài hát"
          (input)="seekAudio($event)"
        />
        <label>
          <span aria-hidden="true">Âm lượng</span>
          <input type="range" min="0" max="1" step="0.05" [value]="volume()" aria-label="Âm lượng nhạc" (input)="setVolume($event)" />
        </label>
      </div>
      @if (audioError()) {
        <p class="audio-error" role="status">Không mở được bài này, em thử bài kế tiếp nhé.</p>
      }
    </section>
  `,
  styles: [`
    :host { display:block; }
    .museum-audio { display:grid; grid-template-columns:minmax(150px,1fr) auto; gap:.8rem 1rem; align-items:center; padding:.85rem 1rem; border:1px solid rgba(255,253,249,.18); background:rgba(35,18,24,.82); color:#fffdf9; box-shadow:0 12px 38px rgba(0,0,0,.18); backdrop-filter:blur(14px); }
    audio { display:none; }
    .audio-copy { display:grid; gap:.18rem; min-width:0; }
    .audio-kicker { color:#e1b57b; font-size:.58rem; letter-spacing:.16em; text-transform:uppercase; }
    .audio-copy strong { overflow:hidden; font-family:var(--font-display, Georgia, serif); font-size:1.08rem; font-weight:400; text-overflow:ellipsis; white-space:nowrap; }
    .audio-copy small { overflow:hidden; color:rgba(255,253,249,.55); font-size:.67rem; text-overflow:ellipsis; white-space:nowrap; }
    .audio-actions,.audio-progress { display:flex; align-items:center; gap:.45rem; }
    .audio-actions { flex-wrap:wrap; justify-content:flex-end; }
    button { min-width:44px; min-height:44px; border:1px solid rgba(255,253,249,.22); background:rgba(255,253,249,.05); color:#fffdf9; cursor:pointer; font:inherit; }
    button:hover,button:focus-visible { border-color:#e1b57b; background:rgba(225,181,123,.16); }
    .audio-primary { padding:.6rem .8rem; border-color:#c98c6f; background:#7f3b4b; font-size:.68rem; letter-spacing:.06em; text-transform:uppercase; }
    .audio-icon-button { width:44px; padding:0; font-size:1.4rem; }
    .audio-guest-button { padding:.55rem .7rem; font-size:.63rem; letter-spacing:.04em; }
    .audio-progress { grid-column:1 / -1; }
    .audio-progress > input { flex:1; min-width:120px; }
    .audio-progress label { display:flex; align-items:center; gap:.45rem; color:rgba(255,253,249,.54); font-size:.61rem; white-space:nowrap; }
    input[type='range'] { accent-color:#dfaa72; cursor:pointer; }
    .audio-error { grid-column:1 / -1; margin:0; color:#f3c0a0; font-size:.7rem; }
    @media (max-width:680px) {
      .museum-audio { grid-template-columns:1fr; gap:.7rem; }
      .audio-actions { justify-content:flex-start; }
      .audio-progress { display:grid; grid-template-columns:1fr; }
      .audio-progress label { justify-content:space-between; }
      .audio-progress label input { flex:1; }
    }
  `]
})
export class MuseumAudioPlayerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('audio', { static: true }) private readonly audioRef!: ElementRef<HTMLAudioElement>;
  @Output() readonly playingChange = new EventEmitter<boolean>();
  @Output() readonly ambientMutedChange = new EventEmitter<boolean>();
  @Output() readonly userInteracted = new EventEmitter<void>();

  protected readonly trackIndex = signal(0);
  protected readonly isPlaying = signal(false);
  protected readonly autoplayBlocked = signal(false);
  protected readonly audioError = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly volume = signal(.62);
  protected readonly ambientMuted = signal(true);
  protected readonly activeTrack = computed(() => MUSEUM_TRACKS[this.trackIndex()] ?? MUSEUM_TRACKS[0]);

  private ambientContext?: AudioContext;
  private ambientGain?: GainNode;
  private ambientSource?: AudioBufferSourceNode;

  ngAfterViewInit(): void {
    this.audioRef.nativeElement.volume = this.volume();
  }

  ngOnDestroy(): void {
    this.audioRef.nativeElement.pause();
    this.stopAmbient();
  }

  protected togglePlayback(): void {
    this.userInteracted.emit();
    const firstInteraction = !this.ambientContext;
    this.ensureAmbientAudio();
    if (firstInteraction && this.ambientContext) {
      this.ambientMuted.set(false);
      this.ambientMutedChange.emit(false);
      this.updateAmbientGain();
    }
    if (this.isPlaying()) {
      this.audioRef.nativeElement.pause();
      return;
    }
    void this.playCurrentTrack();
  }

  protected previousTrack(): void {
    const wasPlaying = this.isPlaying();
    this.trackIndex.update((index) => (index - 1 + MUSEUM_TRACKS.length) % MUSEUM_TRACKS.length);
    this.resetTrackState();
    if (wasPlaying) void this.playCurrentTrack();
  }

  protected nextTrack(): void {
    const wasPlaying = this.isPlaying();
    this.trackIndex.update((index) => (index + 1) % MUSEUM_TRACKS.length);
    this.resetTrackState();
    if (wasPlaying) void this.playCurrentTrack();
  }

  protected toggleAmbient(): void {
    this.userInteracted.emit();
    this.ensureAmbientAudio();
    this.ambientMuted.update((muted) => !muted);
    this.ambientMutedChange.emit(this.ambientMuted());
    this.updateAmbientGain();
    void this.ambientContext?.resume();
  }

  protected seekAudio(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.audioRef.nativeElement.currentTime = value;
    this.currentTime.set(value);
  }

  protected setVolume(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.volume.set(value);
    this.audioRef.nativeElement.volume = value;
  }

  protected onLoadedMetadata(): void {
    this.duration.set(Number.isFinite(this.audioRef.nativeElement.duration) ? this.audioRef.nativeElement.duration : 0);
  }

  protected onTimeUpdate(): void {
    this.currentTime.set(this.audioRef.nativeElement.currentTime);
  }

  protected onPlay(): void {
    this.isPlaying.set(true);
    this.autoplayBlocked.set(false);
    this.audioError.set(false);
    this.playingChange.emit(true);
    this.updateAmbientGain();
  }

  protected onPause(): void {
    this.isPlaying.set(false);
    this.playingChange.emit(false);
    this.updateAmbientGain();
  }

  protected onEnded(): void {
    this.nextTrack();
  }

  protected onAudioError(): void {
    this.audioError.set(true);
    this.isPlaying.set(false);
    this.playingChange.emit(false);
  }

  private async playCurrentTrack(): Promise<void> {
    this.audioError.set(false);
    try {
      await this.audioRef.nativeElement.play();
    } catch {
      this.autoplayBlocked.set(true);
      this.isPlaying.set(false);
      this.playingChange.emit(false);
    }
  }

  private resetTrackState(): void {
    this.audioRef.nativeElement.load();
    this.currentTime.set(0);
    this.duration.set(0);
    this.audioError.set(false);
  }

  private ensureAmbientAudio(): void {
    if (this.ambientContext || typeof window === 'undefined') {
      return;
    }

    const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) {
      return;
    }

    this.ambientContext = new AudioContextConstructor();
    const sampleRate = this.ambientContext.sampleRate;
    const buffer = this.ambientContext.createBuffer(1, sampleRate * 2, sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * 0.32;
    }
    this.ambientSource = this.ambientContext.createBufferSource();
    this.ambientSource.buffer = buffer;
    this.ambientSource.loop = true;
    const filter = this.ambientContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 480;
    filter.Q.value = .65;
    this.ambientGain = this.ambientContext.createGain();
    this.ambientSource.connect(filter).connect(this.ambientGain).connect(this.ambientContext.destination);
    this.ambientSource.start();
    this.updateAmbientGain();
  }

  private updateAmbientGain(): void {
    if (this.ambientGain) {
      this.ambientGain.gain.value = this.ambientMuted() ? 0 : (this.isPlaying() ? .008 : .014);
    }
  }

  private stopAmbient(): void {
    try {
      this.ambientSource?.stop();
    } catch {
      // The source may already be stopped by the browser.
    }
    this.ambientSource?.disconnect();
    this.ambientContext?.close();
    this.ambientSource = undefined;
    this.ambientGain = undefined;
    this.ambientContext = undefined;
  }
}
