import { Routes } from '@angular/router';
import { CatalogComponent } from './catalog.component';
import { PosPrivileges } from '../../layouts/guards/pos-permissions';

export const CatalogRoutes: Routes = [
    {
        path: '',
        component: CatalogComponent,
        children: [
            { path: '', redirectTo: 'items', pathMatch: 'full' },
            {
                path: 'items',
                loadComponent: () => import('./items/item-list.component')
                    .then(c => c.ItemListComponent)
            },
            {
                path: 'items/new',
                loadComponent: () => import('./items/item-form.component')
                    .then(c => c.ItemFormComponent),
                data: { privilegeKey: PosPrivileges.CATALOG_CREATE }
            },
            {
                path: 'items/:uuid',
                loadComponent: () => import('./items/item-form.component')
                    .then(c => c.ItemFormComponent),
                data: { privilegeKey: PosPrivileges.CATALOG_EDIT }
            },
            {
                path: 'categories',
                loadComponent: () => import('./categories/categories.component')
                    .then(c => c.CategoriesComponent)
            },
            {
                path: 'addon-groups',
                loadComponent: () => import('./addon-groups/addon-groups.component')
                    .then(c => c.AddonGroupsComponent)
            }
        ]
    }
];
