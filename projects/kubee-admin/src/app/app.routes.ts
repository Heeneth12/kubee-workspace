import { Routes } from '@angular/router';
import { AuthGuard } from './layout/guards/auth.guard';
import { RedirectGuard } from './layout/guards/redirect.guard';
import { AdminLayout } from './layout/components/admin-layout/admin-layout';

export const routes: Routes = [

  // Root redirect
  {
    path: '',
    canActivate: [RedirectGuard],
    children: []
  },

  // Auth (public)
  {
    path: 'auth',
    loadChildren: () => import('./views/auth/auth.routes').then(m => m.adminAuthRoutes)
  },

  // Forbidden (public)
  {
    path: 'forbidden',
    loadComponent: () => import('./views/forbidden/forbidden.component').then(c => c.ForbiddenComponent)
  },

  // Protected routes — wrapped in AdminLayout
  {
    path: '',
    component: AdminLayout,
    canActivate: [AuthGuard],
    data: { moduleKey: 'KUBEE_OPS' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'tenants',
        loadChildren: () => import('./views/tenants/tenants.routes').then(m => m.tenantsRoutes)
      },
      {
        path: 'subscriptions',
        loadChildren: () => import('./views/subscriptions/subscriptions.routes').then(m => m.subscriptionsRoutes)
      },
      {
        path: 'users',
        loadChildren: () => import('./views/users/users.routes').then(m => m.usersRoutes)
      },
      {
        path: 'applications',
        loadChildren: () => import('./views/applications/applications.routes').then(m => m.applicationsRoutes)
      },
      {
        path: 'roles',
        loadChildren: () => import('./views/roles/roles.routes').then(m => m.rolesRoutes)
      },
      {
        path: 'permissions',
        loadChildren: () => import('./views/permissions/permissions.routes').then(m => m.permissionsRoutes)
      },
      {
        path: 'resources',
        loadChildren: () => import('./views/resources/resources.routes').then(m => m.resourcesRoutes)
      },
      {
        path: 'audit-logs',
        loadChildren: () => import('./views/audit-logs/audit-logs.routes').then(m => m.auditLogsRoutes)
      },
    ]
  },

  // Catch-all
  { path: '**', redirectTo: '' }
];
