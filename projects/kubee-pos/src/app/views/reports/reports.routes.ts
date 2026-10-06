import { Routes } from '@angular/router';
import { ReportsComponent } from './reports.component';

export const ReportsRoutes: Routes = [
    {
        path: '',
        component: ReportsComponent,
        children: [
            { path: '', redirectTo: 'sales', pathMatch: 'full' },
            {
                path: 'sales',
                loadComponent: () => import('./sales-report.component')
                    .then(c => c.SalesReportComponent)
            },
            {
                path: 'payments',
                loadComponent: () => import('./payment-modes-report.component')
                    .then(c => c.PaymentModesReportComponent)
            },
            {
                path: 'items',
                loadComponent: () => import('./items-report.component')
                    .then(c => c.ItemsReportComponent)
            },
            {
                path: 'categories',
                loadComponent: () => import('./categories-report.component')
                    .then(c => c.CategoriesReportComponent)
            },
            {
                path: 'hourly',
                loadComponent: () => import('./hourly-report.component')
                    .then(c => c.HourlyReportComponent)
            },
            {
                path: 'staff',
                loadComponent: () => import('./staff-report.component')
                    .then(c => c.StaffReportComponent)
            },
            {
                path: 'gst',
                loadComponent: () => import('./gst-report.component')
                    .then(c => c.GstReportComponent)
            },
            {
                path: 'shifts',
                loadComponent: () => import('./shifts-report.component')
                    .then(c => c.ShiftsReportComponent)
            },
            {
                path: 'cancellations',
                loadComponent: () => import('./cancellations-report.component')
                    .then(c => c.CancellationsReportComponent)
            }
        ]
    }
];
