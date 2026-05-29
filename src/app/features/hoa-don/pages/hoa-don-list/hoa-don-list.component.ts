import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoaDonService, HoaDonVm } from '../../services/hoa-don.service';

@Component({
  selector: 'app-hoa-don-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './hoa-don-list.component.html'
})
export class HoaDonListComponent implements OnInit {
  private hoaDonService = inject(HoaDonService);
  private cdr = inject(ChangeDetectorRef);

  invoices: HoaDonVm[] = [];
  filteredInvoices: HoaDonVm[] = [];
  paginatedInvoices: HoaDonVm[] = [];

  // Thống kê
  totalRevenueToday = 0;
  pendingInvoicesCount = 0;
  totalInvoicesCount = 0;

  // Bộ lọc
  searchTerm: string = '';
  selectedDate: string = ''; // Format: YYYY-MM-DD
  selectedStatus: string = 'Tất cả';

  // Phân trang
  currentPage = 1;
  itemsPerPage = 10; // Tăng lên 10 dòng/trang theo chuẩn enterprise dashboard dẹt
  totalPages = 1;
  math = Math;

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.hoaDonService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.invoices = res.data;
          this.calculateStats();
          this.applyFilters();
        }
        this.cdr.detectChanges(); // Ép kích hoạt vòng đời render cập nhật UI ngay lập tức
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách hóa đơn:', err);
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats(): void {
    this.totalInvoicesCount = this.invoices.length;
    this.pendingInvoicesCount = this.invoices.filter(hd => hd.trangThaiHD === 'Chưa thanh toán').length;

    // Tính doanh thu của HÔM NAY (dựa trên tgVao và trạng thái Đã thanh toán) đúng múi giờ local
    const today = new Date().toLocaleDateString('en-CA'); // Trả về dạng YYYY-MM-DD chính xác
    this.totalRevenueToday = this.invoices
      .filter(hd => hd.tgVao && hd.tgVao.startsWith(today) && hd.trangThaiHD === 'Đã thanh toán')
      .reduce((sum, hd) => sum + hd.tongTien, 0);
  }

  getAvatarInitials(maKH: string): string {
    if (!maKH || maKH.toLowerCase() === 'khách lẻ' || maKH.toLowerCase() === 'khách vãng lai') return 'K';
    return maKH.substring(0, 2).toUpperCase();
  }

  applyFilters(): void {
    this.filteredInvoices = this.invoices.filter(hd => {
      // 1. Lọc theo text (Mã HĐ hoặc Mã KH)
      const matchesSearch = !this.searchTerm || 
        hd.soHD.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        (hd.maKH && hd.maKH.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      // 2. Lọc theo trạng thái
      const matchesStatus = this.selectedStatus === 'Tất cả' || hd.trangThaiHD === this.selectedStatus;

      // 3. Lọc theo ngày (so khớp phần YYYY-MM-DD của tgVao)
      const matchesDate = !this.selectedDate || (hd.tgVao && hd.tgVao.startsWith(this.selectedDate));

      return matchesSearch && matchesStatus && matchesDate;
    });

    this.currentPage = 1; 
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedInvoices = this.filteredInvoices.slice(startIndex, endIndex);
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
}