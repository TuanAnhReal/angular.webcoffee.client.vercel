import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SanPhamService, SanPhamVm, LoaiSPVm } from '../../services/san-pham.service';

interface LoaiSpThongKe {
  maLoaiSp: string;
  tenLoaiSp: string;
  laHangDeVo: boolean;
  baoQuan: string;
  ghiChuLoaiSP: string;
  soLuong: number; // Chỉ giữ lại số lượng mặt hàng liên kết
}

@Component({
  selector: 'app-loai-sp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './loai-sp.component.html'
})
export class LoaiSpComponent implements OnInit {
  private sanPhamService = inject(SanPhamService);
  private cdr = inject(ChangeDetectorRef);

  products: SanPhamVm[] = [];
  rawCategories: LoaiSPVm[] = [];
  danhSachLoaiSp: LoaiSpThongKe[] = [];
  danhSachHienThi: LoaiSpThongKe[] = [];

  isLoading = true;
  searchTerm: string = '';

  // Trạng thái điều khiển Modal Thêm/Sửa
  showModal = false;
  isEditMode = false;
  
  // Biến phục vụ Two-way binding [(ngModel)] khớp Model Validation của .NET Core
  formMaLoaiSp = '';
  formTenLoaiSp = '';
  formLaHangDeVo: boolean = false;
  formBaoQuan = 'Nhiệt độ phòng';
  formGhiChuLoaiSP = '';

  // Phân trang
  currentPage = 1;
  itemsPerPage = 5;
  totalPages = 1;
  math = Math;

  ngOnInit(): void {
    this.taiDuLieu();
  }

  taiDuLieu(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.sanPhamService.getLoaiSps().subscribe({
      next: (catRes) => {
        if (catRes.success) {
          this.rawCategories = catRes.data;

          this.sanPhamService.getAll().subscribe({
            next: (prodRes) => {
              if (prodRes.success) {
                this.products = prodRes.data;
                this.mapAndCalculateStats();
                this.applyFilters();
              }
              this.isLoading = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Lỗi tải sản phẩm:', err);
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          });
        }
      },
      error: (err) => {
        console.error('Lỗi tải danh mục gốc:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Thuật toán ánh xạ danh mục thực tế từ Database (Đã bỏ phần tính tổng giá trị tiền)
  mapAndCalculateStats(): void {
    this.danhSachLoaiSp = this.rawCategories.map(cat => {
      const spThuocNhom = this.products.filter(p => p.maLoaiSp === cat.maLoaiSp);

      return {
        maLoaiSp: cat.maLoaiSp,
        tenLoaiSp: cat.tenLoaiSp,
        laHangDeVo: cat.laHangDeVo ?? false,
        baoQuan: cat.baoQuan || 'Nhiệt độ phòng',
        ghiChuLoaiSP: cat.ghiChuLoaiSP || '',
        soLuong: spThuocNhom.length
      };
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const filtered = this.danhSachLoaiSp.filter(item => 
      !term || item.tenLoaiSp.toLowerCase().includes(term) || item.maLoaiSp.toLowerCase().includes(term)
    );

    this.totalPages = Math.ceil(filtered.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    this.danhSachHienThi = filtered.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.applyFilters();
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // ================= THAO TÁC CRUD GỌI ĐÚNG PHƯƠNG THỨC / URL =================

  moModalThem(): void {
    this.isEditMode = false;
    this.formMaLoaiSp = '';
    this.formTenLoaiSp = '';
    this.formLaHangDeVo = false;
    this.formBaoQuan = 'Nhiệt độ phòng';
    this.formGhiChuLoaiSP = '';
    this.showModal = true;
  }

  moModalSua(cat: LoaiSpThongKe): void {
    this.isEditMode = true;
    this.formMaLoaiSp = cat.maLoaiSp;
    this.formTenLoaiSp = cat.tenLoaiSp;
    this.formLaHangDeVo = cat.laHangDeVo;
    this.formBaoQuan = cat.baoQuan;
    this.formGhiChuLoaiSP = cat.ghiChuLoaiSP;
    this.showModal = true;
  }

  dongModal(): void {
    this.showModal = false;
  }

  luuDanhMuc(): void {
    if (!this.formTenLoaiSp.trim()) {
      alert('Vui lòng không để trống tên danh mục loại sản phẩm!');
      return;
    }

    this.isLoading = true;

    if (this.isEditMode) {
      const payload: LoaiSPVm = {
        maLoaiSp: this.formMaLoaiSp,
        tenLoaiSp: this.formTenLoaiSp.trim(),
        laHangDeVo: this.formLaHangDeVo,
        baoQuan: this.formBaoQuan,
        ghiChuLoaiSP: this.formGhiChuLoaiSP.trim()
      };

      this.sanPhamService.updateCategory(this.formMaLoaiSp, payload).subscribe({
        next: (res) => {
          if (res.success || res.statusCode === 200) {
            alert('Cập nhật danh mục thành công!');
            this.dongModal();
            this.taiDuLieu();
          }
        },
        error: (err) => {
          console.error(err);
          alert('Lỗi cập nhật danh mục!');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });

    } else {
      const payload: LoaiSPVm = {
        maLoaiSp: 'L' + Math.floor(10 + Math.random() * 90),
        tenLoaiSp: this.formTenLoaiSp.trim(),
        laHangDeVo: this.formLaHangDeVo,
        baoQuan: this.formBaoQuan,
        ghiChuLoaiSP: this.formGhiChuLoaiSP.trim()
      };

      this.sanPhamService.createCategory(payload).subscribe({
        next: (res) => {
          if (res.success || res.statusCode === 200) {
            alert('Thêm mới danh mục loại sản phẩm thành công!');
            this.dongModal();
            this.taiDuLieu();
          }
        },
        error: (err) => {
          console.error('Chi tiết lỗi 400 từ .NET Core:', err.error);
          alert(err.error?.message || 'Lỗi thêm mới! Vui lòng kiểm tra lại dữ liệu.');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  xoaDanhMuc(cat: LoaiSpThongKe): void {
    if (cat.soLuong > 0) {
      alert(`Không thể xóa! Danh mục "${cat.tenLoaiSp}" hiện tại đang chứa ${cat.soLuong} sản phẩm của quán.`);
      return;
    }

    const xacNhan = confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn danh mục "${cat.tenLoaiSp}" không?\nHành động này không thể phục hồi dữ liệu!`);
    if (xacNhan) {
      this.isLoading = true;
      this.sanPhamService.deleteCategory(cat.maLoaiSp).subscribe({
        next: (res) => {
          if (res.success || res.statusCode === 200) {
            alert(`Đã xóa thành công danh mục: ${cat.tenLoaiSp}`);
            this.taiDuLieu();
          }
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.message || 'Có lỗi xảy ra khi thực hiện xóa loại sản phẩm!');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }
}