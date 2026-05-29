import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Xử lý Hết hạn Access Token
      if (error.status === 401) {
        const hasRefreshToken = !!tokenService.getRefreshToken();
        // Cực kỳ quan trọng: Tránh lặp vô tận nếu chính API refresh-token bị 401
        const isRefreshRequest = req.url.includes('/auth/refresh-token');

        if (hasRefreshToken && !isRefreshRequest) {
          // Giao toàn quyền xử lý cho AuthService
          return authService.handleRefreshToken(req, next);
        }
        
        // Không có refresh token hoặc đang gọi refresh mà lỗi -> Văng luôn
        authService.logout();
      }

      // Không đủ quyền
      if (error.status === 403) {
        snackBar.open('Bạn không có quyền truy cập', 'Đóng', { duration: 4000 });
      }

      // Lỗi validation từ BE
      if (error.status === 400) {
        const msg = error.error?.message || 'Yêu cầu không hợp lệ';
        snackBar.open(msg, 'Đóng', { duration: 4000 });
      }

      // Lỗi hệ thống Backend
      if (error.status >= 500) {
        snackBar.open('Lỗi hệ thống, vui lòng thử lại sau', 'Đóng', { duration: 5000 });
      }

      return throwError(() => error);
    })
  );
};