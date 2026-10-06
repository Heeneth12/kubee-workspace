import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Package, FolderTree, ListPlus } from 'lucide-angular';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="px-6 pt-6 border-b border-ez-border shrink-0">
        <h1 class="text-ez-2xl font-medium text-ez-heading mb-1">Catalog</h1>
        <p class="text-ez-md text-ez-secondary mb-4">Items, categories and add-ons sold on this terminal.</p>
        <nav class="flex gap-6 -mb-px">
          @for (tab of tabs; track tab.link) {
          <a [routerLink]="tab.link" routerLinkActive="!border-ez-primary !text-ez-heading"
            class="flex items-center gap-2 pb-3 border-b-2 border-transparent text-ez-sm font-medium text-ez-secondary hover:text-ez-heading transition-colors duration-ez">
            <lucide-icon [img]="tab.icon" class="w-4 h-4"></lucide-icon>
            {{ tab.label }}
          </a>
          }
        </nav>
      </div>
      <div class="flex-1 min-h-0">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class CatalogComponent {
  readonly tabs = [
    { label: 'Items', link: 'items', icon: Package },
    { label: 'Categories', link: 'categories', icon: FolderTree },
    { label: 'Add-on groups', link: 'addon-groups', icon: ListPlus },
  ];
}
