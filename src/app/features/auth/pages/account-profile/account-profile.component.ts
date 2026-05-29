import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NhanVienService } from '../../../nhan-vien/services/nhan-vien.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './account-profile.component.html'
})
export class AccountProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private nhanVienService = inject(NhanVienService);
  private cdr = inject(ChangeDetectorRef);

  profileForm!: FormGroup;
  currentUser: any = null; 
  employeeDetail: any = null; 
  
  isLoading = true;
  isSaving = false;
  avatarPreview: string | ArrayBuffer | null = 'https://via.placeholder.com/150';
  showToast = false;

  ngOnInit(): void {
    this.initForm();
    this.loadProfileData();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      hoNV: ['', Validators.required],
      tenNV: ['', Validators.required],
      soDTNV: ['', Validators.required],
      diaChiNV_TT: [''], 
      soCCCD: [{ value: '', disabled: true }], 
      roleDisplay: [{ value: '', disabled: true }] 
    });
  }

  loadProfileData(): void {
    this.isLoading = true;

    this.authService.getMe().pipe(
      switchMap(authRes => {
        if (authRes.success && authRes.data) {
          this.currentUser = authRes.data;
          this.profileForm.patchValue({ roleDisplay: this.currentUser.role });
          
          // Chuyển tiếp luồng gọi sang API lấy chi tiết nhân viên
          return this.nhanVienService.getById(this.currentUser.maNV);
        } else {
          throw new Error('Không lấy được thông tin từ API Auth/me');
        }
      })
    ).subscribe({
      next: (empRes) => {
        if (empRes.success && empRes.data) {
          this.employeeDetail = empRes.data;
          this.avatarPreview = this.employeeDetail.hinhAnhNV || 'https://via.placeholder.com/150';
          
          this.profileForm.patchValue({
            hoNV: this.employeeDetail.hoNV,
            tenNV: this.employeeDetail.tenNV,
            soDTNV: this.employeeDetail.soDTNV,
            diaChiNV_TT: this.employeeDetail.diaChiNV_TT,
            soCCCD: this.employeeDetail.soCCCD
          });
        } else {
          alert(`Cảnh báo: Mã nhân viên ${this.currentUser?.maNV} không tồn tại trên hệ thống danh mục!`);
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Ép giao diện vẽ lại
      },
      error: (err) => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onAvatarChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const updatePayload = {
      ...this.employeeDetail,
      hoNV: this.profileForm.get('hoNV')?.value,
      tenNV: this.profileForm.get('tenNV')?.value,
      soDTNV: this.profileForm.get('soDTNV')?.value,
      diaChiNV_TT: this.profileForm.get('diaChiNV_TT')?.value
    };

    this.nhanVienService.update(this.currentUser.maNV, updatePayload).subscribe({
      next: (res) => {
        this.isSaving = false;
        this.showToast = true;
        setTimeout(() => this.showToast = false, 3000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Cập nhật thông tin thất bại!');
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }
}