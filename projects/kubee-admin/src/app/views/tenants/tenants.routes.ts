import { Routes } from '@angular/router';

export const tenantsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tenants.component').then(c => c.TenantsComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./tenant-form/tenant-form.component').then(c => c.TenantFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./tenant-form/tenant-form.component').then(c => c.TenantFormComponent)
  }
];
