import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KhuyenMaiService, KhuyenMaiVm } from '../../services/khuyen-mai.service';
import { PromoStatusBadgeComponent } from '../../../../shared/components/promo-status-badge/promo-status-badge.component';

@Component({
  selector: 'app-khuyenmai-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PromoStatusBadgeComponent],
  templateUrl: './khuyenmai-list.component.html',
})
export class KhuyenmaiListComponent implements OnInit {
  private khuyenMaiService = inject(KhuyenMaiService);
  private cdr = inject(ChangeDetectorRef);

  promotions: KhuyenMaiVm[] = [];
  filteredPromotions: KhuyenMaiVm[] = [];
  paginatedPromotions: KhuyenMaiVm[] = [];

  isLoading = true;
  searchTerm: string = '';
  selectedStatus: string = 'Tất cả';

  // KPIs
  totalPromos = 0;
  activePromos = 0;
  // (Giả lập 2 KPI này, tương lai gọi API Dashboard)
  discountedProductsCount = 15; 
  totalDiscountToday = 450000;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  math = Math;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.khuyenMaiService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.promotions = res.data;
          this.calculateRuntimeStatusAndKPIs();
          this.applyFilters();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi tải danh sách KM:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Tự động gán trạng thái runtime để hỗ trợ chức năng Lọc (Filter)
  calculateRuntimeStatusAndKPIs(): void {
    const now = new Date().getTime();
    this.activePromos = 0;
    this.totalPromos = this.promotions.length;

    this.promotions.forEach(km => {
      const start = new Date(km.ngayBD).getTime();
      const end = new Date(km.ngayKT).getTime();
      
      if (now < start) (km as any)._runtimeStatus = 'Sắp diễn ra';
      else if (now > end) (km as any)._runtimeStatus = 'Hết hạn';
      else {
        (km as any)._runtimeStatus = 'Đang diễn ra';
        this.activePromos++;
      }
    });
  }

  applyFilters(): void {
    this.filteredPromotions = this.promotions.filter(km => {
      const term = this.searchTerm.trim().toLowerCase();
      const matchesSearch = !term || 
        km.maKM.toLowerCase().includes(term) || 
        km.tenKM.toLowerCase().includes(term);

      const matchesStatus = this.selectedStatus === 'Tất cả' || (km as any)._runtimeStatus === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPromotions.length / this.itemsPerPage) || 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedPromotions = this.filteredPromotions.slice(startIndex, startIndex + this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  endEarly(km: KhuyenMaiVm): void {
    if (confirm(`Bạn có chắc chắn muốn KẾT THÚC SỚM chương trình "${km.tenKM}"?\nChương trình sẽ lập tức hết hạn và không thể hoàn tác!`)) {
      this.isLoading = true;
      this.khuyenMaiService.endEarly(km.maKM, km).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Đã kết thúc sớm chương trình khuyến mãi!');
            this.loadData();
          }
        },
        error: (err) => {
          console.error(err);
          alert('Có lỗi xảy ra khi cập nhật hệ thống.');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }
}