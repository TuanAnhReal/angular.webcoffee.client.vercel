import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NhanVienService, NhanVienVm, LoaiNVVm } from '../../services/nhan-vien.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-nhan-vien-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './nhan-vien-list.component.html'
})
export class NhanVienListComponent implements OnInit {
  private nhanVienService = inject(NhanVienService);
  private cdr = inject(ChangeDetectorRef);

  employees: NhanVienVm[] = [];
  filteredEmployees: NhanVienVm[] = [];
  paginatedEmployees: NhanVienVm[] = [];
  categories: LoaiNVVm[] = []; // Danh sách Chức vụ

  isLoading = true;

  // Thống kê
  totalEmployees = 0;
  activeEmployees = 0;

  // Bộ lọc
  searchTerm: string = '';
  selectedRole: string = ''; // Lọc theo chức vụ
  selectedStatus: string = '';

  // Phân trang
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  math = Math;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      employees: this.nhanVienService.getAll(),
      categories: this.nhanVienService.getLoaiNvs()
    }).subscribe({
      next: ({ employees, categories }) => {
        if (categories.success) {
          this.categories = categories.data;
        }

        if (employees.success) {
          this.employees = employees.data;
          this.calculateStats();
          this.applyFilters();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateStats(): void {
    this.totalEmployees = this.employees.length;
    this.activeEmployees = this.employees.filter(e => e.trangThaiNV === 'Đang làm').length;
  }

  // Hàm helper lấy tên chức vụ hiển thị ở bảng
  getRoleName(maLoaiNV: string): string {
    return this.categories.find(c => c.maLoaiNV === maLoaiNV)?.tenLoaiNV || 'Chưa phân công';
  }

  // Lấy 2 chữ cái đầu để làm Avatar giả (VD: Nguyễn Nam -> NN)
  getAvatarInitials(ho: string, ten: string): string {
    const hoChar = ho ? ho.charAt(0) : '';
    const tenChar = ten ? ten.charAt(0) : '';
    return (hoChar + tenChar).toUpperCase();
  }

  applyFilters(): void {
    this.filteredEmployees = this.employees.filter(e => {
      const fullName = `${e.hoNV} ${e.tenNV}`.toLowerCase();
      
      const matchesSearch = !this.searchTerm || 
        fullName.includes(this.searchTerm.toLowerCase()) || 
        e.maNV.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (e.soDTNV && e.soDTNV.includes(this.searchTerm));
      
      const matchesRole = !this.selectedRole || e.maLoaiNV === this.selectedRole;
      const matchesStatus = !this.selectedStatus || e.trangThaiNV === this.selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });

    this.currentPage = 1; 
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedEmployees = this.filteredEmployees.slice(startIndex, endIndex);
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

  deleteEmployee(maNV: string, fullName: string): void {
    if (confirm(`Bạn có chắc chắn muốn xóa nhân viên "${fullName}" không?`)) {
      this.nhanVienService.delete(maNV).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Đã xóa nhân viên thành công!');
            this.loadData();
          }
        },
        error: (err) => {
          console.error(err);
          alert('Có lỗi xảy ra khi xóa nhân viên!');
        }
      });
    }
  }
}