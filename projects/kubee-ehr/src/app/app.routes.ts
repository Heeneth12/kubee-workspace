import { Routes } from '@angular/router';
import { AuthGuard } from './layout/guards/auth.guard';
import { RedirectGuard } from './layout/guards/redirect.guard';
import { EhrLayout } from './layout/components/ehr-layout/ehr-layout';

export const routes: Routes = [
  {
    path: '',
    canActivate: [RedirectGuard],
    children: []
  },
  {
    path: 'auth',
    loadChildren: () => import('./views/auth/auth.routes').then(m => m.adminAuthRoutes)
  },
  {
    path: 'forbidden',
    loadComponent: () => import('./views/forbidden/forbidden.component').then(c => c.ForbiddenComponent)
  },
  {
    path: '',
    component: EhrLayout,
    canActivate: [AuthGuard],
    data: { moduleKey: 'KUBEE_EHR' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./views/appointments/appointments').then(c => c.Appointments)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./views/prescriptions/prescriptions').then(c => c.Prescriptions)
      },
      {
        path: 'payments',
        loadComponent: () => import('./views/payments/payments').then(c => c.Payments)
      },
      {
        path: 'settings',
        loadComponent: () => import('./views/settings/settings').then(c => c.Settings)
      }
    ]
  },
  {
    path: 'ui-demo',
    loadComponent: () => import('kubee-ui').then(c => c.KubeeUi)
  },
  { path: '**', redirectTo: '' }
];
