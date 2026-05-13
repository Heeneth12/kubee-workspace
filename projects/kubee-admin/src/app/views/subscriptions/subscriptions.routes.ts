import { Routes } from '@angular/router';

export const subscriptionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./subscriptions.component').then(c => c.SubscriptionsComponent)
  }
];
