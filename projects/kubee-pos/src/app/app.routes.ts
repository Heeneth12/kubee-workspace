import { Routes } from '@angular/router';
import { AuthGuard } from './layouts/guards/auth.guard';
import { RedirectGuard } from './layouts/guards/redirect.guard';
import { PosLayoutComponent } from './layouts/components/pos-layout/pos-layout.component';
import { PosModules, PosPrivileges } from './layouts/guards/pos-permissions';

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
        canActivateChild: [AuthGuard],
        children: [
            {
                path: 'dashboard',
                loadComponent: () => import('./views/dashboard/dashboard.component')
                    .then(c => c.DashboardComponent),
                data: { moduleKey: PosModules.DASHBOARD }
            },
            {
                path: 'pos',
                loadComponent: () => import('./views/pos/pos.component')
                    .then(c => c.PosComponent),
                data: { moduleKey: PosModules.ORDERS, privilegeKey: PosPrivileges.ORDERS_CREATE }
            },
            {
                path: 'orders',
                loadComponent: () => import('./views/orders/orders.component')
                    .then(c => c.OrdersComponent),
                data: { moduleKey: PosModules.ORDERS }
            },
            {
                path: 'orders/:uuid',
                loadComponent: () => import('./views/orders/order-detail.component')
                    .then(c => c.OrderDetailComponent),
                data: { moduleKey: PosModules.ORDERS }
            },
            {
                path: 'bills',
                loadComponent: () => import('./views/billing/bill-list.component')
                    .then(c => c.BillListComponent),
                data: { moduleKey: PosModules.BILLS }
            },
            {
                path: 'bills/:uuid',
                loadComponent: () => import('./views/billing/bill-detail.component')
                    .then(c => c.BillDetailComponent),
                data: { moduleKey: PosModules.BILLS }
            },
            {
                path: 'shifts/:uuid',
                loadComponent: () => import('./views/shifts/shift-detail.component')
                    .then(c => c.ShiftDetailComponent),
                data: { moduleKey: PosModules.BILLS }
            },
            {
                path: 'reports',
                loadChildren: () => import('./views/reports/reports.routes')
                    .then(m => m.ReportsRoutes),
                data: { moduleKey: PosModules.REPORTS }
            },
            {
                path: 'catalog',
                loadChildren: () => import('./views/catalog/catalog.routes')
                    .then(m => m.CatalogRoutes),
                data: { moduleKey: PosModules.CATALOG }
            },
            {
                path: 'users',
                loadComponent: () => import('./views/users/user-list.component')
                    .then(c => c.UserListComponent),
                data: { moduleKey: PosModules.USER_MGMT }
            },
            {
                path: 'users/new',
                loadComponent: () => import('./views/users/user-form.component')
                    .then(c => c.UserFormComponent),
                data: { moduleKey: PosModules.USER_MGMT, privilegeKey: PosPrivileges.USER_MGMT_EDIT }
            },
            {
                path: 'users/:id',
                loadComponent: () => import('./views/users/user-form.component')
                    .then(c => c.UserFormComponent),
                data: { moduleKey: PosModules.USER_MGMT, privilegeKey: PosPrivileges.USER_MGMT_EDIT }
            },
            {
                // Open to everyone for their own profile; business tabs are guarded inside
                path: 'settings',
                loadChildren: () => import('./views/settings/settings.routes')
                    .then(m => m.SettingsRoutes)
            }
        ]
    },

    { path: '**', redirectTo: '' }
];
