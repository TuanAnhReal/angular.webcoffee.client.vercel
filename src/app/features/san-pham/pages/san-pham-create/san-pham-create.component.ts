import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { SanPhamService, LoaiSPVm } from '../../services/san-pham.service';

@Component({
  selector: 'app-san-pham-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './san-pham-create.component.html'
})
export class SanPhamCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sanPhamService = inject(SanPhamService);
  private router = inject(Router);

  productForm!: FormGroup;
  categories: LoaiSPVm[] = [];
  
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  
  isSubmitting = false;

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      tenSp: ['', [Validators.required, Validators.maxLength(255)]],
      maLoaiSp: ['', Validators.required],
      giaVon: [0, [Validators.required, Validators.min(0)]],
      donGia: [0, [Validators.required, Validators.min(0)]],
      dvt: ['Ly', Validators.required],
      kichThuoc: ['Size M'],
      moTa: [''],
      trangThai: ['Đang bán', Validators.required]
    });
  }

  loadCategories(): void {
    // Giả sử bạn có API lấy danh mục. Nếu chưa có, bạn có thể hardcode tạm mảng này
    this.sanPhamService.getLoaiSps().subscribe({
      next: (res) => {
        if (res.success) this.categories = res.data;
      },
      error: () => console.error('Không tải được danh mục')
    });
  }

  // Bắt sự kiện khi người dùng chọn file ảnh
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Đọc file để hiển thị Preview
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  // Xóa ảnh đã chọn
  removeImage(): void {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    // Khởi tạo FormData
    const formData = new FormData();
    const formValues = this.productForm.value;

    Object.keys(formValues).forEach(key => {
      formData.append(key, formValues[key]);
    });

    if (this.selectedFile) {
      formData.append('HinhAnhFile', this.selectedFile);
    }

    // Gọi API
    this.sanPhamService.create(formData).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Thêm sản phẩm thành công!');
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