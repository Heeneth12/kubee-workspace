import { Routes } from '@angular/router';

export const auditLogsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./audit-logs.component').then(c => c.AuditLogsComponent)
  }
];
