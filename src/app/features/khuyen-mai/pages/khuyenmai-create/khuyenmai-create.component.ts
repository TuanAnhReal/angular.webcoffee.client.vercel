import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, throwError } from 'rxjs';
import { switchMap, catchError, takeUntil } from 'rxjs/operators';

import { KhuyenMaiService } from '../../services/khuyen-mai.service';
import { SanPhamService, SanPhamVm } from '../../../san-pham/services/san-pham.service';

@Component({
  selector: 'app-khuyenmai-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './khuyenmai-create.component.html'
})
export class KhuyenmaiCreateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private khuyenMaiService = inject(KhuyenMaiService);
  private sanPhamService = inject(SanPhamService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  promoForm!: FormGroup;
  
  products: SanPhamVm[] = [];
  filteredProducts: SanPhamVm[] = [];
  searchProductTerm = '';
  
  selectedProducts = new Set<string>(); // Lưu trữ MaSP được chọn
  
  isLoading = true;
  isSubmitting = false;

  ngOnInit(): void {
    this.initForm();
    this.loadProducts();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    // Mặc định ngày Bắt đầu là hôm nay, ngày Kết thúc là ngày mai
    const today = new Date().toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().substring(0, 16);

    this.promoForm = this.fb.group({
      tenKM: ['', Validators.required],
      loaiKM: ['PERCENT', Validators.required], // 'PERCENT' hoặc 'AMOUNT'
      giaTriKM: [0, [Validators.required, Validators.min(1)]],
      ngayBD: [today, Validators.required],
      ngayKT: [tomorrow, Validators.required],
      ghiChuKM: ['']
    });
  }

  setupFormListeners(): void {
    // Lắng nghe sự kiện để validate chéo (PERCENT không được > 100)
    this.promoForm.get('loaiKM')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(loai => {
      const giaTriCtrl = this.promoForm.get('giaTriKM');
      if (loai === 'PERCENT') {
        giaTriCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      } else {
        giaTriCtrl?.setValidators([Validators.required, Validators.min(1000)]); // VNĐ tối thiểu 1k
      }
      giaTriCtrl?.updateValueAndValidity();
    });
  }

  loadProducts(): void {
    this.sanPhamService.getAll().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        if (res.success) {
          this.products = res.data.filter(p => p.trangThai === 'Đang bán');
          this.filteredProducts = [...this.products];
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

  onSearchProduct(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProducts = this.products.filter(p => 
      p.tenSp.toLowerCase().includes(term) || p.maSp.toLowerCase().includes(term)
    );
  }

  // ================= LOGIC CHỌN SẢN PHẨM =================
  toggleProduct(maSp: string, isOverlapped: boolean): void {
    if (isOverlapped) return; // Chặn cứng không cho chọn nếu đang chạy KM khác

    if (this.selectedProducts.has(maSp)) {
      this.selectedProducts.delete(maSp);
    } else {
      this.selectedProducts.add(maSp);
    }
  }

  selectAllAvailable(): void {
    // Chỉ chọn những SP đang lọc trên màn hình & CHƯA có KM
    const availableProducts = this.filteredProducts.filter(p => !p.coKhuyenMai);
    
    // Nếu tất cả available đã được chọn -> Bỏ chọn hết
    const allSelected = availableProducts.every(p => this.selectedProducts.has(p.maSp));
    
    if (allSelected) {
      availableProducts.forEach(p => this.selectedProducts.delete(p.maSp));
    } else {
      availableProducts.forEach(p => this.selectedProducts.add(p.maSp));
    }
  }

  // ================= TRANSACTION SUBMIT LUỒNG TẠO =================
  onSubmit(): void {
    // 1. Validate
    if (this.promoForm.invalid) {
      this.promoForm.markAllAsTouched();
      alert('Vui lòng điền đúng và đủ thông tin Khuyến mãi!');
      return;
    }

    const formValues = this.promoForm.getRawValue();
    if (new Date(formValues.ngayKT) <= new Date(formValues.ngayBD)) {
      alert('Lỗi: Ngày kết thúc phải lớn hơn ngày bắt đầu!');
      return;
    }

    if (this.selectedProducts.size === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm áp dụng khuyến mãi!');
      return;
    }

    if (!confirm(`Bạn xác nhận tạo Khuyến mãi "${formValues.tenKM}" cho ${this.selectedProducts.size} sản phẩm?`)) return;

    this.isSubmitting = true;

    // 2. Chaining Transaction (Tạo KM -> Lấy ID -> Gán SP -> Nếu Gán lỗi thì Xóa KM gốc)
    this.khuyenMaiService.create(formValues).pipe(
      switchMap(resKM => {
        if (!resKM.success) return throwError(() => new Error(resKM.message || 'Lỗi tạo KM gốc.'));
        
        const newMaKM = resKM.data.maKM;
        const maSpArray = Array.from(this.selectedProducts);

        // Gọi hàm Gán SP
        return this.khuyenMaiService.ganSanPham(newMaKM, maSpArray).pipe(
          catchError(errGán => {
            console.error('Lỗi khi gán SP, tiến hành Rollback...', errGán);
            // ROLLBACK: Xóa KM vừa tạo
            return this.khuyenMaiService.delete(newMaKM).pipe(
              switchMap(() => throwError(() => new Error(errGán.error?.message || 'Có sản phẩm xung đột. Đã hủy tạo Khuyến Mãi!')))
            );
          })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resGan) => {
        alert('Tạo chương trình Khuyến Mãi và áp dụng sản phẩm thành công!');
        this.router.navigate(['/admin/khuyen-mai']);
      },
      error: (err) => {
        alert(err.message);
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}