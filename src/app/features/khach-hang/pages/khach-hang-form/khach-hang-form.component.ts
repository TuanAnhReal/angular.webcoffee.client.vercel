import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { KhachHangService, KhachHangVm } from '../../services/khach-hang.service';

@Component({
  selector: 'app-khach-hang-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './khach-hang-form.component.html'
})
export class KhachHangFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private khachHangService = inject(KhachHangService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  customerForm!: FormGroup;
  
  isEditMode = false;
  maKH: string = '';
  isLoading = false;
  isSubmitting = false;

  ngOnInit(): void {
    this.initForm();
    
    // Kiểm tra xem trên URL có param 'id' không. Nếu có thì là chế độ Cập nhật
    this.maKH = this.route.snapshot.paramMap.get('id') || '';
    if (this.maKH) {
      this.isEditMode = true;
      this.loadCustomerData();
    }
  }

  initForm(): void {
    // Tên biến phải khớp 100% với JSON API của Backend
    this.customerForm = this.fb.group({
      tenKH: ['', [Validators.required, Validators.maxLength(100)]],
      sdtkh: ['', [Validators.required, Validators.maxLength(15)]],
      diemTichLuy: [0, [Validators.min(0)]],
      ghiChuKH: ['', Validators.maxLength(255)]
    });
  }

  loadCustomerData(): void {
    this.isLoading = true;
    this.khachHangService.getById(this.maKH).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Fill dữ liệu lấy được vào form
          this.customerForm.patchValue({
            tenKH: res.data.tenKH,
            sdtkh: res.data.sdtkh,
            diemTichLuy: res.data.diemTichLuy,
            ghiChuKH: res.data.ghiChuKH
          });
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Không tìm thấy thông tin khách hàng!');
        this.router.navigate(['/admin/khach-hang']);
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValues = this.customerForm.value;

    const request$ = this.isEditMode 
      ? this.khachHangService.update(this.maKH, formValues)
      : this.khachHangService.create(formValues);

    request$.subscribe({
      next: (res) => {
        if (res.success) {
          alert(`${this.isEditMode ? 'Cập nhật' : 'Thêm'} khách hàng thành công!`);
          this.router.navigate(['/admin/khach-hang']);
        }
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error(err);
        alert('Có lỗi xảy ra, vui lòng kiểm tra lại!');
        this.isSubmitting = false;
      }
    });
  }
}