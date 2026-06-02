import { Routes } from '@angular/router';

export const KHUYEN_MAI_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/khuyenmai-list/khuyenmai-list.component')
        .then(c => c.KhuyenmaiListComponent)
  },
    {
    path: 'create',
    loadComponent: () =>
      import('../pages/khuyenmai-create/khuyenmai-create.component')
        .then(c => c.KhuyenmaiCreateComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () =>
      import('../pages/khuyenmai-edit/khuyenmai-edit.component')
        .then(c => c.KhuyenmaiEditComponent)
  },
  {
    path: 'detail/:id',
    loadComponent: () =>
      import('../pages/khuyenmai-detail/khuyenmai-detail.component')
        .then(c => c.KhuyenmaiDetailComponent)
  }
];