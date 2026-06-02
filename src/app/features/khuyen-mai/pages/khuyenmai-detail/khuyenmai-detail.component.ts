import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { KhuyenMaiService, KhuyenMaiVm } from '../../services/khuyen-mai.service';
import { PromoStatusBadgeComponent } from '../../../../shared/components/promo-status-badge/promo-status-badge.component';

@Component({
  selector: 'app-khuyenmai-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PromoStatusBadgeComponent],
  templateUrl: './khuyenmai-detail.component.html'
})
export class KhuyenmaiDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private khuyenMaiService = inject(KhuyenMaiService);
  private cdr = inject(ChangeDetectorRef);

  maKM: string = '';
  promoData: KhuyenMaiVm | null = null;
  assignedProducts: any[] = [];
  isLoading = true;

  ngOnInit(): void {
    this.maKM = this.route.snapshot.paramMap.get('id') || '';
    if (this.maKM) this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      promo: this.khuyenMaiService.getById(this.maKM),
      assigned: this.khuyenMaiService.getSanPhams(this.maKM)
    }).subscribe({
      next: (res) => {
        if (res.promo.success) this.promoData = res.promo.data;
        if (res.assigned.success) this.assignedProducts = res.assigned.data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}