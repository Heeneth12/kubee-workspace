import { Routes } from '@angular/router';
import { CatalogComponent } from './catalog.component';

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
                    .then(c => c.ItemFormComponent)
            },
            {
                path: 'items/:uuid',
                loadComponent: () => import('./items/item-form.component')
                    .then(c => c.ItemFormComponent)
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
