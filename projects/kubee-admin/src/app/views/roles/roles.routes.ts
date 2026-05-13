import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./roles.component').then(c => c.RolesComponent)
  }
];
