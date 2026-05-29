import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.component.html'
})
export class ChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  passwordForm!: FormGroup;
  isSaving = false;
  showToast = false;

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Hàm tự chế để kiểm tra mật khẩu gõ lại có khớp không
  passwordMatchValidator(g: FormGroup) {
    const newPw = g.get('newPassword')?.value;
    const confirmPw = g.get('confirmPassword')?.value;
    return newPw === confirmPw ? null : { mismatch: true };
  }

  onSubmit(): void {
  if (this.passwordForm.invalid) {
    this.passwordForm.markAllAsTouched();
    return;
  }

  this.isSaving = true;

  const body = {
    OldPassword: this.passwordForm.get('oldPassword')?.value,
    NewPassword: this.passwordForm.get('newPassword')?.value,
    ConfirmNewPassword: this.passwordForm.get('confirmPassword')?.value // Backend yêu cầu cả trường xác nhận này
  };

  this.http.post<any>(`${environment.apiUrl}/Auth/change-password`, body).subscribe({
    next: (res) => {
      this.isSaving = false;
      this.showToast = true;
      this.passwordForm.reset();
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.showToast = false;
        this.router.navigate(['/admin/dashboard']);
      }, 2000);
    },
    error: (err) => {
      const errorMsg = err.error?.message || 'Mật khẩu cũ không chính xác hoặc dữ liệu không hợp lệ!';
      alert(errorMsg);
      this.isSaving = false;
      this.cdr.detectChanges();
    }
  });
}
}