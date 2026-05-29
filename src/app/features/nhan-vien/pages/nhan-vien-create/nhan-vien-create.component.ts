import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NhanVienService, LoaiNVVm } from '../../services/nhan-vien.service';

@Component({
  selector: 'app-nhan-vien-create',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './nhan-vien-create.component.html'
})
export class NhanVienCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private nhanVienService = inject(NhanVienService);
  private router = inject(Router);

  employeeForm!: FormGroup;
  categories: LoaiNVVm[] = [];
  
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  isSubmitting = false;

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  initForm(): void {
    this.employeeForm = this.fb.group({
      hoNV: ['', Validators.required],
      tenNV: ['', Validators.required],
      phaiNV: ['True'],
      ngaySinhNV: [''],
      soDTNV: [''],
      soCCCD: [''],
      diaChiNV_TT: [''],
      diaChiNV_NT: [''],
      maLoaiNV: ['', Validators.required],
      trinhDoHV: ['Đại học'],
      soTKNV: [''],
      tenNgHNV: [''],
      soBHYT: [''],
      soBHXH: [''],
      trangThaiNV: ['Đang làm'],
      ghiChuNV: ['']
    });
  }

  loadCategories(): void {
    this.nhanVienService.getLoaiNvs().subscribe({
      next: (res) => { if (res.success) this.categories = res.data; },
      error: (err) => console.error('Lỗi tải danh sách chức vụ', err)
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = e => this.imagePreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    const formValues = this.employeeForm.value;

    Object.keys(formValues).forEach(key => {
      if (formValues[key]) formData.append(key, formValues[key]);
    });

    if (this.selectedFile) {
      formData.append('HinhAnhNV', this.selectedFile);
    }

    this.nhanVienService.create(formData).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Thêm nhân viên thành công!');
          this.router.navigate(['/admin/nhan-vien']);
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error(err);
        alert('Có lỗi xảy ra khi lưu nhân viên.');
        this.isSubmitting = false;
      }
    });
  }
}