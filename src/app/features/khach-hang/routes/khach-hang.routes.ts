import { Routes } from '@angular/router';

export const KHACH_HANG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/khach-hang-list/khach-hang-list.component').then(c => c.KhachHangListComponent)
  },
  {
    path: 'create', // Link tạo mới
    loadComponent: () => import('../pages/khach-hang-form/khach-hang-form.component').then(c => c.KhachHangFormComponent)
  },
  {
    path: 'update/:id', // Link cập nhật có nhận ID
    loadComponent: () => import('../pages/khach-hang-form/khach-hang-form.component').then(c => c.KhachHangFormComponent)
  }
];