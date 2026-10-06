import { Routes } from '@angular/router';
import { AuthComponent } from './auth.component';

export const AuthRoutes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: AuthComponent }
];
