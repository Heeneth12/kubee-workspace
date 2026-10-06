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
        data: { moduleKey: 'KUB_OPS_CATALOG' },
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
            },
            {
                path: 'orders/:uuid',
                loadComponent: () => import('./views/orders/order-detail.component')
                    .then(c => c.OrderDetailComponent)
            },
            {
                path: 'bills',
                loadComponent: () => import('./views/billing/bill-list.component')
                    .then(c => c.BillListComponent)
            },
            {
                path: 'bills/:uuid',
                loadComponent: () => import('./views/billing/bill-detail.component')
                    .then(c => c.BillDetailComponent)
            },
            {
                path: 'shifts/:uuid',
                loadComponent: () => import('./views/shifts/shift-detail.component')
                    .then(c => c.ShiftDetailComponent)
            },
            {
                path: 'reports',
                loadChildren: () => import('./views/reports/reports.routes')
                    .then(m => m.ReportsRoutes)
            },
            {
                path: 'catalog',
                loadChildren: () => import('./views/catalog/catalog.routes')
                    .then(m => m.CatalogRoutes)
            }
        ]
    },

    { path: '**', redirectTo: '' }
];
