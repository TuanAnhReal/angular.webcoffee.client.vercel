import { Routes } from '@angular/router';

export const KHU_VUC_BAN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../pages/khu-vuc-ban-list.component').then(c => c.KhuVucBanComponent)
  }
];