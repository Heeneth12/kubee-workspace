import { Routes } from '@angular/router';

export const permissionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./permissions.component').then(c => c.PermissionsComponent)
  }
];
