import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, PLATFORM_ID, ViewChild, effect, inject, isDevMode, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { MemoryMedia } from '../../core/models/memory.model';
import { MemoryService } from '../../core/services/memory.service';
import { ENDING_COPY, type EndingKind, type LoveFightState, type RoundChoice } from './models/love-fight.model';
import { HUNG_OUTFITS, QUYNH_OUTFITS, SPECIALS, WEAPONS } from './data/love-fight-assets';
import { LoveFightGame } from './engine/love-fight-game';
import type { LoveFightInput } from './engine/input-controller';
import { LoveFightAudioService } from './services/love-fight-audio.service';
import { LoveFightSessionService } from './services/love-fight-session.service';

interface LoveFightDebugApi {
  setAnger(value: number): void;
  setCourage(value: number): void;
  forceEndingA(): void;
  forceEndingB(): void;
  skipToFight(): void;
}

interface LoveFightDebugWindow extends Window {
  __LOVE_FIGHT_DEBUG__?: LoveFightDebugApi;
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="love-fight-page" [attr.data-state]="state()" aria-labelledby="love-fight-title">
      <header class="love-fight-header">
        <a class="back-link" routerLink="/events">← Về khu lựa chọn</a>
        <div class="brand-lockup" aria-hidden="true">H ♡ Q <span>LOVE FIGHT</span></div>
        <button class="mute-button" type="button" [attr.aria-label]="muted() ? 'Bật âm thanh' : 'Tắt âm thanh'" (click)="toggleMute()">
          {{ muted() ? 'Âm thanh tắt' : 'Âm thanh bật' }}
        </button>
      </header>

