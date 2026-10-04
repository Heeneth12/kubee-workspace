import { Routes } from '@angular/router';
import { AuthGuard } from './layouts/guards/auth.guard';
import { RedirectGuard } from './layouts/guards/redirect.guard';
import { PosLayoutComponent } from './layouts/components/pos-layout/pos-layout.component';

export const routes: Routes = [
    {
        path: '',
        canActivate: [RedirectGuard],
        children: []
    },

    // PUBLIC ROUTES
    {
        path: 'auth',
        loadChildren: () => import('./views/auth/auth.routes')
            .then(m => m.AuthRoutes)
    },
    {
        path: 'forbidden',
        loadComponent: () => import('./views/forbidden/forbidden.component')
            .then(c => c.ForbiddenComponent)
    },

    // AUTHENTICATED ROUTES (wrapped in POS layout)
    {
        path: '',
        component: PosLayoutComponent,
        canActivate: [AuthGuard],
        data: { moduleKey: 'KUBEE_POS' },
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./views/dashboard/dashboard.component')
                    .then(c => c.DashboardComponent)
            },
            {
                path: 'pos',
                loadComponent: () => import('./views/pos/pos.component')
                    .then(c => c.PosComponent)
            },
            {
                path: 'orders',
                loadComponent: () => import('./views/orders/orders.component')
                    .then(c => c.OrdersComponent)
            }
        ]
    },

    { path: '**', redirectTo: '' }
];
