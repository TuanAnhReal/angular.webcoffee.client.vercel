import { Routes } from '@angular/router';

export const HOA_DON_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/hoa-don-list/hoa-don-list.component').then(m => m.HoaDonListComponent)
  },
  {
    path: 'detail/:id',
    loadComponent: () => import('../pages/hoa-don-detail/hoa-don-detail.component').then(m => m.HoaDonDetailComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('../pages/hoa-don-create/hoa-don-create.component').then(m => m.HoaDonCreateComponent)
  }
];