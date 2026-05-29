import { Routes } from '@angular/router';

export const SAN_PHAM_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/san-pham-list/san-pham-list.component').then(m => m.SanPhamListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('../pages/san-pham-create/san-pham-create.component').then(m => m.SanPhamCreateComponent)
  },
  {
    path: 'update/:id', 
    loadComponent: () => import('../pages/san-pham-update/san-pham-update.component').then(c => c.SanPhamUpdateComponent)
  },
  {
    path: 'loai-sp',
    loadComponent: () => import('../pages/loai-sp/loai-sp.component').then(m => m.LoaiSpComponent)
  }
];