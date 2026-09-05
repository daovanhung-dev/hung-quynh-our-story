import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Memory } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { MediaFrameComponent } from '../../shared/components/media-frame/media-frame.component';
import { PhotoViewerComponent } from '../../shared/components/photo-viewer/photo-viewer.component';

@Component({
  standalone: true,
  imports: [RouterLink, MediaFrameComponent, PhotoViewerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (memory; as item) {
      <article class="memory-page">
        <a class="back" routerLink="/timeline">← Trở lại những ngày của chúng mình</a>
        <header class="essay-header">
          <p class="eyebrow">Một kỷ niệm của chúng mình · {{ item.images.length }} khoảnh khắc</p>
          <time [attr.datetime]="item.date">{{ formatDate(item.date) }}</time>
          @if (item.title) { <h1>{{ item.title }}</h1> }
          @if (item.caption) { <p class="caption">{{ item.caption }}</p> }
          @if (item.location) { <p class="location">{{ item.location }}</p> }
        </header>

        <section class="essay" aria-label="Những khoảnh khắc của ngày này">
          @for (media of item.images; track media.id; let index = $index) {
            <figure class="essay-frame" [class.cover]="index === 0" [class.portrait]="isPortrait(media.width,media.height)" [class.wide]="!isPortrait(media.width,media.height)">
              <button type="button" (click)="openViewer(index)" [attr.aria-label]="'Mở khoảnh khắc ' + (index + 1) + ' của ngày ' + formatDate(item.date)">
                <app-media-frame [media]="media" [alt]="media.alt || 'Kỷ niệm ngày ' + formatDate(item.date)" [priority]="index === 0" [sizes]="index === 0 ? '100vw' : '(max-width:720px) 100vw,72vw'" />
              </button>
              @if (media.caption) { <figcaption>{{ media.caption }}</figcaption> }
            </figure>
          }
        </section>

        <footer class="memory-ending">
          <span aria-hidden="true">♡</span>
          <p>Và rồi mình lại có thêm một ngày để nhớ.</p>
          <nav aria-label="Đi qua các kỷ niệm">
            @if (previousMemory; as previous) {
              <a [routerLink]="['/memory',previous.id]"><small>← Ngày trước đó</small><strong>{{ formatDate(previous.date) }}</strong></a>
            } @else { <span></span> }
            @if (nextMemory; as next) {
              <a class="next" [routerLink]="['/memory',next.id]"><small>Tiếp tục câu chuyện →</small><strong>{{ formatDate(next.date) }}</strong></a>
            } @else {
              <a class="next" routerLink="/" fragment="reasons"><small>Tiếp tục món quà →</small><strong>12 điều anh muốn nói</strong></a>
            }
          </nav>
        </footer>
      </article>
      @if (viewerOpen) { <app-photo-viewer [images]="item.images" [initialIndex]="viewerIndex" (closed)="closeViewer()" /> }
    } @else {
      <section class="missing">
        <span aria-hidden="true">H ♡ Q</span>
        <h1>Kỷ niệm này chưa ở trong món quà của chúng mình.</h1>
        <a routerLink="/timeline">Trở lại những ngày của chúng mình</a>
      </section>
    }
  `,
  styles: [`
    .memory-page { width:min(1280px,calc(100% - 3rem)); margin:0 auto; padding:clamp(2.5rem,6vw,5rem) max(0px,env(safe-area-inset-left)) 6rem max(0px,env(safe-area-inset-right)); }
    .back { display:inline-flex; min-height:44px; align-items:center; margin-bottom:clamp(3rem,8vw,7rem); color:var(--wine); font-size:.69rem; font-weight:600; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; }
    .essay-header { max-width:860px; margin:0 auto clamp(3rem,9vw,8rem); text-align:center; }
    .eyebrow { margin:0 0 1rem; color:var(--wine); font-size:.66rem; font-weight:600; letter-spacing:.16em; text-transform:uppercase; }
    time { display:block; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(2.3rem,5.5vw,5.2rem); line-height:.94; }
    h1 { margin:.7rem 0 1.1rem; font-family:var(--font-display); font-size:clamp(1.8rem,3.4vw,3.2rem); font-weight:400; line-height:1.15; }
    .caption { max-width:650px; margin:0 auto; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.08rem,2.1vw,1.5rem); line-height:1.65; }
    .location { margin:1rem 0 0; color:var(--text-muted); font-size:.76rem; }
    .essay { display:grid; gap:clamp(2.6rem,7vw,7rem); }
    .essay-frame { width:min(72vw,820px); margin:0 auto; }
    .essay-frame.cover,.essay-frame.wide { width:min(100%,1240px); }
    .essay-frame:nth-child(3n) { margin-left:0; }
    .essay-frame:nth-child(4n) { margin-right:0; }
    figure { margin-top:0; margin-bottom:0; }
    button { display:block; width:100%; padding:0; overflow:hidden; border:0; background:var(--surface-soft); cursor:zoom-in; }
    app-media-frame { display:block; min-height:200px; }
    button app-media-frame { transition:transform 420ms var(--ease-out); }
    button:hover app-media-frame { transform:scale(1.008); }
    figcaption { max-width:580px; margin:.8rem auto 0; color:var(--text-muted); font-size:.76rem; line-height:1.65; text-align:center; }
    .memory-ending { display:grid; justify-items:center; margin-top:clamp(6rem,12vw,11rem); padding-top:3rem; border-top:1px solid var(--border); text-align:center; }
    .memory-ending > span { color:var(--wine); font-family:Georgia,serif; font-size:2rem; }
    .memory-ending > p { margin:.7rem 0 4rem; color:var(--text-secondary); font-family:var(--font-display); font-size:clamp(1.3rem,2.8vw,2rem); }
    .memory-ending nav { display:grid; grid-template-columns:1fr 1fr; gap:2rem; width:100%; text-align:left; }
    .memory-ending nav a { display:grid; gap:.35rem; min-height:82px; align-content:center; border-top:1px solid var(--border-strong); color:var(--ink); text-decoration:none; }
    .memory-ending nav .next { justify-items:end; text-align:right; }
    .memory-ending nav small { color:var(--wine); font-size:.64rem; font-weight:600; letter-spacing:.08em; text-transform:uppercase; }
    .memory-ending nav strong { font-family:var(--font-display); font-size:1.25rem; font-weight:400; }
    .missing { display:grid; min-height:70dvh; place-items:center; align-content:center; padding:2rem; text-align:center; }
    .missing span { color:var(--wine); font-size:.7rem; font-weight:600; letter-spacing:.16em; }
    .missing h1 { max-width:600px; font-size:clamp(2.2rem,6vw,4.8rem); }
    .missing a { min-height:44px; color:var(--wine); }
    @media (max-width:720px) { .memory-page { width:calc(100% - 2rem); padding-top:2rem; padding-bottom:4rem; } .back { max-width:100%; margin-bottom:clamp(2rem,10vw,4rem); line-height:1.4; } .essay-header { text-align:left; } time { font-size:clamp(2rem,11vw,4rem); } h1 { font-size:clamp(1.7rem,8vw,2.8rem); } .caption { margin-left:0; font-size:1.05rem; } .essay { gap:2.5rem; } .essay-frame,.essay-frame.cover,.essay-frame.wide { width:100%; } .essay-frame:nth-child(3n),.essay-frame:nth-child(4n) { margin-left:auto; margin-right:auto; } .essay-frame button { min-height:44px; } .memory-ending { margin-top:5rem; } .memory-ending > p { margin-bottom:2.5rem; } .memory-ending nav { grid-template-columns:1fr; gap:.6rem; } .memory-ending nav > span { display:none; } .memory-ending nav a,.memory-ending nav .next { justify-items:start; min-height:72px; padding:.7rem 0; text-align:left; } }
  `]
})
export class MemoryDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly memoryService = inject(MemoryService);
  private readonly allMemories = this.memoryService.getAllMemories();
  protected readonly memory: Memory | undefined = this.memoryService.getMemoryById(this.route.snapshot.paramMap.get('id') ?? '');
  protected readonly memoryIndex = this.memory ? this.allMemories.findIndex((item) => item.id === this.memory?.id) : -1;
  protected readonly previousMemory: Memory | undefined = this.memoryIndex > 0 ? this.allMemories[this.memoryIndex - 1] : undefined;
  protected readonly nextMemory: Memory | undefined = this.memoryIndex >= 0 && this.memoryIndex < this.allMemories.length - 1 ? this.allMemories[this.memoryIndex + 1] : undefined;
  protected viewerOpen=false;
  protected viewerIndex=0;
  protected formatDate(date:string):string { return this.memoryService.formatDate(date); }
  protected isPortrait(width?:number,height?:number):boolean { return Boolean(width && height && height > width); }
  protected openViewer(index:number):void { this.viewerIndex=index; this.viewerOpen=true; }
  protected closeViewer():void { this.viewerOpen=false; }
}
