import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, Building2, UserRound, CreditCard, Plug } from 'lucide-angular';
import { AuthService } from '../../layouts/guards/auth.service';
import { AuthGuard } from '../../layouts/guards/auth.guard';
import { PosModules } from '../../layouts/guards/pos-permissions';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="px-6 pt-6 border-b border-ez-border shrink-0">
        <h1 class="text-ez-2xl font-medium text-ez-heading mb-1">Settings</h1>
        <p class="text-ez-md text-ez-secondary mb-4">Your business, your account, your plan and connected services.</p>
        <nav class="flex gap-6 -mb-px overflow-x-auto">
          @for (tab of tabs; track tab.link) {
          <a [routerLink]="tab.link" routerLinkActive="!border-ez-primary !text-ez-heading"
            class="flex items-center gap-2 pb-3 border-b-2 border-transparent text-ez-sm font-medium text-ez-secondary hover:text-ez-heading transition-colors duration-ez whitespace-nowrap">
            <lucide-icon [img]="tab.icon" class="w-4 h-4"></lucide-icon>
            {{ tab.label }}
          </a>
          }
        </nav>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class SettingsComponent {
  private authService = inject(AuthService);
  private authGuard = inject(AuthGuard);

  private readonly allTabs = [
    { label: 'Business', link: 'business', icon: Building2, business: true },
    { label: 'Profile', link: 'profile', icon: UserRound, business: false },
    { label: 'Subscription', link: 'subscription', icon: CreditCard, business: true },
    { label: 'Integrations', link: 'integrations', icon: Plug, business: true },
  ];

  // Business-wide tabs need the Settings module; Profile is everyone's own account
  readonly tabs = this.allTabs.filter(tab => {
    if (!tab.business) return true;
    const user = this.authService.getCurrentUserValue();
    return !!user && this.authGuard.hasModuleAccess(user, PosModules.SETTINGS);
  });
}
