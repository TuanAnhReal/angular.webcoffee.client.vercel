import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KhachHangService, KhachHangVm } from '../../services/khach-hang.service';

@Component({
  selector: 'app-khach-hang-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './khach-hang-list.component.html'
})
export class KhachHangListComponent implements OnInit {
  private khachHangService = inject(KhachHangService);
  private cdr = inject(ChangeDetectorRef);

  customers: KhachHangVm[] = [];
  filteredCustomers: KhachHangVm[] = [];
  paginatedCustomers: KhachHangVm[] = [];

  isLoading = true;
  totalCustomers = 0;
  vipCustomersCount = 0;
  newCustomersThisMonth = 0;

  // 🌟 BỘ LỌC VÀ TÌM KIẾM MỚI ĐƯỢC TÍCH HỢP
  searchTerm: string = '';
  selectedDate: string = '';       // Lọc chính xác theo một ngày chỉ định (YYYY-MM-DD)
  startDate: string = '';          // Khoảng thời gian: Từ ngày
  endDate: string = '';            // Khoảng thời gian: Đến ngày
  filterPoints: string = 'Tất cả';  // Lọc hạng điểm: Tất cả / VIP (>500 pts) / Thường (<500 pts)

  // Phân trang
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  math = Math;

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.khachHangService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          // Chỉ loại bỏ khách hệ thống mặc định KH000, giữ lại khách vãng lai tự động từ màn Order
          this.customers = res.data.filter(k => k.maKH !== 'KH000');
          
          this.calculateStats();
          this.applyFilter();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách khách hàng:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats(): void {
    this.totalCustomers = this.customers.length;
    this.vipCustomersCount = this.customers.filter(k => k.diemTichLuy >= 500).length;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    this.newCustomersThisMonth = this.customers.filter(k => {
      if (!k.ngayTao) return false;
      const createdDate = new Date(k.ngayTao);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;
  }

  // 🌟 REFACTOR PHỄU LỌC LIÊN HOÀN (CHỐNG STALE STATE)
  applyFilter(): void {
    this.filteredCustomers = this.customers.filter(k => {
      // 1. Tìm kiếm thông minh theo Tên, SĐT (dọn sạch dấu cách), hoặc Mã khách hàng
      const term = this.searchTerm.trim().toLowerCase();
      const matchesSearch = !term || 
        (k.maKH && k.maKH.toLowerCase().includes(term)) ||
        (k.tenKH && k.tenKH.toLowerCase().includes(term)) ||
        (k.sdtkh && k.sdtkh.replace(/[\s\-\.]/g, '').includes(term));

      // 2. Lọc chính xác theo một ngày cụ thể (So khớp YYYY-MM-DD của ngayTao)
      const matchesSingleDate = !this.selectedDate || 
        (k.ngayTao && k.ngayTao.startsWith(this.selectedDate));

      // 3. Lọc theo khoảng thời gian tạo tài khoản (Date Range: Từ ngày -> Đến ngày)
      let matchesDateRange = true;
      if (k.ngayTao) {
        const createdDateStr = k.ngayTao.split('T')[0]; // Lấy YYYY-MM-DD
        if (this.startDate && createdDateStr < this.startDate) matchesDateRange = false;
        if (this.endDate && createdDateStr > this.endDate) matchesDateRange = false;
      } else if (this.startDate || this.endDate) {
        matchesDateRange = false; // Không có ngày tạo nhưng form yêu cầu lọc khoảng ngày
      }

      // 4. Lọc theo hạn mức điểm tích lũy thành viên
      let matchesPoints = true;
      if (this.filterPoints === 'VIP') {
        matchesPoints = (k.diemTichLuy >= 500);
      } else if (this.filterPoints === 'Thường') {
        matchesPoints = (k.diemTichLuy < 500);
      }

      // Hợp nhất toàn bộ các điều kiện lọc
      return matchesSearch && matchesSingleDate && matchesDateRange && matchesPoints;
    });

    this.currentPage = 1; // Đẩy về trang đầu khi thay đổi phễu lọc
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage) || 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, startIndex + this.itemsPerPage);
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

  getAvatarInitials(name: string, sdt?: string): string {
    const finalName = name || (sdt ? `Khách ${sdt}` : 'KV');
    const words = finalName.trim().split(' ');
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    return finalName.substring(0, 2).toUpperCase();
  }

  deleteCustomer(customer: KhachHangVm): void {
    if (confirm(`Bạn có chắc chắn muốn xóa khách hàng ${customer.tenKH} không? Mọi điểm tích lũy sẽ bị mất.`)) {
      this.khachHangService.delete(customer.maKH).subscribe({
        next: (res) => {
          if (res.success) {
            this.loadCustomers();
          } else {
            alert(res.message);
          }
        }
      });
    }
  }
}