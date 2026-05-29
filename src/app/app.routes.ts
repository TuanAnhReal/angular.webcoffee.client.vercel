import { Routes } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register.component').then(c => c.RegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(c => c.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        canActivate: [roleGuard(['Quản trị viên'])],
        loadChildren: () => import('./features/dashboard/routes/dashboard.routes').then(r => r.DASHBOARD_ROUTES)
      },

      {
        path: 'thong-ke',
        canActivate: [roleGuard(['Quản trị viên'])],
        loadComponent: () => 
          import('./features/thong-ke/pages/doanh-thu/doanh-thu.component')
            .then(c => c.DoanhThuComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/auth/pages/account-profile/account-profile.component').then(m => m.AccountProfileComponent)
      },
      {
        path: 'change-password',
        loadComponent: () => import('./features/auth/pages/change-password/change-password.component').then(c => c.ChangePasswordComponent)
      },
      {
        path: 'san-pham',
        canActivate: [roleGuard(['Quản trị viên'])],
        loadChildren: () => import('./features/san-pham/routes/san-pham.routes').then(r => r.SAN_PHAM_ROUTES)
      },
      {
        path: 'khach-hang',
        canActivate: [roleGuard(['Phục vụ', 'Quản trị viên'])],
        loadChildren: () => import('./features/khach-hang/routes/khach-hang.routes').then(r => r.KHACH_HANG_ROUTES)
      },
      {
        path: 'nhan-vien',
        canActivate: [roleGuard(['Quản trị viên'])],
        loadChildren: () => import('./features/nhan-vien/routes/nhan-vien.routes').then(r => r.NHAN_VIEN_ROUTES)
      },
      {
        path: 'hoa-don',
        canActivate: [roleGuard(['Phục vụ', 'Quản trị viên'])],
        loadChildren: () => import('./features/hoa-don/routes/hoa-don.routes').then(r => r.HOA_DON_ROUTES)
      },
      {
        path: 'khu-vuc-ban',
        canActivate: [roleGuard(['Phục vụ', 'Quản trị viên'])],
        loadChildren: () => import('./features/khuvuc-ban/routes/khu-vuc-ban.routes').then(r => r.KHU_VUC_BAN_ROUTES)
      },
      {
        path: 'bep-pha-che',
        canActivate: [roleGuard(['Pha chế', 'Quản trị viên'])],
        loadComponent: () => import('./features/bep-pha-che/bep-dashboard/bep-dashboard.component').then(c => c.BepDashboardComponent)
      },
      {
        path: 'bep-pha-che/:id',
        canActivate: [roleGuard(['Pha chế', 'Quản trị viên'])],
        loadComponent: () => import('./features/bep-pha-che/bep-detail/bep-detail.component').then(c => c.BepDetailComponent)
      },
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];