      @switch (state()) {
        @case ('intro') {
          <section class="screen intro-screen" aria-labelledby="love-fight-title">
            <div class="intro-copy">
              <p class="eyebrow">H ♡ Q · Một mini game cho chuyện mình</p>
              <h1 id="love-fight-title">LOVE<br><em>FIGHT.</em></h1>
              <p class="game-tagline">Dỗi nhau để yêu nhau hơn.</p>
              <p class="intro-description">Không có ai thua. Chỉ có hai đứa làm lành — nhưng trước hết, cho Quỳnh xử chồng một trận nhé.</p>
              <div class="intro-actions">
                <button class="primary-button" type="button" (click)="openSetup()">Mở màn dỗ vợ <span aria-hidden="true">↘</span></button>
                <a class="text-link" routerLink="/timeline">Xem ảnh kỷ niệm trước</a>
              </div>
            </div>
            <div class="intro-art" aria-hidden="true">
              <img src="games/love-fight/characters/quynh/Q01.webp" alt="">
              <span class="intro-vs">VS</span>
              <img src="games/love-fight/characters/hung/H01.webp" alt="">
              <div class="heart-orbit orbit-one">♡</div>
              <div class="heart-orbit orbit-two">♥</div>
            </div>
            <p class="screen-note">Một trận đấu nhỏ, một lời xin lỗi thật to.</p>
          </section>
        }

        @case ('outfit-select') {
          <section class="screen setup-screen" aria-labelledby="setup-title">
            <div class="setup-heading">
              <p class="eyebrow">01 · Chọn trang phục</p>
              <h1 id="setup-title">Chọn đồ cho<br><em>hai đứa mình.</em></h1>
              <p>Quỳnh chọn bộ mình thích. Hùng thì… để xem hôm nay chồng mặc gì để dễ được tha lỗi.</p>
            </div>

            @if (setupStep() === 'quynh') {
              <div class="choice-block">
                <div class="choice-heading"><h2>Quỳnh</h2><span>Khóa 1 bộ cho cả trận</span></div>
                <div class="choice-grid outfit-grid">
                  @for (outfit of quynhOutfits; track outfit.id) {
                    <button class="choice-card outfit-card" type="button" [class.is-selected]="setup().quynhOutfitId === outfit.id" [attr.data-outfit-id]="outfit.id" [attr.aria-pressed]="setup().quynhOutfitId === outfit.id" (click)="selectQuynh(outfit.id)">
                      <span class="selection-mark" aria-hidden="true">{{ setup().quynhOutfitId === outfit.id ? '✓' : '' }}</span>
                      <img [src]="outfit.previewSrc" [alt]="outfit.name">
                      <strong>{{ outfit.name }}</strong>
                      <small>{{ outfit.id }}</small>
                    </button>
                  }
                </div>
                <button class="primary-button setup-next" type="button" (click)="openHungSetup()">Chọn đồ cho Hùng <span aria-hidden="true">→</span></button>
              </div>
            } @else {
              <div class="choice-block">
                <div class="choice-heading"><h2>Hùng</h2><span>{{ hungPoolLabel() }}</span></div>
                <div class="choice-grid outfit-grid">
                  @for (outfit of hungOutfits; track outfit.id) {
                    <button class="choice-card outfit-card outfit-card--hung" type="button" [class.is-selected]="isHungInPool(outfit.id)" [class.is-locked]="setup().hungLockedOutfitId === outfit.id" [attr.data-outfit-id]="outfit.id" [attr.aria-pressed]="isHungInPool(outfit.id)" (click)="toggleHung(outfit.id)">
                      <span class="selection-mark" aria-hidden="true">{{ isHungInPool(outfit.id) ? '✓' : '' }}</span>
                      <span class="lock-mark" aria-hidden="true">{{ setup().hungLockedOutfitId === outfit.id ? '🔒' : '' }}</span>
                      <img [src]="outfit.previewSrc" [alt]="outfit.name">
                      <strong>{{ outfit.name }}</strong>
                      <small>{{ outfit.id }}</small>
                    </button>
                  }
                </div>
                <div class="hung-options">
                  <label class="toggle-label"><input type="checkbox" [checked]="isHungLocked()" (change)="toggleHungLock()"><span>🔒 Khóa đúng bộ đang chọn</span></label>
                  <p>Không chọn bộ nào = random trong cả 12 bộ. Chọn tối đa 3 bộ để tạo pool random.</p>
                </div>
                <div class="setup-actions"><button class="text-button" type="button" (click)="setupStep.set('quynh')">← Quay lại</button><button class="primary-button" type="button" (click)="openRoundSelect()">Chọn số round <span aria-hidden="true">→</span></button></div>
              </div>
            }
          </section>
        }

        @case ('round-select') {
          <section class="screen compact-screen" aria-labelledby="round-title">
            <div class="setup-heading"><p class="eyebrow">02 · Chọn số round</p><h1 id="round-title">Dỗi bao nhiêu<br><em>round đây?</em></h1><p>Càng nhiều round, càng có nhiều cơ hội để Hùng nói lời xin lỗi.</p></div>
            <div class="round-grid">
              @for (round of roundOptions; track round) {
                <button class="round-card" type="button" [class.is-selected]="setup().rounds === round" [attr.data-rounds]="round" [attr.aria-pressed]="setup().rounds === round" (click)="selectRounds(round)"><strong>{{ round }}</strong><span>round{{ round > 1 ? 's' : '' }}</span><small>first to {{ roundTarget(round) }}</small></button>
              }
            </div>
            <div class="setup-actions centered"><button class="text-button" type="button" (click)="setupStep.set('hung')">← Quay lại</button><button class="primary-button" type="button" (click)="openWeaponSelect()">Chọn vũ khí <span aria-hidden="true">→</span></button></div>
          </section>
        }

        @case ('weapon-select') {
          <section class="screen setup-screen" aria-labelledby="weapon-title">
            <div class="setup-heading"><p class="eyebrow">03 · Vũ khí cartoon</p><h1 id="weapon-title">Chọn món đồ<br><em>Quỳnh muốn cầm.</em></h1><p>Tất cả đều là đồ gia dụng vô hại. Mục tiêu duy nhất: làm chồng bớt tự tin và biết xin lỗi.</p></div>
            <div class="choice-grid weapon-grid">
              @for (item of weapons; track item.id) {
                <button class="weapon-card" type="button" [class.is-selected]="setup().weaponId === item.id" [attr.data-weapon-id]="item.id" [attr.aria-pressed]="setup().weaponId === item.id" (click)="selectWeapon(item.id)">
                  <span class="selection-mark" aria-hidden="true">{{ setup().weaponId === item.id ? '✓' : '' }}</span><img [src]="item.iconSrc" [alt]="item.name"><strong>{{ item.name }}</strong><small>{{ item.courageDamage }} độ dỗ dành</small>
                </button>
              }
            </div>
            <div class="setup-actions centered"><button class="text-button" type="button" (click)="session.goToRoundSelect()">← Quay lại</button><button class="primary-button" type="button" (click)="prepareMatch()">Đưa nhau lên sàn <span aria-hidden="true">↘</span></button></div>
          </section>
        }

        @case ('vs') {
          <section class="screen vs-screen" aria-labelledby="vs-title">
            <p class="eyebrow">VS · Cùng nhau qua mọi trận chiến nhỏ</p>
            <h1 id="vs-title">Sẵn sàng<br><em>làm lành chưa?</em></h1>
            <div class="vs-fighters">
              <article class="vs-fighter vs-fighter--q"><span class="fighter-label">TEAM DỖI</span><img [src]="quynhBattleSrc()" [alt]="'Quỳnh — ' + quynhOutfitName()"><strong>QUỲNH</strong><small>Cơn Dỗi: 100</small></article>
              <div class="vs-badge">VS<span>♥</span></div>
              <article class="vs-fighter vs-fighter--h"><span class="fighter-label">TEAM DỖ DÀNH</span><img [src]="hungBattleSrc()" [alt]="'Hùng — ' + hungOutfitName()"><strong>HÙNG</strong><small>Độ Dỗ Dành: 100</small></article>
            </div>
            <div class="special-preview"><span>Hùng đang giấu 4 bài dỗ:</span><div>@for (special of activeSpecials(); track special.id) { <span class="special-chip"><img [src]="special.effectSrc" alt="">{{ special.name }}</span> }</div></div>
            <button class="primary-button" type="button" (click)="launchFight()">Bắt đầu dỗ vợ <span aria-hidden="true">↘</span></button>
          </section>
        }

        @case ('round-intro') { <ng-container *ngTemplateOutlet="fightTemplate"></ng-container> }
        @case ('playing') { <ng-container *ngTemplateOutlet="fightTemplate"></ng-container> }
        @case ('round-result') { <ng-container *ngTemplateOutlet="fightTemplate"></ng-container> }
        @case ('match-result') { <ng-container *ngTemplateOutlet="fightTemplate"></ng-container> }

        @case ('ending-a') { <ng-container *ngTemplateOutlet="endingTemplate; context: { kind: 'a' }"></ng-container> }
        @case ('ending-b') { <ng-container *ngTemplateOutlet="endingTemplate; context: { kind: 'b' }"></ng-container> }
        @case ('photo-rain') {
          <section class="screen photo-screen" aria-labelledby="photo-title"><p class="eyebrow">Kỷ niệm thật của chúng mình</p><h1 id="photo-title">Sau mỗi trận dỗi,<br><em>mình lại có thêm một câu chuyện.</em></h1><div class="photo-rain" [class.is-reduced]="reducedMotion()">@for (photo of photoRain(); track photo.id; let index = $index) {<figure class="rain-photo" [style.--delay]="(index % 8) * 90 + 'ms'" [style.--tilt]="(index % 2 ? 1 : -1) * (3 + index % 5) + 'deg'"><img [src]="memoryImageSrc(photo)" [alt]="photo.alt || 'Ảnh kỷ niệm'" loading="lazy"></figure>}</div></section>
        }
        @case ('gallery') {
          <section class="screen gallery-screen" aria-labelledby="gallery-title"><div class="gallery-heading"><p class="eyebrow">LOVE FIGHT · Kết thúc hòa giải</p><h1 id="gallery-title">Những ngày<br><em>mình đã có nhau.</em></h1><p>Hùng có thể thua một round, nhưng chưa bao giờ thua những kỷ niệm của hai đứa mình.</p></div><div class="memory-gallery">@for (photo of galleryPhotos(); track photo.id) {<figure><img [src]="memoryImageSrc(photo)" [alt]="photo.alt || 'Ảnh kỷ niệm'" loading="lazy" decoding="async"></figure>}</div><div class="gallery-actions"><button class="primary-button" type="button" (click)="replay()">Chơi lại và xử chồng tiếp 😤</button><a class="secondary-button" routerLink="/timeline">Xem chuyện của chúng mình ❤️</a></div></section>
        }
      }

