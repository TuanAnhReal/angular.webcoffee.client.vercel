import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NhanVienService, LoaiNVVm, NhanVienVm } from '../../services/nhan-vien.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-nhan-vien-update',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './nhan-vien-update.component.html'
})
export class NhanVienUpdateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private nhanVienService = inject(NhanVienService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  employeeForm!: FormGroup;
  categories: LoaiNVVm[] = [];
  
  maNV: string = '';
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  currentImageUrl: string | null = null;
  
  isSubmitting = false;
  isLoadingData = true;

  ngOnInit(): void {
    this.maNV = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    this.loadAllData();
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

  loadAllData(): void {
    if (!this.maNV) return;

    forkJoin({
      categories: this.nhanVienService.getLoaiNvs(),
      employee: this.nhanVienService.getById(this.maNV)
    }).subscribe({
      next: ({ categories, employee }) => {
        if (categories.success) {
          this.categories = categories.data;
        }

        if (employee.success && employee.data) {
          this.patchFormValues(employee.data);
        }

        this.isLoadingData = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Không tìm thấy nhân viên!');
        this.router.navigate(['/admin/nhan-vien']);
        this.isLoadingData = false;
        this.cdr.detectChanges();
      }
    });
  }

  private patchFormValues(nv: NhanVienVm): void {
    let formattedDate = '';
    if (nv.ngaySinhNV) {
      formattedDate = nv.ngaySinhNV.split('T')[0];
    }

    this.employeeForm.patchValue({
      hoNV: nv.hoNV,
      tenNV: nv.tenNV,
      phaiNV: nv.phaiNV || 'True',
      ngaySinhNV: formattedDate,
      soDTNV: nv.soDTNV || '',
      soCCCD: nv.soCCCD || '',
      diaChiNV_TT: nv.diaChiNV_TT || '',
      diaChiNV_NT: nv.diaChiNV_NT || '',
      maLoaiNV: nv.maLoaiNV || '',
      trinhDoHV: nv.trinhDoHV || 'Đại học',
      soTKNV: nv.soTKNV || '',
      tenNgHNV: nv.tenNgHNV || '',
      soBHYT: nv.soBHYT || '',
      soBHXH: nv.soBHXH || '',
      trangThaiNV: nv.trangThaiNV || 'Đang làm',
      ghiChuNV: nv.ghiChuNV || ''
    });

    if (nv.hinhAnhNV) {
      this.currentImageUrl = nv.hinhAnhNV;
      this.imagePreview = this.currentImageUrl;
    }
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
      const value = formValues[key];
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value);
      }
    });

    if (this.selectedFile) {
      formData.append('HinhAnhNV', this.selectedFile);
    }

    this.nhanVienService.update(this.maNV, formData).subscribe({
      next: (res) => {
        if (res.success) {
          alert('Cập nhật nhân viên thành công!');
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