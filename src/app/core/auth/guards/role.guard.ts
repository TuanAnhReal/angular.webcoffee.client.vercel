import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// 👉 SỬA LẠI CẤU TRÚC HÀM TRẢ VỀ CANACTIVATEFN
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.hasRoles(allowedRoles)) {
      return true;
    }

    alert('Tài khoản của bạn không có quyền truy cập khu vực này!');
    
    const role = authService.currentRole();
    if (role === 'Pha chế') {
      router.navigate(['/admin/bep-pha-che']);
    } else if (role === 'Phục vụ') {
      router.navigate(['/admin/hoa-don']);
    } else {
      router.navigate(['/login']);
    }
    
    return false;
  };
};