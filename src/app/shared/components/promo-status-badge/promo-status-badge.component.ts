import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-promo-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold text-[11px] uppercase tracking-wider border"
          [ngClass]="statusClasses">
      <span class="w-1.5 h-1.5 rounded-full" [ngClass]="dotClasses"></span>
      {{ statusText }}
    </span>
  `
})
export class PromoStatusBadgeComponent implements OnInit, OnChanges {
  @Input() ngayBD!: string;
  @Input() ngayKT!: string;

  statusText: string = '';
  statusClasses: string = '';
  dotClasses: string = '';
  statusCode: 'ACTIVE' | 'UPCOMING' | 'EXPIRED' = 'EXPIRED';

  ngOnInit() {
    this.calculateStatus();
  }

  ngOnChanges() {
    this.calculateStatus();
  }

  private calculateStatus(): void {
    if (!this.ngayBD || !this.ngayKT) return;

    const now = new Date().getTime();
    const start = new Date(this.ngayBD).getTime();
    const end = new Date(this.ngayKT).getTime();

    if (now < start) {
      this.statusCode = 'UPCOMING';
      this.statusText = 'Sắp diễn ra';
      this.statusClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      this.dotClasses = 'bg-blue-500';
    } else if (now > end) {
      this.statusCode = 'EXPIRED';
      this.statusText = 'Hết hạn';
      this.statusClasses = 'bg-slate-50 text-slate-500 border-slate-200';
      this.dotClasses = 'bg-slate-400';
    } else {
      this.statusCode = 'ACTIVE';
      this.statusText = 'Đang diễn ra';
      this.statusClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      this.dotClasses = 'bg-emerald-500 animate-pulse'; // Hiệu ứng nhấp nháy báo hiệu đang chạy
    }
  }
}