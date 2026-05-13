import { Routes } from '@angular/router';

export const applicationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./applications.component').then(c => c.ApplicationsComponent)
  }
];
