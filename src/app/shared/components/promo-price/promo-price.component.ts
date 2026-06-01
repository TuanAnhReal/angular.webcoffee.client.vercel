import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-promo-price',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col">
      @if (hasPromo) {
        <span class="text-[11px] text-slate-400 line-through font-medium">{{ originalPrice | number:'1.0-0' }}đ</span>
        <span class="text-primary font-black text-body-md">{{ finalPrice | number:'1.0-0' }}đ</span>
      } @else {
        <span class="text-primary font-black text-body-md">{{ originalPrice | number:'1.0-0' }}đ</span>
      }
    </div>
  `
})
export class PromoPriceComponent {
  @Input() hasPromo: boolean = false;
  @Input() originalPrice: number = 0;
  @Input() finalPrice: number = 0;
}