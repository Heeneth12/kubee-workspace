import { Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
import { PosModules } from '../../layouts/guards/pos-permissions';

export const SettingsRoutes: Routes = [
    {
        path: '',
        component: SettingsComponent,
        children: [
            // Profile is open to everyone, so land there; the shell hides tabs the user can't open
            { path: '', redirectTo: 'profile', pathMatch: 'full' },
            {
                path: 'business',
                loadComponent: () => import('./business-settings.component')
                    .then(c => c.BusinessSettingsComponent),
                data: { moduleKey: PosModules.SETTINGS }
            },
            {
                path: 'profile',
                loadComponent: () => import('./profile-settings.component')
                    .then(c => c.ProfileSettingsComponent)
            },
            {
                path: 'subscription',
                loadComponent: () => import('./subscription-settings.component')
                    .then(c => c.SubscriptionSettingsComponent),
                data: { moduleKey: PosModules.SETTINGS }
            },
            {
                path: 'integrations',
                loadComponent: () => import('./integrations-settings.component')
                    .then(c => c.IntegrationsSettingsComponent),
                data: { moduleKey: PosModules.SETTINGS }
            }
        ]
    }
];
