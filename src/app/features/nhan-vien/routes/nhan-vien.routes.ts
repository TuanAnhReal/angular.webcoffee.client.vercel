import { Routes } from '@angular/router';

export const NHAN_VIEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/nhan-vien-list/nhan-vien-list.component').then(m => m.NhanVienListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('../pages/nhan-vien-create/nhan-vien-create.component').then(m => m.NhanVienCreateComponent)
  },
  {
    path: 'update/:id', 
    loadComponent: () => import('../pages/nhan-vien-update/nhan-vien-update.component').then(c => c.NhanVienUpdateComponent)
  },
  {
    path: 'ca-lam-viec',
    loadComponent: () => import('../pages/nhan-vien-calam/pages/ca-lam.component').then(c => c.CaLamComponent)
  }
];