      <ng-template #fightTemplate>
        <section class="fight-screen" aria-label="Trận đấu LOVE FIGHT">
          <div class="fight-canvas" #gameHost></div>
          <div class="fight-hud">
            <div class="hud-fighter hud-fighter--q"><div class="hud-heading"><strong>QUỲNH</strong><span>CƠN DỖI</span></div><div class="meter"><span [style.width.%]="anger()"></span></div><div class="round-hearts" aria-label="Số round Quỳnh thắng">@for (heart of roundOptions; track heart) {<i [class.is-won]="quynhWins() >= roundOptions.indexOf(heart) + 1">♥</i>}</div></div>
            <div class="hud-center"><strong>{{ formatTimer() }}</strong><span>ROUND {{ roundNumber() }} / {{ setup().rounds }}</span></div>
            <div class="hud-fighter hud-fighter--h"><div class="hud-heading"><strong>HÙNG</strong><span>ĐỘ DỖ DÀNH</span></div><div class="meter meter--h"><span [style.width.%]="courage()"></span></div><div class="round-hearts">@for (heart of roundOptions; track heart) {<i [class.is-won]="hungWins() >= roundOptions.indexOf(heart) + 1">♥</i>}</div></div>
          </div>
          <div class="fight-caption" aria-live="polite">{{ roundMessage() }}</div>
          @if (state() === 'round-intro') {<div class="fight-state-overlay"><span>ROUND {{ roundNumber() }}</span><strong>VÀO DỖ VỢ!</strong></div>}
          @if (state() === 'round-result') {<div class="fight-state-overlay"><span>{{ lastRoundWinner() === 'quynh' ? 'QUỲNH THẮNG ROUND' : 'HÙNG ĐƯỢC THA ROUND' }}</span><strong>{{ lastRoundWinner() === 'quynh' ? 'CHỒNG XIN THUA 😭🌹' : 'VỢ BỚT DỖI RỒI ❤️' }}</strong></div>}
          @if (state() === 'match-result') {<div class="fight-state-overlay"><span>TRẬN ĐẤU KẾT THÚC</span><strong>{{ endingKind() === 'a' ? 'HÙNG ĐÃ DỖ ĐƯỢC VỢ' : 'QUỲNH ĐÃ XỬ CHỒNG' }}</strong></div>}
          @if (paused()) {<div class="pause-overlay"><strong>Tạm dừng một chút nhé.</strong><button class="primary-button" type="button" (click)="togglePause()">Tiếp tục</button></div>}
          <div class="fight-toolbar"><button type="button" class="small-button" (click)="togglePause()">{{ paused() ? 'Tiếp tục' : 'Tạm dừng' }}</button><span>A/D di chuyển · W nhảy · J/K đánh · L đồ nghề · Space né · Esc dừng</span></div>
          <div class="mobile-controls" aria-label="Điều khiển trên điện thoại"><div class="mobile-direction"><button type="button" aria-label="Di chuyển trái" (pointerdown)="setVirtual('left', true)" (pointerup)="setVirtual('left', false)" (pointercancel)="setVirtual('left', false)">←</button><button type="button" aria-label="Di chuyển phải" (pointerdown)="setVirtual('right', true)" (pointerup)="setVirtual('right', false)" (pointercancel)="setVirtual('right', false)">→</button></div><div class="mobile-actions"><button type="button" (pointerdown)="triggerInput('light')">ĐÁNH</button><button type="button" (pointerdown)="triggerInput('heavy')">ĐÁ</button><button type="button" (pointerdown)="triggerInput('weapon')">ĐỒ NGHỀ</button><button type="button" (pointerdown)="triggerInput('dodge')">NÉ</button></div></div>
        </section>
      </ng-template>

