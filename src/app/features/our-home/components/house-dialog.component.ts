import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-house-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="house-dialog" [attr.aria-labelledby]="headingId" (click)="onBackdrop($event)" (keydown)="onKeydown($event)" (cancel)="onCancel($event)" (close)="notifyClosed()">
      <button class="dialog-close" type="button" aria-label="Đóng cửa sổ" autofocus (click)="close()">×</button>
      <div class="dialog-content">
        <p class="dialog-eyebrow">H ♡ Q · Một điều nhỏ trong căn nhà</p>
        <h2 [id]="headingId">{{ title }}</h2>
        <ng-content />
      </div>
    </dialog>
  `,
  styles: [`
    :host{display:contents}.house-dialog{position:fixed;width:min(620px,calc(100vw - max(1rem,env(safe-area-inset-left)) - max(1rem,env(safe-area-inset-right))));max-width:620px;max-height:min(84dvh,calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem));margin:auto;padding:0;overflow:visible;border:1px solid rgba(122,79,73,.22);border-radius:18px;background:#fffaf4;color:#33272a;box-shadow:0 28px 100px #24131660}
    .house-dialog::backdrop{background:rgba(37,25,31,.62);backdrop-filter:blur(5px)}.dialog-content{max-height:min(84dvh,780px);overflow:auto;padding:clamp(1.5rem,5vw,2.6rem)}
    .dialog-close{position:sticky;z-index:2;top:.75rem;float:right;display:grid;width:46px;height:46px;place-items:center;margin:-.75rem -.75rem 0 0;border:1px solid var(--border-strong);border-radius:50%;background:#fffaf4;color:var(--wine);font-size:1.7rem;cursor:pointer}
    .dialog-close:focus-visible{outline:3px solid var(--champagne);outline-offset:2px}.dialog-eyebrow{margin:0 0 .6rem;color:var(--wine);font-size:.63rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase}
    h2{max-width:90%;margin:0 0 1rem;font-family:var(--font-display);font-size:clamp(1.7rem,6vw,2.6rem);font-weight:400;line-height:1.05;letter-spacing:-.04em}
    @media(max-width:600px){.house-dialog{width:calc(100vw - max(1rem,env(safe-area-inset-left)) - max(1rem,env(safe-area-inset-right)));max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem);border-radius:14px}.dialog-content{max-height:calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 1rem);padding:1.3rem}.dialog-close{top:.4rem;margin:-.4rem -.4rem 0 0}}
  `]
})
export class HouseDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dialog', { static: true }) private readonly dialogRef!: ElementRef<HTMLDialogElement>;
  @Input({ required: true }) title = '';
  @Output() readonly dismissed = new EventEmitter<void>();
  private notified = false;
  private destroyed = false;
  protected readonly headingId = 'house-dialog-title';

  ngAfterViewInit(): void {
    const dialog = this.dialogRef.nativeElement;
    if (!dialog.open) dialog.showModal();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    const dialog = this.dialogRef?.nativeElement;
    if (dialog?.open) dialog.close();
  }

  close(): void {
    this.dialogRef.nativeElement.close();
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.close();
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialogRef.nativeElement) this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const dialog = this.dialogRef.nativeElement;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.getClientRects().length > 0);
    if (!focusable.length) {
      event.preventDefault();
      return;
    }

    const active = dialog.ownerDocument.activeElement;
    const activeIndex = focusable.indexOf(active as HTMLElement);
    if (activeIndex < 0) {
      event.preventDefault();
      (event.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
    } else if (event.shiftKey && activeIndex === 0) {
      event.preventDefault();
      focusable[focusable.length - 1].focus();
    } else if (!event.shiftKey && activeIndex === focusable.length - 1) {
      event.preventDefault();
      focusable[0].focus();
    }
  }

  protected notifyClosed(): void {
    if (this.destroyed || this.notified) return;
    this.notified = true;
    this.dismissed.emit();
  }
}
