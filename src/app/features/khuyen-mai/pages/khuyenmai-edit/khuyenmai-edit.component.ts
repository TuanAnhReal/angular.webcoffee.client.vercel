import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, Observable, Subject, of } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { KhuyenMaiService, KhuyenMaiVm } from '../../services/khuyen-mai.service';
import { SanPhamService, SanPhamVm } from '../../../san-pham/services/san-pham.service';

@Component({
  selector: 'app-khuyenmai-edit',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './khuyenmai-edit.component.html'
})
export class KhuyenmaiEditComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private khuyenMaiService = inject(KhuyenMaiService);
  private sanPhamService = inject(SanPhamService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  promoForm!: FormGroup;
  maKM: string = '';
  promoData: KhuyenMaiVm | null = null;
  runtimeStatus: string = '';

  products: SanPhamVm[] = [];
  filteredProducts: SanPhamVm[] = [];
  
  // Quản lý Diff sản phẩm
  originalSelectedProducts = new Set<string>();
  currentSelectedProducts = new Set<string>();
  
  isLoading = true;
  isSubmitting = false;

  ngOnInit(): void {
    this.maKM = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    if (this.maKM) this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.promoForm = this.fb.group({
      tenKM: ['', Validators.required],
      loaiKM: ['PERCENT', Validators.required],
      giaTriKM: [0, [Validators.required, Validators.min(1)]],
      ngayBD: ['', Validators.required],
      ngayKT: ['', Validators.required],
      ghiChuKM: ['']
    });

    this.promoForm.get('loaiKM')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(loai => {
      const giaTriCtrl = this.promoForm.get('giaTriKM');
      if (loai === 'PERCENT') giaTriCtrl?.setValidators([Validators.required, Validators.min(1), Validators.max(100)]);
      else giaTriCtrl?.setValidators([Validators.required, Validators.min(1000)]);
      giaTriCtrl?.updateValueAndValidity();
    });
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      promo: this.khuyenMaiService.getById(this.maKM),
      assigned: this.khuyenMaiService.getSanPhams(this.maKM),
      allProducts: this.sanPhamService.getAll()
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        // 1. Ánh xạ thông tin KM
        if (res.promo.success) {
          this.promoData = res.promo.data;
          this.calculateStatus();
          
          this.promoForm.patchValue({
            tenKM: this.promoData?.tenKM,
            loaiKM: this.promoData?.loaiKM,
            giaTriKM: this.promoData?.giaTriKM,
            ngayBD: this.promoData?.ngayBD?.substring(0, 16),
            ngayKT: this.promoData?.ngayKT?.substring(0, 16),
            ghiChuKM: this.promoData?.ghiChuKM
          });

          // Khóa Form nếu Hết hạn
          if (this.runtimeStatus === 'Hết hạn') this.promoForm.disable();
        }

        // 2. Map Sản phẩm đã gán
        if (res.assigned.success) {
          res.assigned.data.forEach((p: any) => {
            this.originalSelectedProducts.add(p.maSP);
            this.currentSelectedProducts.add(p.maSP);
          });
        }

        // 3. Map List Tất cả SP
        if (res.allProducts.success) {
          this.products = res.allProducts.data.filter((p: any) => p.trangThai === 'Đang bán');
          this.filteredProducts = [...this.products];
        }

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

  calculateStatus(): void {
    if (!this.promoData) return;
    const now = new Date().getTime();
    const start = new Date(this.promoData.ngayBD).getTime();
    const end = new Date(this.promoData.ngayKT).getTime();
    if (now < start) this.runtimeStatus = 'Sắp diễn ra';
    else if (now > end) this.runtimeStatus = 'Hết hạn';
    else this.runtimeStatus = 'Đang diễn ra';
  }

  onSearchProduct(event: Event): void {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredProducts = this.products.filter(p => p.tenSp.toLowerCase().includes(term) || p.maSp.toLowerCase().includes(term));
  }

  toggleProduct(maSp: string, p: SanPhamVm): void {
    if (this.runtimeStatus === 'Hết hạn') return;
    
    // Nếu SP có KM nhưng KHÁC với KM đang sửa => Bị Overlapped => Chặn
    if (p.coKhuyenMai && p.maKhuyenMai !== this.maKM) return;

    if (this.currentSelectedProducts.has(maSp)) this.currentSelectedProducts.delete(maSp);
    else this.currentSelectedProducts.add(maSp);
  }

  // ================= TRANSACTION UPDATE =================
  onSubmit(): void {
    if (this.promoForm.invalid || this.runtimeStatus === 'Hết hạn') return;

    const formValues = this.promoForm.getRawValue();
    if (new Date(formValues.ngayKT) <= new Date(formValues.ngayBD)) {
      alert('Lỗi: Ngày kết thúc phải lớn hơn ngày bắt đầu!'); return;
    }

    // Tính Diff Sản phẩm
    const addedArray = Array.from(this.currentSelectedProducts).filter(x => !this.originalSelectedProducts.has(x));
    const removedArray = Array.from(this.originalSelectedProducts).filter(x => !this.currentSelectedProducts.has(x));

    if (this.currentSelectedProducts.size === 0) {
      alert('Phải có ít nhất 1 sản phẩm áp dụng khuyến mãi!'); return;
    }

    if (!confirm('Xác nhận lưu thay đổi chương trình Khuyến mãi?')) return;

    this.isSubmitting = true;
    
    // Gom tất cả API vào 1 mảng Promise để chạy đồng thời
    const updateTasks: Observable<any>[] = [this.khuyenMaiService.update(this.maKM, formValues)];

    if (addedArray.length > 0) {
      updateTasks.push(this.khuyenMaiService.ganSanPham(this.maKM, addedArray));
    }
    
    if (removedArray.length > 0) {
      const removeObs = removedArray.map(sp => this.khuyenMaiService.xoaSanPham(this.maKM, sp));
      updateTasks.push(forkJoin(removeObs)); // Xóa từng thằng vì Backend chỉ cho xóa lẻ
    }

    forkJoin(updateTasks).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        alert('Cập nhật Khuyến Mãi thành công!');
        this.router.navigate(['/admin/khuyen-mai']);
      },
      error: (err) => {
        console.error(err);
        alert('Lỗi cập nhật! Có thể sản phẩm mới chọn đã bị gán KM khác.');
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }
}