import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  hidePassword = true;
  isLoading = false;

  loginForm = this.fb.nonNullable.group({
    tenDangNhap: ['', [Validators.required]],
    matKhau: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.authService
      .login(this.loginForm.getRawValue())
      .subscribe({
        next: () => {
          queueMicrotask(() => {
            this.isLoading = false;

            // 1. Kiểm tra xem người dùng có bị chặn bởi Guard trước đó không (để quay lại link cũ)
            const returnUrl = this.route.snapshot.queryParams['returnUrl'];
            
            if (returnUrl) {
              this.router.navigateByUrl(returnUrl);
              return;
            }

            // 2. Nếu đăng nhập chủ động từ trang /login -> Điều hướng thông minh dựa vào Vai trò (Role)
            const vaiTro = this.authService.currentRole();
            console.log('🔑 [Login] Tài khoản đăng nhập thành công. Vai trò nhận diện:', vaiTro);

            let urlDieuHuong = '/admin/profile'; // URL phòng hờ nếu role lạ

            if (vaiTro === 'Quản trị viên') {
              urlDieuHuong = '/admin/dashboard';
            } else if (vaiTro === 'Phục vụ') {
              urlDieuHuong = '/admin/hoa-don';
            } else if (vaiTro === 'Pha chế') {
              urlDieuHuong = '/admin/bep-pha-che';
            }

            // Thực thi đẩy user sang phân hệ phù hợp
            this.router.navigateByUrl(urlDieuHuong);
          });
        },
        error: (err) => {
          queueMicrotask(() => {
            this.isLoading = false;
            this.snackBar.open(err.error?.message || 'Tài khoản hoặc mật khẩu không chính xác!', 'Đóng', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          });
        }
      });
  }
}