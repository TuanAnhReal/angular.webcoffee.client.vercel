import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-promo-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasPromo && promoValue) {
      <div class="relative group inline-block">
        <span class="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5">
          <span class="material-symbols-outlined text-[10px]">sell</span>
          -{{ promoType === 'PERCENT' ? promoValue + '%' : (promoValue | number:'1.0-0') + 'đ' }}
        </span>
        
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max max-w-[200px] bg-slate-800 text-white text-[10px] p-2 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
          <p class="font-bold text-rose-300">{{ promoName }}</p>
          <p class="text-slate-300">Giảm {{ promoType === 'PERCENT' ? promoValue + '%' : (promoValue | number:'1.0-0') + 'đ' }}</p>
        </div>
      </div>
    }
  `
})
export class PromoBadgeComponent {
  @Input() hasPromo: boolean = false;
  @Input() promoType?: string | null = 'PERCENT';
  @Input() promoValue?: number | null = 0;
  @Input() promoName?: string | null = '';
}