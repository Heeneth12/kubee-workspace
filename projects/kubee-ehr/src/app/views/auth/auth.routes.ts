import { Routes } from '@angular/router';

export const adminAuthRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth').then(c => c.Auth)
  }
];
