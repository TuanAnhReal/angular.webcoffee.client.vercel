import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SanPhamService, LoaiSPVm, SanPhamVm } from '../../services/san-pham.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-san-pham-update',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './san-pham-update.component.html'
})
export class SanPhamUpdateComponent implements OnInit, OnDestroy {
  private fb             = inject(FormBuilder);
  private sanPhamService = inject(SanPhamService);
  private router         = inject(Router);
  private route          = inject(ActivatedRoute);
  private cdr            = inject(ChangeDetectorRef);
  private destroy$       = new Subject<void>();

  productForm!: FormGroup;
  categories: LoaiSPVm[] = [];

  maSp            = '';
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  currentImageUrl: string | null = null;

  isSubmitting  = false;
  isLoadingData = true;

  selectedCategoryName = '';
  charCount            = 0;
  loiNhuan             = 0;
  bienLoiNhuan         = 0;

  ngOnInit(): void {
    this.maSp = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    this.loadAllData();
    this.watchFormChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      tenSp:     ['', [Validators.required, Validators.maxLength(255)]],
      maLoaiSp:  ['', Validators.required],
      giaVon:    [0,  [Validators.required, Validators.min(0)]],
      donGia:    [0,  [Validators.required, Validators.min(0)]],
      dvt:       ['Ly', Validators.required],
      kichThuoc: ['Size M'],
      moTa:      [''],
      trangThai: ['Đang bán', Validators.required]
    });
  }

  // ✅ Subscribe valueChanges để cập nhật các property tính toán
  private watchFormChanges(): void {
    this.productForm.get('maLoaiSp')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.selectedCategoryName =
          this.categories.find(c => c.maLoaiSp === val)?.tenLoaiSp ?? '';
      });

    this.productForm.get('moTa')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        this.charCount = (val as string)?.length ?? 0;
      });

    this.productForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(val => {
        const gia  = Number(val.donGia) || 0;
        const von  = Number(val.giaVon) || 0;
        this.loiNhuan    = gia - von;
        this.bienLoiNhuan = gia > 0 ? (this.loiNhuan / gia) * 100 : 0;
      });
  }

loadAllData(): void {
    if (!this.maSp) {
      this.isLoadingData = false;
      this.cdr.detectChanges();
      return;
    }

    forkJoin({
      categories: this.sanPhamService.getLoaiSps(),
      product:    this.sanPhamService.getById(this.maSp)
    }).subscribe({
      next: ({ categories, product }) => {
        // --- Danh mục ---
        if (categories.success) {
          this.categories = categories.data;
        }

        // --- Dữ liệu sản phẩm ---
        if (product.success && product.data) {
          this.patchFormValues(product.data);
        }

        this.isLoadingData = false;
        this.cdr.detectChanges(); // Đánh thức Angular tắt vòng xoay
      },
      error: (err) => {
        console.error(err);
        alert('Không tìm thấy sản phẩm!');
        this.router.navigate(['/admin/san-pham']);
        
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  private patchFormValues(p: SanPhamVm): void {
    
    const matchedCat = this.categories.find(
      c => c.maLoaiSp.toLowerCase() === (p.maLoaiSp ?? '').toLowerCase()
    );

    this.productForm.patchValue({
      tenSp:     p.tenSp,
      maLoaiSp:  p.maLoaiSp ?? '',
      giaVon:    p.giaVon    ?? 0,
      donGia:    p.giaSp,
      dvt:       p.dvt       ?? 'Ly',
      kichThuoc: p.kichThuoc ?? 'Size M',
      moTa:      p.moTa      ?? '',
      trangThai: p.trangThai ?? 'Đang bán'
    });

    // Cập nhật các property tính toán sau khi patch
    this.selectedCategoryName = matchedCat?.tenLoaiSp ?? '';
    this.charCount = p.moTa?.length ?? 0;

    const gia = p.giaSp || 0;
    const von = p.giaVon || 0;
    this.loiNhuan     = gia - von;
    this.bienLoiNhuan = gia > 0 ? (this.loiNhuan / gia) * 100 : 0;

    if (p.hinhAnh) {
      this.currentImageUrl = p.hinhAnh.startsWith('http')
        ? p.hinhAnh
        : `assets/images/products/${p.hinhAnh}`;
      this.imagePreview = this.currentImageUrl;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = this.currentImageUrl;
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formData   = new FormData();
    const formValues = this.productForm.value;

    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== null && formValues[key] !== undefined) {
        formData.append(key, formValues[key]);
      }
    });

    if (this.selectedFile) {
      formData.append('HinhAnhFile', this.selectedFile);
    }

    this.sanPhamService.update(this.maSp, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            alert('Cập nhật sản phẩm thành công!');
            this.router.navigate(['/admin/san-pham']);
          }
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error(err);
          alert('Có lỗi xảy ra khi lưu sản phẩm.');
          this.isSubmitting = false;
        }
      });
  }
}