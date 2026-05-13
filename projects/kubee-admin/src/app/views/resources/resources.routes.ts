import { Routes } from '@angular/router';

export const resourcesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./resources.component').then(c => c.ResourcesComponent)
  }
];