      <ng-template #endingTemplate let-kind="kind">
        <section class="screen ending-screen" [class.ending-screen--b]="kind === 'b'" aria-live="polite" [attr.data-ending]="kind">
          <div class="ending-stars" aria-hidden="true">✦　♡　✦　♡　✦</div>
          <div class="ending-fighters"><img [src]="endingQuynhSrc(kind)" alt=""><span>♡</span><img [src]="endingHungSrc(kind)" alt=""></div>
          <p class="eyebrow">{{ kind === 'a' ? 'ENDING A · HẾT DỖI' : 'ENDING B · QUỲNH THẮNG' }}</p>
          <h1>{{ endingCopy(kind).title }}</h1>
          <p class="ending-copy">{{ endingCopy(kind).body }}</p>
          <p class="ending-note">Không có ai thua. Chỉ có hai đứa làm lành.</p>
        </section>
      </ng-template>
    </main>
  `,
  styles: [`
    :host { display:block; }
    .love-fight-page { min-height:100dvh; background:radial-gradient(circle at 50% 0%,rgba(239,139,162,.18),transparent 30rem),#fff1f0; color:#331d26; }
    .love-fight-header { position:relative; z-index:20; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:1rem; width:min(1320px,calc(100% - 2rem)); min-height:64px; margin:0 auto; }
    .back-link,.mute-button { min-height:44px; display:inline-flex; align-items:center; color:#6b3a48; font-size:.68rem; font-weight:700; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; }
    .mute-button { justify-self:end; padding:.6rem .8rem; border:1px solid rgba(107,58,72,.2); border-radius:999px; background:rgba(255,255,255,.5); cursor:pointer; }
    .brand-lockup { color:#9d3959; font-family:var(--font-display); font-size:1rem; font-weight:700; letter-spacing:.06em; text-align:center; }
    .brand-lockup span { display:block; margin-top:.1rem; color:#6d4951; font-family:var(--font-body); font-size:.52rem; letter-spacing:.24em; }
    .screen { position:relative; width:min(1320px,calc(100% - 2rem)); min-height:calc(100dvh - 64px); margin:0 auto; padding:clamp(3rem,7vw,6rem) 0 5rem; }
    .intro-screen { display:grid; grid-template-columns:minmax(0,.9fr) minmax(320px,1.1fr); align-items:center; gap:2rem; overflow:hidden; }
    .eyebrow { margin:0 0 1rem; color:#a8395a; font-size:.68rem; font-weight:800; letter-spacing:.18em; text-transform:uppercase; }
    h1 { margin:0; font-family:var(--font-display); font-size:clamp(4.5rem,10vw,9rem); font-weight:400; letter-spacing:-.08em; line-height:.77; }
    h1 em { color:#c44f70; font-style:normal; }
    .game-tagline { margin:1.2rem 0 0; color:#8c3a54; font-family:var(--font-display); font-size:clamp(1.35rem,2.8vw,2.2rem); }
    .intro-description,.setup-heading > p:last-child,.gallery-heading > p:last-child { max-width:520px; margin:1.25rem 0 0; color:#6d5157; font-family:var(--font-display); font-size:1.05rem; line-height:1.7; }
    .intro-actions,.setup-actions,.gallery-actions { display:flex; flex-wrap:wrap; align-items:center; gap:.8rem; margin-top:2rem; }
    .primary-button,.secondary-button { display:inline-flex; align-items:center; justify-content:center; gap:.65rem; min-height:50px; padding:.85rem 1.15rem; border:1px solid #9d3959; border-radius:999px; font-size:.7rem; font-weight:800; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; cursor:pointer; transition:transform 180ms ease,background 180ms ease; }
    .primary-button { background:#9d3959; color:#fff9f6; }
    .primary-button:hover { background:#7f2945; transform:translateY(-2px); }
    .secondary-button { background:#fff; color:#8a3450; }
    .text-link,.text-button { border:0; background:transparent; color:#8b4b59; font-size:.72rem; font-weight:700; letter-spacing:.06em; text-decoration:underline; text-underline-offset:.3rem; cursor:pointer; }
    .intro-art { position:relative; display:flex; align-items:flex-end; justify-content:center; min-height:520px; padding:2rem 1rem 0; border:1px solid rgba(157,57,89,.16); border-radius:40% 40% 18px 18px; background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.84),transparent 15rem),linear-gradient(135deg,#ffdce3,#f8aabb 55%,#d86d8b); box-shadow:0 24px 70px rgba(157,57,89,.16); overflow:hidden; }
    .intro-art img { position:relative; width:43%; max-width:255px; height:auto; align-self:flex-end; filter:drop-shadow(0 18px 12px rgba(87,27,49,.2)); }
    .intro-art img:last-of-type { transform:scaleX(-1); }
    .intro-vs { position:relative; z-index:2; display:grid; width:4rem; height:4rem; margin:0 -1rem 8rem; place-items:center; border:4px solid #fff3ef; border-radius:50%; background:#f2a13d; color:#fff; font-family:var(--font-display); font-size:1.4rem; transform:rotate(-8deg); }
    .heart-orbit { position:absolute; z-index:3; color:#fff; font-size:2.4rem; }
    .orbit-one { top:20%; left:14%; }.orbit-two { top:12%; right:15%; color:#ffedf1; }
    .screen-note { margin:1rem 0 0; color:#98616b; font-size:.65rem; letter-spacing:.08em; }
    .setup-screen { padding-top:clamp(2.4rem,6vw,5rem); }
    .setup-heading { display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:1rem 2rem; border-bottom:1px solid rgba(157,57,89,.2); padding-bottom:2rem; }.setup-heading h1 { font-size:clamp(3.4rem,7vw,6.5rem); }.setup-heading > p:last-child { margin:0; max-width:400px; }
    .choice-block { margin-top:2rem; }.choice-heading { display:flex; align-items:baseline; justify-content:space-between; gap:1rem; margin-bottom:1rem; }.choice-heading h2 { margin:0; color:#8d3451; font-family:var(--font-display); font-size:2rem; font-weight:400; }.choice-heading span { color:#96727a; font-size:.66rem; letter-spacing:.08em; text-transform:uppercase; }
    .choice-grid { display:grid; gap:.7rem; }.outfit-grid { grid-template-columns:repeat(6,minmax(0,1fr)); }.choice-card,.weapon-card { position:relative; display:grid; justify-items:center; align-content:end; min-width:0; min-height:220px; padding:.7rem .45rem .8rem; border:1px solid rgba(157,57,89,.16); border-radius:14px; background:rgba(255,255,255,.64); color:#5b3942; cursor:pointer; overflow:hidden; transition:transform 180ms ease,box-shadow 180ms ease,border-color 180ms ease; }.choice-card:hover,.choice-card.is-selected,.weapon-card:hover,.weapon-card.is-selected { border-color:#d65c7a; box-shadow:0 10px 28px rgba(157,57,89,.15); transform:translateY(-3px); }.choice-card.is-selected,.weapon-card.is-selected { background:#fff7f5; }.choice-card img { width:100%; height:142px; object-fit:contain; object-position:center bottom; }.choice-card strong,.weapon-card strong { width:100%; overflow:hidden; color:#713648; font-size:.68rem; line-height:1.25; text-align:center; text-overflow:ellipsis; white-space:nowrap; }.choice-card small,.weapon-card small { margin-top:.2rem; color:#b17d86; font-size:.58rem; }.selection-mark { position:absolute; top:.5rem; left:.55rem; display:grid; width:1.35rem; height:1.35rem; place-items:center; border:1px solid #dc6c87; border-radius:50%; color:#b13d5c; font-size:.75rem; }.lock-mark { position:absolute; top:.5rem; right:.45rem; font-size:.72rem; }.hung-options { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem; margin-top:1rem; padding:1rem; border:1px dashed rgba(157,57,89,.28); border-radius:12px; background:rgba(255,255,255,.38); }.toggle-label { display:flex; align-items:center; gap:.55rem; color:#713648; font-size:.72rem; font-weight:700; }.toggle-label input { width:1.1rem; height:1.1rem; accent-color:#a43c5b; }.hung-options p { margin:0; color:#97717a; font-size:.68rem; }.setup-next { margin-top:1.5rem; }.setup-actions.centered { justify-content:center; }
    .compact-screen { display:grid; align-content:center; justify-items:center; text-align:center; }.compact-screen .setup-heading { display:block; max-width:700px; border:0; }.compact-screen .setup-heading > p:last-child { margin:1.25rem auto 0; }.compact-screen .setup-heading h1 { font-size:clamp(3.5rem,8vw,7rem); }.round-grid { display:grid; grid-template-columns:repeat(3,minmax(100px,180px)); gap:1rem; margin-top:2rem; }.round-card { display:grid; justify-items:center; gap:.3rem; min-height:190px; padding:1.5rem 1rem; border:1px solid rgba(157,57,89,.2); border-radius:22px; background:rgba(255,255,255,.56); color:#7e3b4f; cursor:pointer; }.round-card strong { font-family:var(--font-display); font-size:5rem; font-weight:400; line-height:.8; }.round-card span { font-size:.72rem; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }.round-card small { color:#ad7984; font-size:.65rem; }.round-card.is-selected { background:#f89db5; border-color:#a43c5b; box-shadow:0 12px 30px rgba(157,57,89,.2); color:#fff; }.round-card.is-selected small { color:#ffe7ec; }
    .weapon-grid { grid-template-columns:repeat(6,minmax(0,1fr)); margin-top:2rem; }.weapon-card { min-height:190px; }.weapon-card img { width:100%; height:115px; object-fit:contain; }
    .vs-screen { display:grid; justify-items:center; align-content:center; text-align:center; }.vs-screen h1 { font-size:clamp(3.5rem,8vw,7rem); }.vs-fighters { display:grid; grid-template-columns:minmax(150px,280px) auto minmax(150px,280px); align-items:end; gap:clamp(1rem,5vw,4rem); width:min(100%,840px); margin-top:1rem; }.vs-fighter { display:grid; justify-items:center; }.vs-fighter img { width:min(100%,250px); height:290px; object-fit:contain; object-position:center bottom; filter:drop-shadow(0 14px 10px rgba(102,33,54,.22)); }.vs-fighter--h img { transform:scaleX(-1); }.fighter-label { color:#b13d5c; font-size:.6rem; font-weight:800; letter-spacing:.16em; }.vs-fighter strong { color:#8a304d; font-family:var(--font-display); font-size:1.7rem; font-weight:400; }.vs-fighter small { color:#996d76; font-size:.62rem; }.vs-badge { display:grid; place-items:center; width:5rem; height:5rem; border:5px solid #fff6f3; border-radius:50%; background:#f4a03d; color:#fff; font-family:var(--font-display); font-size:1.5rem; transform:rotate(-8deg); }.vs-badge span { color:#b53a5c; font-size:.9rem; }.special-preview { width:min(100%,700px); margin:1.5rem auto 0; padding:1rem; border:1px solid rgba(157,57,89,.16); border-radius:12px; background:rgba(255,255,255,.52); color:#8b626b; font-size:.68rem; }.special-preview > div { display:flex; flex-wrap:wrap; justify-content:center; gap:.4rem; margin-top:.6rem; }.special-chip { display:inline-flex; align-items:center; gap:.3rem; padding:.3rem .5rem; border-radius:999px; background:#fff0f1; color:#844054; }.special-chip img { width:20px; height:20px; object-fit:contain; }
    .fight-screen { position:relative; width:min(1200px,calc(100% - 2rem)); min-height:calc(100dvh - 64px); margin:0 auto; padding:1rem 0 3rem; }.fight-canvas { position:relative; width:100%; max-width:960px; aspect-ratio:16/9; margin:0 auto; border:2px solid rgba(255,236,238,.8); border-radius:18px; background:#24131f; box-shadow:0 18px 60px rgba(63,18,38,.22); overflow:hidden; }.fight-canvas canvas { display:block; width:100%; height:100%; }.fight-hud { position:absolute; z-index:5; top:1.5rem; left:50%; display:grid; grid-template-columns:minmax(0,1fr) 100px minmax(0,1fr); gap:1rem; width:min(88%,900px); transform:translateX(-50%); pointer-events:none; }.hud-fighter { color:#fff; }.hud-fighter--h { text-align:right; }.hud-heading { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:.35rem; text-shadow:0 2px 4px #24131f; }.hud-heading strong { font-family:var(--font-display); font-size:1.2rem; font-weight:400; }.hud-heading span { font-size:.58rem; font-weight:800; letter-spacing:.14em; }.meter { height:14px; margin-top:.35rem; padding:2px; border:1px solid rgba(255,255,255,.6); border-radius:99px; background:rgba(50,11,25,.72); transform:skewX(-12deg); }.meter span { display:block; height:100%; border-radius:99px; background:linear-gradient(90deg,#f7a1b5,#ff4f80); transition:width 100ms linear; }.meter--h span { margin-left:auto; background:linear-gradient(90deg,#81c7ea,#d4f2ff); }.round-hearts { display:flex; gap:.25rem; margin-top:.3rem; color:rgba(255,255,255,.3); font-size:.72rem; }.hud-fighter--h .round-hearts { justify-content:flex-end; }.round-hearts i { font-style:normal; }.round-hearts i.is-won { color:#ffd0d9; text-shadow:0 0 8px #ff7d9b; }.hud-center { display:grid; justify-items:center; align-content:start; color:#fff; text-align:center; text-shadow:0 2px 5px #24131f; }.hud-center strong { font-family:var(--font-display); font-size:2.5rem; font-weight:400; line-height:.8; }.hud-center span { margin-top:.35rem; font-size:.55rem; letter-spacing:.12em; }.fight-caption { position:absolute; z-index:5; right:0; bottom:8.5rem; left:0; color:#fff2f3; font-family:var(--font-display); font-size:clamp(1rem,2vw,1.4rem); text-align:center; text-shadow:0 2px 6px #24131f; pointer-events:none; }.fight-state-overlay,.pause-overlay { position:absolute; z-index:10; top:50%; left:50%; display:grid; justify-items:center; gap:.7rem; width:min(80%,620px); padding:1.5rem; border:1px solid rgba(255,255,255,.45); border-radius:18px; background:rgba(48,16,32,.82); color:#fff; text-align:center; transform:translate(-50%,-50%); backdrop-filter:blur(12px); }.fight-state-overlay span { color:#ffd1da; font-size:.65rem; font-weight:800; letter-spacing:.16em; }.fight-state-overlay strong { font-family:var(--font-display); font-size:clamp(1.8rem,5vw,3.5rem); font-weight:400; }.pause-overlay { gap:1.2rem; }.pause-overlay strong { font-family:var(--font-display); font-size:1.7rem; font-weight:400; }.fight-toolbar { display:flex; align-items:center; justify-content:space-between; gap:1rem; width:min(960px,100%); margin:.7rem auto 0; color:#98737d; font-size:.62rem; }.small-button { min-height:44px; padding:.55rem .8rem; border:1px solid rgba(157,57,89,.25); border-radius:999px; background:#fff; color:#85405a; cursor:pointer; }.mobile-controls { display:none; }
    .ending-screen,.photo-screen { display:grid; justify-items:center; align-content:center; text-align:center; }.ending-screen { min-height:calc(100dvh - 64px); padding-block:3rem; background:radial-gradient(circle at 50% 35%,#fff 0 6rem,transparent 23rem),linear-gradient(145deg,#ffc8d4,#fff0ea); }.ending-screen--b { background:radial-gradient(circle at 50% 35%,#fff 0 6rem,transparent 23rem),linear-gradient(145deg,#ffe0bf,#fff0e5); }.ending-stars { color:#e66680; font-size:1.4rem; letter-spacing:.3rem; }.ending-fighters { display:flex; align-items:end; justify-content:center; gap:0; margin:1.5rem 0 .5rem; }.ending-fighters img { width:min(34vw,230px); height:240px; object-fit:contain; object-position:center bottom; filter:drop-shadow(0 14px 12px rgba(102,33,54,.2)); }.ending-fighters img:last-child { transform:scaleX(-1); }.ending-fighters span { z-index:2; margin:0 -1rem 5rem; color:#e65174; font-size:3rem; }.ending-screen h1 { max-width:780px; font-size:clamp(3rem,7vw,6rem); line-height:.88; }.ending-copy { max-width:720px; margin:1.4rem auto 0; color:#8a3b53; font-family:var(--font-display); font-size:clamp(1.25rem,2.7vw,2rem); line-height:1.45; }.ending-note { margin:1.3rem 0 0; color:#aa7580; font-size:.7rem; letter-spacing:.1em; }.photo-screen { width:100%; padding:clamp(3rem,6vw,5rem) 1rem 4rem; overflow:hidden; }.photo-screen h1 { max-width:920px; font-size:clamp(3.3rem,7vw,6.5rem); }.photo-rain { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:.8rem; width:min(1100px,100%); margin:3rem auto 0; }.rain-photo { aspect-ratio:1; margin:0; padding:.5rem; background:#fff; box-shadow:0 8px 18px rgba(90,39,55,.12); transform:rotate(var(--tilt)); animation:photo-drop 700ms var(--delay) both var(--ease-out); }.rain-photo img { width:100%; height:100%; object-fit:cover; }.photo-rain.is-reduced .rain-photo { animation:none; transform:none; }.gallery-screen { padding-top:clamp(3rem,6vw,5rem); }.gallery-heading { display:flex; flex-wrap:wrap; align-items:end; justify-content:space-between; gap:1rem 2rem; border-bottom:1px solid rgba(157,57,89,.2); padding-bottom:2rem; }.gallery-heading h1 { font-size:clamp(3.5rem,7vw,6.6rem); }.gallery-heading > p:last-child { max-width:390px; margin:0; }.memory-gallery { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:.65rem; margin-top:2rem; }.memory-gallery figure { aspect-ratio:1; margin:0; overflow:hidden; background:#f1dfe0; }.memory-gallery img { width:100%; height:100%; object-fit:cover; transition:transform 400ms ease; }.memory-gallery figure:hover img { transform:scale(1.06); }.gallery-actions { justify-content:center; margin-bottom:2rem; }
    @keyframes photo-drop { from { opacity:0; transform:translateY(-36px) rotate(var(--tilt)); } to { opacity:1; transform:translateY(0) rotate(var(--tilt)); } }
    @media (max-width:900px) { .outfit-grid,.weapon-grid { grid-template-columns:repeat(4,minmax(0,1fr)); }.photo-rain { grid-template-columns:repeat(4,minmax(0,1fr)); }.memory-gallery { grid-template-columns:repeat(5,minmax(0,1fr)); } }
    @media (max-width:680px) { .love-fight-header { grid-template-columns:1fr auto; }.brand-lockup { display:none; }.screen { width:min(calc(100% - 1.2rem),560px); min-height:calc(100dvh - 56px); padding-top:2.5rem; }.intro-screen { display:flex; flex-direction:column-reverse; justify-content:center; gap:1.3rem; text-align:center; }.intro-copy { display:grid; justify-items:center; }.intro-copy h1 { font-size:clamp(4rem,20vw,7rem); }.intro-description { font-size:.98rem; }.intro-art { width:100%; min-height:300px; border-radius:22% 22% 12px 12px; }.intro-art img { max-width:145px; }.intro-vs { width:3.2rem; height:3.2rem; margin:0 -.7rem 4rem; font-size:1rem; }.screen-note { position:static; text-align:center; }.setup-heading { display:block; }.setup-heading h1 { font-size:clamp(3rem,14vw,5rem); }.setup-heading > p:last-child { margin-top:1rem; font-size:.98rem; }.outfit-grid,.weapon-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:.45rem; }.choice-card { min-height:190px; padding-inline:.25rem; }.choice-card img { height:120px; }.choice-card strong,.weapon-card strong { font-size:.58rem; }.choice-heading { align-items:start; flex-direction:column; gap:.3rem; }.hung-options { align-items:start; flex-direction:column; }.round-grid { grid-template-columns:repeat(3,1fr); width:100%; gap:.45rem; }.round-card { min-height:145px; padding:.8rem .3rem; }.round-card strong { font-size:3.8rem; }.vs-screen { padding-top:2rem; }.vs-screen h1 { font-size:clamp(3.3rem,14vw,5rem); }.vs-fighters { gap:.15rem; }.vs-fighter img { height:200px; }.vs-fighter strong { font-size:1.25rem; }.vs-fighter small { font-size:.52rem; }.vs-badge { width:3.5rem; height:3.5rem; border-width:3px; font-size:1rem; }.special-preview { font-size:.6rem; }.special-chip { font-size:.56rem; }.fight-screen { width:100%; min-height:calc(100dvh - 56px); padding:.4rem .6rem 1.5rem; }.fight-canvas { border-radius:10px; }.fight-hud { top:1rem; width:94%; grid-template-columns:minmax(0,1fr) 54px minmax(0,1fr); gap:.35rem; }.hud-heading strong { font-size:.9rem; }.hud-heading span { font-size:.44rem; }.meter { height:10px; }.hud-center strong { font-size:1.7rem; }.hud-center span { font-size:.42rem; }.fight-caption { bottom:9rem; font-size:.95rem; }.fight-toolbar { display:block; text-align:center; }.fight-toolbar .small-button { margin-bottom:.4rem; }.mobile-controls { display:flex; justify-content:space-between; gap:1rem; margin:1rem auto 0; }.mobile-direction,.mobile-actions { display:flex; gap:.4rem; }.mobile-controls button { min-width:52px; min-height:52px; padding:.5rem; border:1px solid rgba(157,57,89,.25); border-radius:12px; background:#fff; color:#803950; cursor:pointer; font-size:.65rem; font-weight:800; }.mobile-actions button { min-width:60px; }.ending-screen { min-height:calc(100dvh - 56px); padding-inline:1rem; }.ending-fighters img { width:40vw; height:180px; }.ending-fighters span { margin-bottom:3rem; font-size:2rem; }.ending-screen h1 { font-size:clamp(2.8rem,12vw,4.6rem); }.ending-copy { font-size:1.15rem; }.photo-screen h1 { font-size:clamp(2.7rem,11vw,4.5rem); }.photo-rain { grid-template-columns:repeat(3,minmax(0,1fr)); gap:.45rem; margin-top:2rem; }.rain-photo { padding:.25rem; }.rain-photo:nth-child(n + 9) { animation:none; opacity:1; transform:none; }.gallery-heading { display:block; }.gallery-heading h1 { font-size:clamp(3rem,13vw,5rem); }.memory-gallery { grid-template-columns:repeat(3,minmax(0,1fr)); gap:.35rem; }.gallery-actions { display:grid; width:100%; }.gallery-actions > * { width:100%; } }
    @media (prefers-reduced-motion: reduce) { .heart-orbit,.ending-stars,.primary-button,.choice-card,.weapon-card,.memory-gallery img,.rain-photo { animation:none; transition:none; transform:none; } }
  `]
})
export class LoveFightPage implements AfterViewInit {
  @ViewChild('gameHost') private gameHost?: ElementRef<HTMLDivElement>;

  protected readonly session = inject(LoveFightSessionService);
  private readonly memoryService = inject(MemoryService);
  private readonly audio = inject(LoveFightAudioService);
  private readonly platformId = inject(PLATFORM_ID);
  private game: LoveFightGame | null = null;
  private currentGameState: LoveFightState | null = null;
  private endingTimer?: ReturnType<typeof setTimeout>;
  private galleryTimer?: ReturnType<typeof setTimeout>;
  protected readonly state = this.session.state;
  protected readonly setup = this.session.setup;
  protected readonly anger = this.session.anger;
  protected readonly courage = this.session.courage;
  protected readonly roundNumber = this.session.roundNumber;
  protected readonly quynhWins = this.session.quynhWins;
  protected readonly hungWins = this.session.hungWins;
  protected readonly paused = this.session.paused;
  protected readonly muted = this.session.muted;
  protected readonly activeSpecials = this.session.activeSpecials;
  protected readonly photoRain = this.session.photoRain;
  protected readonly galleryPhotos = this.session.galleryPhotos;
  protected readonly endingKind = this.session.endingKind;
  protected readonly quynhOutfits = QUYNH_OUTFITS;
  protected readonly hungOutfits = HUNG_OUTFITS;
  protected readonly weapons = WEAPONS;
  protected readonly roundOptions: readonly RoundChoice[] = [1, 3, 5];
  protected readonly setupStep = signal<'quynh' | 'hung'>('quynh');
  protected readonly reducedMotion = signal(this.detectReducedMotion());
  protected readonly lastRoundWinner = this.session.lastRoundWinner;

  private readonly gameEffect = effect(() => {
    const current = this.state();
    if (current === 'round-intro' || current === 'playing' || current === 'round-result' || current === 'match-result') {
      if (current !== this.currentGameState) {
        this.game?.destroy();
        this.game = null;
        this.currentGameState = current;
      }
      queueMicrotask(() => this.startGameIfReady());
    } else if (current === 'ending-a' || current === 'ending-b' || current === 'photo-rain' || current === 'gallery') {
      this.game?.destroy();
      this.game = null;
      this.currentGameState = null;
    }
  });

  private readonly endingEffect = effect(() => {
    const current = this.state();
    if (current === 'ending-a' || current === 'ending-b') {
      if (this.endingTimer) clearTimeout(this.endingTimer);
      this.endingTimer = setTimeout(() => {
        if (this.state() !== current) return;
        this.session.openPhotoRain(this.memoryService.getRandomImageMedia(24));
      }, this.reducedMotion() ? 900 : 3600);
    }
    if (current === 'photo-rain') {
      if (this.galleryTimer) clearTimeout(this.galleryTimer);
      this.galleryTimer = setTimeout(() => {
        if (this.state() === 'photo-rain') this.session.openGallery(this.memoryService.getAllImageMedia());
      }, this.reducedMotion() ? 500 : 3000);
    }
  });

  ngAfterViewInit(): void {
    this.attachDebugHook();
  }

  protected openSetup(): void {
    this.audio.play('select');
    this.session.goToOutfitSelection();
  }

  protected selectQuynh(id: string): void {
    this.session.selectQuynhOutfit(id);
    this.audio.play('select');
  }

  protected openHungSetup(): void { this.setupStep.set('hung'); }
  protected toggleHung(id: string): void { this.session.toggleHungOutfit(id); this.audio.play('select'); }
  protected openRoundSelect(): void { this.session.goToRoundSelect(); }
  protected openWeaponSelect(): void { this.session.goToWeaponSelect(); }
  protected selectRounds(rounds: RoundChoice): void { this.session.setRounds(rounds); this.audio.play('select'); }
  protected selectWeapon(id: string): void { this.session.setWeapon(id); this.audio.play('select'); }
  protected prepareMatch(): void { this.session.prepareMatch(); this.audio.play('confirm'); }
  protected launchFight(): void { this.audio.play('confirm'); this.session.startFight(); }
  protected toggleMute(): void { this.session.toggleMute(); }
  protected togglePause(): void { this.session.togglePause(); }

  protected toggleHungLock(): void {
    const current = this.setup().hungLockedOutfitId;
    const candidate = this.setup().hungOutfitPool[0] || 'H01';
    this.session.setHungLocked(current ? undefined : candidate);
  }

  protected isHungInPool(id: string): boolean { return this.setup().hungOutfitPool.includes(id); }
  protected isHungLocked(): boolean { return Boolean(this.setup().hungLockedOutfitId); }
  protected hungPoolLabel(): string { return this.setup().hungOutfitPool.length ? `${this.setup().hungOutfitPool.length} bộ trong pool random` : 'Mặc định: random cả 12 bộ'; }
  protected roundTarget(rounds: RoundChoice): number { return Math.ceil(rounds / 2); }
  protected formatTimer(): string { return String(this.session.timerSec()).padStart(2, '0'); }
  protected roundMessage(): string { return this.state() === 'playing' ? 'Quỳnh đang dỗi. Hùng đang run.' : 'Một lời xin lỗi đang được chuẩn bị…'; }
  protected quynhOutfitName(): string { return QUYNH_OUTFITS.find((item) => item.id === this.setup().quynhOutfitId)?.name || 'Đồ ngủ thỏ'; }
  protected hungOutfitName(): string { return HUNG_OUTFITS.find((item) => item.id === this.session.selectedHungOutfitId())?.name || 'Áo thun jeans'; }
  protected quynhBattleSrc(): string { return QUYNH_OUTFITS.find((item) => item.id === this.setup().quynhOutfitId)?.battleSrc || QUYNH_OUTFITS[0].battleSrc; }
  protected hungBattleSrc(): string { return HUNG_OUTFITS.find((item) => item.id === this.session.selectedHungOutfitId())?.battleSrc || HUNG_OUTFITS[0].battleSrc; }
  protected endingCopy(kind: EndingKind): typeof ENDING_COPY.a | typeof ENDING_COPY.b { return ENDING_COPY[kind]; }
  protected endingQuynhSrc(kind: EndingKind): string { return kind === 'a' ? 'games/love-fight/characters/quynh/Q_ENDING_HAPPY.webp' : 'games/love-fight/characters/quynh/Q_VICTORY_ANGRY.webp'; }
  protected endingHungSrc(kind: EndingKind): string { return kind === 'a' ? 'games/love-fight/characters/hung/H_ENDING_HAPPY.webp' : 'games/love-fight/characters/hung/H_DEFEAT_BOUQUET.webp'; }
  protected memoryImageSrc(media: MemoryMedia): string { return media.thumbnailSrc || media.displaySrc || media.mediumSrc || media.src; }

  protected triggerInput(action: LoveFightInput): void { this.game?.queueInput(action); }
  protected setVirtual(action: LoveFightInput, active: boolean): void { this.game?.setVirtualInput(action, active); }

  protected replay(): void {
    this.game?.destroy();
    this.game = null;
    this.currentGameState = null;
    this.setupStep.set('quynh');
    this.session.reset();
  }

  private startGameIfReady(): void {
    if (this.game || !this.gameHost?.nativeElement) return;
    this.game = new LoveFightGame(this.gameHost.nativeElement, this.session, this.audio);
    this.game.start();
  }

  private detectReducedMotion(): boolean {
    return isPlatformBrowser(this.platformId) && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private attachDebugHook(): void {
    if (!isDevMode() || !isPlatformBrowser(this.platformId)) return;
    const debugWindow = window as LoveFightDebugWindow;
    debugWindow.__LOVE_FIGHT_DEBUG__ = {
      setAnger: (value) => this.session.debugSetAnger(value),
      setCourage: (value) => this.session.debugSetCourage(value),
      forceEndingA: () => this.session.debugForceEnding('a'),
      forceEndingB: () => this.session.debugForceEnding('b'),
      skipToFight: () => { this.session.prepareMatch(); this.session.startFight(); }
    };
  }

  ngOnDestroy(): void {
    if (this.endingTimer) clearTimeout(this.endingTimer);
    if (this.galleryTimer) clearTimeout(this.galleryTimer);
    this.game?.destroy();
    this.game = null;
    if (isDevMode() && isPlatformBrowser(this.platformId)) delete (window as LoveFightDebugWindow).__LOVE_FIGHT_DEBUG__;
  }
}
