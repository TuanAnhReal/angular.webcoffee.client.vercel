import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AvatarComponent } from '../../avatar/avatar.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    AvatarComponent,
    RouterModule
  ],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Biến chứa tên hiển thị cho component <app-avatar>
  displayName: string = 'Đang tải...';

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    // Gọi API /me để lấy thông tin tài khoản đang đăng nhập
    this.authService.getMe().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Gán tên hiển thị (Ưu tiên username hoặc tên thật tùy cấu trúc API của bạn)
          this.displayName = res.data.username || 'Admin';
        }
      },
      error: (err) => {
        console.error('Lỗi tải thông tin Header:', err);
        this.displayName = 'Khách';
      }
    });
  }

  logout(): void {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
      // 1. Xóa Token dưới LocalStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // (Tùy chọn) Gọi hàm logout trong AuthService nếu bạn có xử lý thêm
      // this.authService.logout();

      // 2. Điều hướng về trang Đăng nhập
      this.router.navigate(['/auth/login']);
    }
  }
}