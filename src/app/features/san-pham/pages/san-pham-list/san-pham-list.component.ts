import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SanPhamService, SanPhamVm } from '../../services/san-pham.service';

@Component({
  selector: 'app-san-pham-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './san-pham-list.component.html'
})
export class SanPhamListComponent implements OnInit {
  private sanPhamService = inject(SanPhamService);
  private cdr = inject(ChangeDetectorRef);

  products: SanPhamVm[] = [];
  filteredProducts: SanPhamVm[] = [];
  paginatedProducts: SanPhamVm[] = [];

  isLoading = true;
  // 👉 BỔ SUNG: Chế độ hiển thị mặc định là dạng bảng dẹt (compact)
  viewMode: 'table' | 'grid' = 'table'; 

  totalProducts = 0;
  activeProducts = 0;
  outOfStockProducts = 0;
  categoryCount = 0;
  categories: string[] = [];

  searchTerm: string = '';
  selectedCategory: string = '';
  selectedStatus: string = '';

  currentPage = 1;
  itemsPerPage = 8; // Tăng số lượng hiển thị trên mỗi trang đối với chế độ grid 4 cột cho cân đối
  totalPages = 1;
  math = Math; 

  ngOnInit(): void {
    this.loadProducts();
  }

  // 👉 BỔ SUNG: Hàm chuyển đổi ViewMode mượt mà
  toggleView(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
    this.cdr.detectChanges();
  }

  loadProducts(): void {
    this.isLoading = true;
    this.sanPhamService.getAll().subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data;
          this.calculateStats();
          this.extractCategories();
          this.applyFilters();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách sản phẩm', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  extractCategories(): void {
    const cats = this.products.map(p => p.tenLoaiSp).filter(c => c != null);
    this.categories = [...new Set(cats)];
  }

  calculateStats(): void {
    this.totalProducts = this.products.length;
    this.activeProducts = this.products.filter(p => p.trangThai === 'Đang bán').length;
    this.outOfStockProducts = this.products.filter(p => p.trangThai === 'Hết hàng').length;
    
    const uniqueCategories = new Set(this.products.map(p => p.tenLoaiSp));
    this.categoryCount = uniqueCategories.size;
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter(p => {
      const matchesSearch = !this.searchTerm || 
        p.tenSp?.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
        p.maSp?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesCategory = !this.selectedCategory || p.tenLoaiSp === this.selectedCategory;
      const matchesStatus = !this.selectedStatus || p.trangThai === this.selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    this.currentPage = 1; 
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredProducts.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(startIndex, endIndex);
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

  deleteProduct(maSp: string, tenSp: string): void {
    const isConfirm = confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${tenSp}" không?\nHành động này không thể hoàn tác!`);
    
    if (isConfirm) {
      this.sanPhamService.delete(maSp).subscribe({
        next: (res) => {
          if (res.success) {
            alert('Đã xóa sản phẩm thành công!');
            this.loadProducts();
          }
        },
        error: (err) => {
          console.error(err);
          alert('Có lỗi xảy ra khi xóa sản phẩm!');
        }
      });
    }
  }
}