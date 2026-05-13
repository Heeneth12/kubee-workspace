# kubee-admin Base Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the kubee-admin Angular app into a working SaaS ops panel with routes, layout, auth, and 9 feature list-view modules.

**Architecture:** Every guarded route checks `userType === 'KUBEE_OPS'` via a simplified `AuthGuard`. The `AdminLayout` shell wraps all protected views. Each feature module owns its own component, service, and routes file, mirroring kubee-app's structure.

**Tech Stack:** Angular 19 (standalone components), Tailwind CSS via `ez-*` utility classes, Lucide icons, kubee-ui component library, HttpClient + AuthInterceptor for API calls.

---

### Task 1: Bootstrap — app.html + app.config.ts

**Files:**
- Modify: `projects/kubee-admin/src/app/app.html`
- Modify: `projects/kubee-admin/src/app/app.config.ts`

- [ ] **Step 1: Replace app.html with just the router outlet**

Replace the entire content of `projects/kubee-admin/src/app/app.html` with:

```html
<router-outlet />
```

- [ ] **Step 2: Add HttpClient + AuthInterceptor to app.config.ts**

Replace `projects/kubee-admin/src/app/app.config.ts` with:

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './layout/interceptors/auth.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
};
```

- [ ] **Step 3: Commit**

```bash
git add projects/kubee-admin/src/app/app.html projects/kubee-admin/src/app/app.config.ts
git commit -m "feat(admin): bootstrap HttpClient and AuthInterceptor"
```

---

### Task 2: Support files — BannerLoaderService + auth.model.ts

**Files:**
- Create: `projects/kubee-admin/src/app/layout/components/banner-loader/banner-loader.service.ts`
- Create: `projects/kubee-admin/src/app/views/auth/auth.model.ts`

- [ ] **Step 1: Create BannerLoaderService**

Create `projects/kubee-admin/src/app/layout/components/banner-loader/banner-loader.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BannerLoaderService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  show(): void { this.isLoadingSubject.next(true); }
  hide(): void { this.isLoadingSubject.next(false); }
}
```

- [ ] **Step 2: Create auth.model.ts**

Create `projects/kubee-admin/src/app/views/auth/auth.model.ts`:

```typescript
export class SignInModel {
  email!: string;
  password!: string;
}

export class ForgotPasswordModel {
  email!: string;
}

export class ResendOtpModel {
  tenantId!: number;
}

export class ResetPasswordModel {
  email!: string;
  otp!: string;
  newPassword!: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add projects/kubee-admin/src/app/layout/components/banner-loader/banner-loader.service.ts projects/kubee-admin/src/app/views/auth/auth.model.ts
git commit -m "feat(admin): add BannerLoaderService and auth models"
```

---

### Task 3: Fix auth.service.ts — remove ngx-permissions

**Files:**
- Modify: `projects/kubee-admin/src/app/layout/guards/auth.service.ts`

- [ ] **Step 1: Remove NgxPermissionsService from auth.service.ts**

Replace the entire file `projects/kubee-admin/src/app/layout/guards/auth.service.ts` with:

```typescript
import { Injectable } from '@angular/core';
import { CommonService } from '../service/common/common.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UserInitResponse } from '../models/Init-response.model';
import { DrawerService } from 'kubee-ui';
import { ForgotPasswordModel, ResendOtpModel, ResetPasswordModel } from '../../views/auth/auth.model';
import { BannerLoaderService } from '../components/banner-loader/banner-loader.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private currentUserSubject = new BehaviorSubject<UserInitResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private commonService: CommonService,
    private router: Router,
    private bannerLoaderSvc: BannerLoaderService,
    private drawerSvc: DrawerService,
  ) {}

  login(payload: any, success: (res: any) => void, error: (err: any) => void) {
    this.bannerLoaderSvc.show();
    this.commonService.signIn(payload,
      (res: any) => {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);
        this.fetchUserInit().subscribe({
          next: () => {
            this.router.navigate(['/']).then(() => {
              this.bannerLoaderSvc.hide();
              success(res);
            });
          },
          error: (err) => {
            this.bannerLoaderSvc.hide();
            this.logout();
            error(err);
          }
        });
      },
      (err: any) => {
        this.bannerLoaderSvc.hide();
        error(err);
      }
    );
  }

  fetchUserInit(): Observable<UserInitResponse> {
    return new Observable((observer) => {
      this.commonService.initUser(
        (res: any) => {
          const userData: UserInitResponse = res.data;
          sessionStorage.setItem('tenantId', userData.tenantId.toString());
          sessionStorage.setItem('userId', userData.id.toString());
          sessionStorage.setItem('currentUserUuid', userData.userUuid);
          this.currentUserSubject.next(userData);
          observer.next(userData);
          observer.complete();
        },
        (err: any) => { observer.error(err); }
      );
    });
  }

  forgotPassword(payload: ForgotPasswordModel, success: (res: any) => void, error: (err: any) => void) {
    this.commonService.forgotPassword(payload, success, error);
  }

  resendOtp(payload: ResendOtpModel, success: (res: any) => void, error: (err: any) => void) {
    this.commonService.resendOtp(payload, success, error);
  }

  resetPassword(payload: ResetPasswordModel, success: (res: any) => void, error: (err: any) => void) {
    this.commonService.resetPassword(payload, success, error);
  }

  logout() {
    localStorage.clear();
    this.drawerSvc.close();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken() { return localStorage.getItem('access_token'); }
  getRefreshToken() { return localStorage.getItem('refresh_token'); }

  validateToken(): Observable<boolean> {
    this.bannerLoaderSvc.show();
    return new Observable<boolean>((observer) => {
      this.commonService.validateToken(
        () => { observer.next(true); observer.complete(); this.bannerLoaderSvc.hide(); },
        () => { this.logout(); observer.next(false); observer.complete(); this.bannerLoaderSvc.hide(); }
      );
    });
  }

  isLoggedIn(): Observable<boolean> {
    const token = this.getAccessToken();
    if (!token) return of(false);
    if (this.currentUserSubject.value) return of(true);
    return this.validateToken();
  }

  getCurrentUserValue(): UserInitResponse | null {
    return this.currentUserSubject.value;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add projects/kubee-admin/src/app/layout/guards/auth.service.ts
git commit -m "feat(admin): remove ngx-permissions from auth service"
```

---

### Task 4: Fix guards — AuthGuard (KUBEE_OPS check) + RedirectGuard

**Files:**
- Modify: `projects/kubee-admin/src/app/layout/guards/auth.guard.ts`
- Modify: `projects/kubee-admin/src/app/layout/guards/redirect.guard.ts`

- [ ] **Step 1: Replace auth.guard.ts with KUBEE_OPS check**

Replace `projects/kubee-admin/src/app/layout/guards/auth.guard.ts` with:

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserInitResponse } from '../models/Init-response.model';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.authService.isLoggedIn().pipe(
      switchMap((isValid) => {
        if (!isValid) {
          return of(this.router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: route.url.join('/') } }));
        }
        const currentUser = this.authService.getCurrentUserValue();
        if (currentUser) {
          return of(this.checkOpsAccess(currentUser));
        }
        return this.authService.fetchUserInit().pipe(
          map((user) => this.checkOpsAccess(user)),
          catchError(() => {
            this.authService.logout();
            return of(this.router.createUrlTree(['/auth/login']));
          })
        );
      })
    );
  }

  private checkOpsAccess(user: UserInitResponse): boolean | UrlTree {
    if (user.userType !== 'KUBEE_OPS') {
      return this.router.createUrlTree(['/forbidden']);
    }
    return true;
  }
}
```

- [ ] **Step 2: Update redirect.guard.ts to redirect KUBEE_OPS to dashboard**

Replace `projects/kubee-admin/src/app/layout/guards/redirect.guard.ts` with:

```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RedirectGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.authService.isLoggedIn().pipe(
      switchMap((isValid) => {
        if (!isValid) {
          return of(this.router.createUrlTree(['/auth/login']));
        }
        const currentUser = this.authService.getCurrentUserValue();
        if (currentUser) {
          return of(this.router.createUrlTree(['/dashboard']));
        }
        return this.authService.fetchUserInit().pipe(
          map(() => this.router.createUrlTree(['/dashboard'])),
          catchError(() => {
            this.authService.logout();
            return of(this.router.createUrlTree(['/auth/login']));
          })
        );
      })
    );
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add projects/kubee-admin/src/app/layout/guards/auth.guard.ts projects/kubee-admin/src/app/layout/guards/redirect.guard.ts
git commit -m "feat(admin): auth guard checks KUBEE_OPS userType"
```

---

### Task 5: Fix AdminLayout — admin-layout.ts + admin-layout.html

**Files:**
- Modify: `projects/kubee-admin/src/app/layout/components/admin-layout/admin-layout.ts`
- Modify: `projects/kubee-admin/src/app/layout/components/admin-layout/admin-layout.html`

- [ ] **Step 1: Replace admin-layout.ts with cleaned-up version**

Replace `projects/kubee-admin/src/app/layout/components/admin-layout/admin-layout.ts` with:

```typescript
import { Component, HostListener, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Building2,
  Users,
  AppWindow,
  ShieldCheck,
  KeyRound,
  Database,
  ScrollText,
  CreditCard,
  ChevronDown,
  ChevronLeft,
  Menu,
  Search,
  SettingsIcon,
  X,
  BookOpen,
  HelpCircle,
  MessageSquare,
  LogOut,
  Zap,
  Bug,
} from 'lucide-angular';
import { CustomDropdownComponent, DropdownMenuItem } from 'kubee-ui';
import { AuthService } from '../../guards/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, CustomDropdownComponent],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdminLayout {

  isMobileMenuOpen = false;
  isSidebarCollapsed = false;
  openDropdownLabel: string | null = null;

  readonly ChevronDown = ChevronDown;
  readonly ChevronLeft = ChevronLeft;
  readonly Menu = Menu;
  readonly Search = Search;
  readonly XIcon = X;
  readonly helpIcon = HelpCircle;
  readonly Zap = Zap;

  user: UserProfile = { name: '', role: 'KUBEE_OPS', initials: 'KO', email: '' };

  helpCenterItems: DropdownMenuItem[] = [
    {
      label: 'Knowledge Base',
      subLabel: 'Platform documentation',
      icon: BookOpen,
      iconBgClass: 'bg-slate-50',
      colorClass: 'text-slate-600',
      action: () => {}
    },
    {
      label: 'Contact Support',
      subLabel: 'Open a support ticket',
      icon: MessageSquare,
      iconBgClass: 'bg-slate-50',
      colorClass: 'text-slate-600',
      action: () => {}
    },
    {
      label: 'Bug Report',
      subLabel: 'Report a platform issue',
      icon: Bug,
      iconBgClass: 'bg-slate-50',
      colorClass: 'text-slate-600',
      action: () => {}
    }
  ];

  userMenuItems: DropdownMenuItem[] = [
    {
      label: 'Settings',
      subLabel: 'System preferences',
      icon: SettingsIcon,
      iconBgClass: 'bg-slate-50',
      colorClass: 'text-slate-600',
      action: () => {}
    },
    {
      label: 'Sign Out',
      icon: LogOut,
      iconBgClass: 'bg-rose-50',
      colorClass: 'text-rose-600',
      action: () => this.authService.logout()
    }
  ];

  allNavItems: NavItem[] = [
    { label: 'Platform', isHeader: true, icon: null },
    { label: 'Dashboard', link: '/dashboard', icon: LayoutDashboard },
    { label: 'Tenants', link: '/tenants', icon: Building2 },
    { label: 'Subscriptions', link: '/subscriptions', icon: CreditCard },
    { label: 'Access Control', isHeader: true, icon: null },
    { label: 'Users', link: '/users', icon: Users },
    { label: 'Applications', link: '/applications', icon: AppWindow },
    { label: 'Roles', link: '/roles', icon: ShieldCheck },
    { label: 'Permissions', link: '/permissions', icon: KeyRound },
    { label: 'Resources', link: '/resources', icon: Database },
    { label: 'Monitoring', isHeader: true, icon: null },
    { label: 'Audit Logs', link: '/audit-logs', icon: ScrollText },
  ];

  constructor(private authService: AuthService, public router: Router) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = {
          name: user.fullName,
          role: user.userType,
          initials: this.getInitials(user.fullName),
          email: user.email
        };
      }
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  toggleMenu() { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  closeMenu() { this.isMobileMenuOpen = false; }

  isItemActive(item: NavItem): boolean {
    if (!this.router?.url) return false;
    if (item.link && this.router.url === item.link) return true;
    if (item.link && this.router.url.startsWith(item.link) && item.link !== '/') return true;
    return false;
  }

  toggleSidebarCollapse() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
    if (this.isSidebarCollapsed) this.openDropdownLabel = null;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') this.closeMenu();
  }
}

export interface NavItem {
  label: string;
  icon: any;
  link?: string;
  isHeader?: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
  email: string;
}
```

- [ ] **Step 2: Replace admin-layout.html with cleaned-up version**

Replace `projects/kubee-admin/src/app/layout/components/admin-layout/admin-layout.html` with:

```html
<div class="flex w-full h-screen bg-ez-white text-ez-body overflow-hidden">

    @if (isMobileMenuOpen) {
    <div (click)="closeMenu()" class="fixed inset-0 bg-ez-carbon/80 z-20 lg:hidden transition-opacity duration-ez"></div>
    }

    <aside id="app-sidebar"
        class="fixed inset-y-0 left-0 z-30 bg-ez-carbon flex flex-col transition-all duration-ez lg:static"
        [ngClass]="{
            'translate-x-0': isMobileMenuOpen,
            '-translate-x-full lg:translate-x-0': !isMobileMenuOpen,
            'w-64': !isSidebarCollapsed,
            'w-20': isSidebarCollapsed
        }">

        <div class="h-16 flex items-center shrink-0 transition-all duration-ez border-b border-white/10"
            [ngClass]="isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'">
            <a class="cursor-pointer" href="/dashboard">
                <div class="flex items-center gap-1">
                    <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
                        <img src="/assets/images/Kubee_logo.png" width="42" alt="Kubee">
                    </div>
                    @if (!isSidebarCollapsed) {
                    <div class="text-left" style="line-height: 1">
                        <span class="block text-ez-lg font-medium text-white leading-tight">Kubee</span>
                        <span class="block text-ez-2xs text-white/70 tracking-widest uppercase">Ops</span>
                    </div>
                    }
                </div>
            </a>

            <button (click)="closeMenu()"
                class="lg:hidden text-white/50 hover:text-white transition-colors duration-ez p-1 outline-none">
                <lucide-icon [img]="XIcon" class="w-6 h-6"></lucide-icon>
            </button>

            <button (click)="toggleSidebarCollapse()"
                class="hidden lg:flex absolute -right-3 top-5 z-50 items-center justify-center w-6 h-6 bg-ez-white border border-ez-border rounded text-ez-secondary hover:text-ez-primary hover:border-ez-primary transition-[border-color,color] duration-ez outline-none"
                [ngClass]="{'rotate-180': isSidebarCollapsed}">
                <lucide-icon [img]="ChevronLeft" class="w-3.5 h-3.5 transition-transform duration-ez"></lucide-icon>
            </button>
        </div>

        <nav class="flex-1 mt-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
            @for (item of allNavItems; track item.label; let i = $index) {
            @if (item.isHeader) {
                @if (!isSidebarCollapsed) {
                <div class="px-3 py-2 ez-micro-label text-white/30">{{ item.label }}</div>
                } @else {
                <div class="my-4 border-t border-white/10 w-8 mx-auto"></div>
                }
            } @else {
            <a [routerLink]="item.link" [id]="'menu-item-' + i"
                class="group relative flex items-center p-3 text-ez-sm font-medium transition-[background-color,color] duration-ez cursor-pointer outline-none"
                [ngClass]="{
                    'justify-center': isSidebarCollapsed,
                    'text-white bg-white/5': isItemActive(item),
                    'text-white/60 hover:text-white hover:bg-white/5': !isItemActive(item)
                }">
                <lucide-icon [img]="item.icon" class="h-5 w-5 shrink-0 transition-colors duration-ez"
                    [ngClass]="{
                        'text-white': isItemActive(item),
                        'text-white/40 group-hover:text-white': !isItemActive(item)
                    }">
                </lucide-icon>
                @if (!isSidebarCollapsed) {
                <span class="ml-3 truncate animate-in fade-in duration-ez">{{ item.label }}</span>
                }
                @if (isSidebarCollapsed) {
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-[100] whitespace-nowrap bg-ez-carbon border border-white/10 px-3 py-1.5 text-ez-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-ez">
                    {{ item.label }}
                </div>
                }
            </a>
            }
            }
        </nav>
    </aside>

    <main class="flex-1 min-w-0 flex flex-col bg-ez-white overflow-hidden transition-all duration-ez">

        <header class="h-16 bg-ez-white border-b border-ez-border flex items-center justify-between px-6 sticky top-0 z-10">

            <div class="flex items-center gap-4 flex-1">
                <button (click)="toggleMenu()"
                    class="lg:hidden text-ez-secondary hover:text-ez-heading outline-none transition-colors duration-ez">
                    <lucide-icon [img]="Menu" class="w-6 h-6"></lucide-icon>
                </button>

                <div class="hidden md:flex bg-ez-ash border border-ez-ash rounded relative w-full max-w-sm focus-within:border-ez-primary transition-[border-color] duration-ez">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <lucide-icon [img]="Search" class="w-4 h-4 text-ez-muted"></lucide-icon>
                    </div>
                    <input type="text"
                        class="w-full pl-9 pr-3 py-2 bg-transparent text-ez-base text-ez-heading placeholder:text-ez-muted outline-none"
                        placeholder="Search..." autocomplete="off">
                </div>
            </div>

            <div class="flex items-center gap-3">
                <app-custom-dropdown
                    [triggerIcon]="helpIcon"
                    [iconClass]="'h-4 w-4 shrink-0 transition-colors duration-ez'"
                    buttonClass="flex items-center justify-center w-8 h-8 bg-ez-white border border-ez-border rounded hover:border-ez-subtle text-ez-secondary hover:text-ez-heading transition-[border-color,color] duration-ez outline-none"
                    [items]="helpCenterItems"
                    anchor="bottom end">
                </app-custom-dropdown>

                <el-dropdown class="inline-block ml-2 pl-4 border-l border-ez-border">
                    <button class="flex items-center gap-2 outline-none">
                        <div class="w-8 h-8 rounded-full bg-ez-carbon text-white flex items-center justify-center text-ez-sm font-medium transition-colors duration-ez">
                            {{ user.initials }}
                        </div>
                    </button>

                    <el-menu [attr.anchor]="'bottom end'" popover
                        class="m-0 mt-2 w-72 rounded-none bg-ez-white border border-ez-border shadow-xl p-0 focus:outline-none transition-opacity duration-ez data-[closed]:opacity-0">

                        <div class="p-4 border-b border-ez-border bg-ez-ash flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-ez-carbon text-white flex items-center justify-center font-medium">
                                {{ user.initials }}
                            </div>
                            <div class="flex flex-col min-w-0">
                                <span class="text-ez-sm font-medium text-ez-heading truncate capitalize">{{ user.name }}</span>
                                <span class="text-ez-xs text-ez-secondary truncate">{{ user.email }}</span>
                                <div class="mt-1">
                                    <span class="ez-micro-label">{{ user.role }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="py-2">
                            @for (item of userMenuItems; track item.label) {
                            <a (click)="item.action ? item.action() : null"
                                class="flex items-center gap-3 px-4 py-2 text-ez-sm text-ez-body hover:bg-ez-ash hover:text-ez-heading transition-[background-color,color] duration-ez outline-none cursor-pointer">
                                <div class="w-6 flex justify-center">
                                    <lucide-icon [img]="item.icon" class="w-4 h-4 text-ez-secondary"></lucide-icon>
                                </div>
                                <div class="flex flex-col">
                                    <span class="font-medium">{{ item.label }}</span>
                                    @if (item.subLabel) {
                                    <span class="text-ez-xs text-ez-muted">{{ item.subLabel }}</span>
                                    }
                                </div>
                            </a>
                            }
                        </div>
                    </el-menu>
                </el-dropdown>
            </div>
        </header>

        <div class="flex-1 overflow-y-auto scroll-smooth bg-ez-white">
            <router-outlet></router-outlet>
        </div>
    </main>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add projects/kubee-admin/src/app/layout/components/admin-layout/admin-layout.ts projects/kubee-admin/src/app/layout/components/admin-layout/admin-layout.html
git commit -m "feat(admin): clean up AdminLayout — admin nav, remove missing components"
```

---

### Task 6: Auth view — login page

**Files:**
- Modify: `projects/kubee-admin/src/app/views/auth/auth.ts`
- Modify: `projects/kubee-admin/src/app/views/auth/auth.html`
- Create: `projects/kubee-admin/src/app/views/auth/auth.routes.ts`

- [ ] **Step 1: Replace auth.ts with login component**

Replace `projects/kubee-admin/src/app/views/auth/auth.ts` with:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../layout/guards/auth.service';
import { ToastService } from 'kubee-ui';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  onSubmit() {
    if (this.loginForm.invalid) { this.loginForm.markAllAsTouched(); return; }
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login(
      this.loginForm.value,
      () => { this.isLoading = false; },
      (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.show(this.errorMessage, 'error');
      }
    );
  }
}
```

- [ ] **Step 2: Replace auth.html with login form**

Replace `projects/kubee-admin/src/app/views/auth/auth.html` with:

```html
<div class="min-h-screen bg-ez-ash flex items-center justify-center px-4">
    <div class="w-full max-w-md">

        <div class="text-center mb-8">
            <div class="flex items-center justify-center gap-2 mb-4">
                <img src="/assets/images/Kubee_logo.png" width="40" alt="Kubee">
                <div class="text-left" style="line-height: 1">
                    <span class="block text-xl font-semibold text-ez-heading">Kubee</span>
                    <span class="block text-xs text-ez-secondary tracking-widest uppercase">Ops Portal</span>
                </div>
            </div>
            <h1 class="text-2xl font-semibold text-ez-heading">Welcome back</h1>
            <p class="text-ez-secondary text-sm mt-1">Sign in to your ops account</p>
        </div>

        <div class="bg-ez-white border border-ez-border p-8">
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-ez-heading mb-1.5">Email address</label>
                    <input formControlName="email" type="email" autocomplete="email"
                        class="w-full px-3 py-2 border rounded text-sm outline-none transition-colors duration-ez"
                        [ngClass]="email.invalid && email.touched ? 'border-red-400 focus:border-red-500' : 'border-ez-border focus:border-ez-primary'"
                        placeholder="ops@kubee.com">
                    @if (email.invalid && email.touched) {
                    <p class="mt-1 text-xs text-red-500">
                        {{ email.errors?.['required'] ? 'Email is required' : 'Enter a valid email' }}
                    </p>
                    }
                </div>

                <div class="mb-6">
                    <label class="block text-sm font-medium text-ez-heading mb-1.5">Password</label>
                    <input formControlName="password" type="password" autocomplete="current-password"
                        class="w-full px-3 py-2 border rounded text-sm outline-none transition-colors duration-ez"
                        [ngClass]="password.invalid && password.touched ? 'border-red-400 focus:border-red-500' : 'border-ez-border focus:border-ez-primary'"
                        placeholder="••••••••">
                    @if (password.invalid && password.touched) {
                    <p class="mt-1 text-xs text-red-500">Password is required (min 6 characters)</p>
                    }
                </div>

                @if (errorMessage) {
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {{ errorMessage }}
                </div>
                }

                <button type="submit" [disabled]="isLoading"
                    class="w-full py-2.5 px-4 bg-ez-primary text-white text-sm font-medium rounded transition-opacity duration-ez disabled:opacity-60 hover:opacity-90">
                    {{ isLoading ? 'Signing in...' : 'Sign in' }}
                </button>
            </form>
        </div>
    </div>
</div>
```

- [ ] **Step 3: Create auth.routes.ts**

Create `projects/kubee-admin/src/app/views/auth/auth.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const adminAuthRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth').then(c => c.Auth)
  }
];
```

- [ ] **Step 4: Commit**

```bash
git add projects/kubee-admin/src/app/views/auth/auth.ts projects/kubee-admin/src/app/views/auth/auth.html projects/kubee-admin/src/app/views/auth/auth.routes.ts
git commit -m "feat(admin): build login page"
```

---

### Task 7: Forbidden component

**Files:**
- Create: `projects/kubee-admin/src/app/views/forbidden/forbidden.component.ts`
- Create: `projects/kubee-admin/src/app/views/forbidden/forbidden.component.html`

- [ ] **Step 1: Create forbidden.component.ts**

Create `projects/kubee-admin/src/app/views/forbidden/forbidden.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forbidden.component.html',
})
export class ForbiddenComponent {
  constructor(private router: Router) {}
  goToLogin() { this.router.navigate(['/auth/login']); }
}
```

- [ ] **Step 2: Create forbidden.component.html**

Create `projects/kubee-admin/src/app/views/forbidden/forbidden.component.html`:

```html
<div class="min-h-screen bg-ez-ash flex items-center justify-center px-4">
    <div class="text-center">
        <h1 class="text-6xl font-bold text-ez-heading mb-4">403</h1>
        <h2 class="text-xl font-medium text-ez-heading mb-2">Access Forbidden</h2>
        <p class="text-ez-secondary text-sm mb-8">This portal is restricted to KUBEE_OPS accounts only.</p>
        <button (click)="goToLogin()"
            class="px-4 py-2 bg-ez-primary text-white text-sm font-medium rounded hover:opacity-90 transition-opacity">
            Back to Login
        </button>
    </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add projects/kubee-admin/src/app/views/forbidden/
git commit -m "feat(admin): add forbidden (403) page"
```

---

### Task 8: Dashboard component + service

**Files:**
- Create: `projects/kubee-admin/src/app/views/dashboard/dashboard.component.ts`
- Create: `projects/kubee-admin/src/app/views/dashboard/dashboard.component.html`
- Create: `projects/kubee-admin/src/app/views/dashboard/dashboard.service.ts`

- [ ] **Step 1: Create dashboard.service.ts**

Create `projects/kubee-admin/src/app/views/dashboard/dashboard.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static STATS_URL = `${DashboardService.BASE_URL}/api/v1/admin/dashboard/stats`;

  constructor(private http: HttpService) {}

  getStats(success: any, error: any) {
    return this.http.getHttp(DashboardService.STATS_URL, success, error);
  }
}
```

- [ ] **Step 2: Create dashboard.component.ts**

Create `projects/kubee-admin/src/app/views/dashboard/dashboard.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  isLoading = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.isLoading = true;
    this.dashboardService.getStats(
      (res: any) => { this.stats = res.data; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 3: Create dashboard.component.html**

Create `projects/kubee-admin/src/app/views/dashboard/dashboard.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Dashboard</h1>
        <p class="text-sm text-ez-secondary mt-1">Platform overview</p>
    </div>

    @if (isLoading) {
    <div class="text-center py-16 text-sm text-ez-secondary">Loading stats...</div>
    }

    @if (!isLoading) {
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-ez-white border border-ez-border p-5">
            <p class="text-xs text-ez-secondary uppercase tracking-wide mb-1">Total Tenants</p>
            <p class="text-2xl font-semibold text-ez-heading">{{ stats?.totalTenants ?? '—' }}</p>
        </div>
        <div class="bg-ez-white border border-ez-border p-5">
            <p class="text-xs text-ez-secondary uppercase tracking-wide mb-1">Total Users</p>
            <p class="text-2xl font-semibold text-ez-heading">{{ stats?.totalUsers ?? '—' }}</p>
        </div>
        <div class="bg-ez-white border border-ez-border p-5">
            <p class="text-xs text-ez-secondary uppercase tracking-wide mb-1">Active Subscriptions</p>
            <p class="text-2xl font-semibold text-ez-heading">{{ stats?.activeSubscriptions ?? '—' }}</p>
        </div>
        <div class="bg-ez-white border border-ez-border p-5">
            <p class="text-xs text-ez-secondary uppercase tracking-wide mb-1">Applications</p>
            <p class="text-2xl font-semibold text-ez-heading">{{ stats?.totalApplications ?? '—' }}</p>
        </div>
    </div>
    }
</div>
```

- [ ] **Step 4: Commit**

```bash
git add projects/kubee-admin/src/app/views/dashboard/
git commit -m "feat(admin): add dashboard view and service"
```

---

### Task 9: Platform modules — Tenants + Subscriptions

**Files:**
- Create: `projects/kubee-admin/src/app/views/tenants/tenants.component.ts`
- Create: `projects/kubee-admin/src/app/views/tenants/tenants.component.html`
- Create: `projects/kubee-admin/src/app/views/tenants/tenants.service.ts`
- Create: `projects/kubee-admin/src/app/views/tenants/tenants.routes.ts`
- Create: `projects/kubee-admin/src/app/views/subscriptions/subscriptions.component.ts`
- Create: `projects/kubee-admin/src/app/views/subscriptions/subscriptions.component.html`
- Create: `projects/kubee-admin/src/app/views/subscriptions/subscriptions.service.ts`
- Create: `projects/kubee-admin/src/app/views/subscriptions/subscriptions.routes.ts`

- [ ] **Step 1: Create tenants.service.ts**

Create `projects/kubee-admin/src/app/views/tenants/tenants.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${TenantsService.BASE_URL}/api/v1/admin/tenants`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(TenantsService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${TenantsService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(TenantsService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${TenantsService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${TenantsService.URL}/${id}`, success, error);
  }
}
```

- [ ] **Step 2: Create tenants.component.ts**

Create `projects/kubee-admin/src/app/views/tenants/tenants.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { TenantsService } from './tenants.service';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tenants.component.html',
})
export class TenantsComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: TenantsService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 3: Create tenants.component.html**

Create `projects/kubee-admin/src/app/views/tenants/tenants.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Tenants</h1>
        <p class="text-sm text-ez-secondary mt-1">Manage all platform tenants</p>
    </div>
    <div class="bg-ez-white border border-ez-border">
        <div class="p-4 border-b border-ez-border">
            <input [formControl]="searchControl" type="text"
                class="w-full max-w-sm px-3 py-2 border border-ez-border rounded text-sm outline-none focus:border-ez-primary"
                placeholder="Search tenants...">
        </div>
        @if (isLoading) {
        <div class="p-8 text-center text-sm text-ez-secondary">Loading...</div>
        }
        @if (!isLoading && items.length === 0) {
        <div class="p-8 text-center text-sm text-ez-secondary">No tenants found.</div>
        }
        @if (!isLoading && items.length > 0) {
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-ez-ash border-b border-ez-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @for (item of items; track $index) {
                    <tr class="border-b border-ez-border hover:bg-ez-ash">
                        <td class="px-4 py-3 text-ez-heading">{{ item.id }}</td>
                        <td class="px-4 py-3 text-ez-heading">{{ item.tenantName || item.name || '—' }}</td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded text-xs"
                                [ngClass]="item.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                                {{ item.isActive ? 'Active' : 'Inactive' }}
                            </span>
                        </td>
                    </tr>
                    }
                </tbody>
            </table>
        </div>
        }
    </div>
</div>
```

- [ ] **Step 4: Create tenants.routes.ts**

Create `projects/kubee-admin/src/app/views/tenants/tenants.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const tenantsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tenants.component').then(c => c.TenantsComponent)
  }
];
```

- [ ] **Step 5: Create subscriptions.service.ts**

Create `projects/kubee-admin/src/app/views/subscriptions/subscriptions.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${SubscriptionsService.BASE_URL}/api/v1/admin/subscriptions`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(SubscriptionsService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${SubscriptionsService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(SubscriptionsService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${SubscriptionsService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${SubscriptionsService.URL}/${id}`, success, error);
  }
}
```

- [ ] **Step 6: Create subscriptions.component.ts**

Create `projects/kubee-admin/src/app/views/subscriptions/subscriptions.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { SubscriptionsService } from './subscriptions.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subscriptions.component.html',
})
export class SubscriptionsComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: SubscriptionsService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 7: Create subscriptions.component.html**

Create `projects/kubee-admin/src/app/views/subscriptions/subscriptions.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Subscriptions</h1>
        <p class="text-sm text-ez-secondary mt-1">Manage platform subscriptions</p>
    </div>
    <div class="bg-ez-white border border-ez-border">
        <div class="p-4 border-b border-ez-border">
            <input [formControl]="searchControl" type="text"
                class="w-full max-w-sm px-3 py-2 border border-ez-border rounded text-sm outline-none focus:border-ez-primary"
                placeholder="Search subscriptions...">
        </div>
        @if (isLoading) {
        <div class="p-8 text-center text-sm text-ez-secondary">Loading...</div>
        }
        @if (!isLoading && items.length === 0) {
        <div class="p-8 text-center text-sm text-ez-secondary">No subscriptions found.</div>
        }
        @if (!isLoading && items.length > 0) {
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-ez-ash border-b border-ez-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Tenant</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Plan</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @for (item of items; track $index) {
                    <tr class="border-b border-ez-border hover:bg-ez-ash">
                        <td class="px-4 py-3 text-ez-heading">{{ item.id }}</td>
                        <td class="px-4 py-3 text-ez-heading">{{ item.tenantName || '—' }}</td>
                        <td class="px-4 py-3 text-ez-heading">{{ item.planName || item.plan || '—' }}</td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded text-xs"
                                [ngClass]="item.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                                {{ item.isActive ? 'Active' : 'Inactive' }}
                            </span>
                        </td>
                    </tr>
                    }
                </tbody>
            </table>
        </div>
        }
    </div>
</div>
```

- [ ] **Step 8: Create subscriptions.routes.ts**

Create `projects/kubee-admin/src/app/views/subscriptions/subscriptions.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const subscriptionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./subscriptions.component').then(c => c.SubscriptionsComponent)
  }
];
```

- [ ] **Step 9: Commit**

```bash
git add projects/kubee-admin/src/app/views/tenants/ projects/kubee-admin/src/app/views/subscriptions/
git commit -m "feat(admin): add tenants and subscriptions modules"
```

---

### Task 10: Access Control modules — Users + Applications

**Files:**
- Create: `projects/kubee-admin/src/app/views/users/users.component.ts`
- Create: `projects/kubee-admin/src/app/views/users/users.component.html`
- Create: `projects/kubee-admin/src/app/views/users/users.service.ts`
- Create: `projects/kubee-admin/src/app/views/users/users.routes.ts`
- Create: `projects/kubee-admin/src/app/views/applications/applications.component.ts`
- Create: `projects/kubee-admin/src/app/views/applications/applications.component.html`
- Create: `projects/kubee-admin/src/app/views/applications/applications.service.ts`
- Create: `projects/kubee-admin/src/app/views/applications/applications.routes.ts`

- [ ] **Step 1: Create users.service.ts**

Create `projects/kubee-admin/src/app/views/users/users.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${UsersService.BASE_URL}/api/v1/admin/users`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(UsersService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${UsersService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(UsersService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${UsersService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${UsersService.URL}/${id}`, success, error);
  }
}
```

- [ ] **Step 2: Create users.component.ts**

Create `projects/kubee-admin/src/app/views/users/users.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { UsersService } from './users.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
})
export class UsersComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: UsersService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 3: Create users.component.html**

Create `projects/kubee-admin/src/app/views/users/users.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Users</h1>
        <p class="text-sm text-ez-secondary mt-1">Manage all platform users</p>
    </div>
    <div class="bg-ez-white border border-ez-border">
        <div class="p-4 border-b border-ez-border">
            <input [formControl]="searchControl" type="text"
                class="w-full max-w-sm px-3 py-2 border border-ez-border rounded text-sm outline-none focus:border-ez-primary"
                placeholder="Search users...">
        </div>
        @if (isLoading) {
        <div class="p-8 text-center text-sm text-ez-secondary">Loading...</div>
        }
        @if (!isLoading && items.length === 0) {
        <div class="p-8 text-center text-sm text-ez-secondary">No users found.</div>
        }
        @if (!isLoading && items.length > 0) {
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-ez-ash border-b border-ez-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Email</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Type</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @for (item of items; track $index) {
                    <tr class="border-b border-ez-border hover:bg-ez-ash">
                        <td class="px-4 py-3 text-ez-heading">{{ item.id }}</td>
                        <td class="px-4 py-3 text-ez-heading">{{ item.fullName || item.name || '—' }}</td>
                        <td class="px-4 py-3 text-ez-secondary">{{ item.email || '—' }}</td>
                        <td class="px-4 py-3 text-ez-secondary">{{ item.userType || '—' }}</td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded text-xs"
                                [ngClass]="item.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                                {{ item.isActive ? 'Active' : 'Inactive' }}
                            </span>
                        </td>
                    </tr>
                    }
                </tbody>
            </table>
        </div>
        }
    </div>
</div>
```

- [ ] **Step 4: Create users.routes.ts**

Create `projects/kubee-admin/src/app/views/users/users.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users.component').then(c => c.UsersComponent)
  }
];
```

- [ ] **Step 5: Create applications.service.ts**

Create `projects/kubee-admin/src/app/views/applications/applications.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${ApplicationsService.BASE_URL}/api/v1/admin/applications`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(ApplicationsService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${ApplicationsService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(ApplicationsService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${ApplicationsService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${ApplicationsService.URL}/${id}`, success, error);
  }
}
```

- [ ] **Step 6: Create applications.component.ts**

Create `projects/kubee-admin/src/app/views/applications/applications.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ApplicationsService } from './applications.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './applications.component.html',
})
export class ApplicationsComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: ApplicationsService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 7: Create applications.component.html**

Create `projects/kubee-admin/src/app/views/applications/applications.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Applications</h1>
        <p class="text-sm text-ez-secondary mt-1">Manage platform applications</p>
    </div>
    <div class="bg-ez-white border border-ez-border">
        <div class="p-4 border-b border-ez-border">
            <input [formControl]="searchControl" type="text"
                class="w-full max-w-sm px-3 py-2 border border-ez-border rounded text-sm outline-none focus:border-ez-primary"
                placeholder="Search applications...">
        </div>
        @if (isLoading) {
        <div class="p-8 text-center text-sm text-ez-secondary">Loading...</div>
        }
        @if (!isLoading && items.length === 0) {
        <div class="p-8 text-center text-sm text-ez-secondary">No applications found.</div>
        }
        @if (!isLoading && items.length > 0) {
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-ez-ash border-b border-ez-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">App Key</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @for (item of items; track $index) {
                    <tr class="border-b border-ez-border hover:bg-ez-ash">
                        <td class="px-4 py-3 text-ez-heading">{{ item.id }}</td>
                        <td class="px-4 py-3 text-ez-heading">{{ item.appName || item.name || '—' }}</td>
                        <td class="px-4 py-3 text-ez-secondary font-mono text-xs">{{ item.appKey || '—' }}</td>
                        <td class="px-4 py-3">
                            <span class="px-2 py-1 rounded text-xs"
                                [ngClass]="item.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                                {{ item.isActive ? 'Active' : 'Inactive' }}
                            </span>
                        </td>
                    </tr>
                    }
                </tbody>
            </table>
        </div>
        }
    </div>
</div>
```

- [ ] **Step 8: Create applications.routes.ts**

Create `projects/kubee-admin/src/app/views/applications/applications.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const applicationsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./applications.component').then(c => c.ApplicationsComponent)
  }
];
```

- [ ] **Step 9: Commit**

```bash
git add projects/kubee-admin/src/app/views/users/ projects/kubee-admin/src/app/views/applications/
git commit -m "feat(admin): add users and applications modules"
```

---

### Task 11: Access Control modules — Roles + Permissions

**Files:**
- Create: `projects/kubee-admin/src/app/views/roles/roles.component.ts`
- Create: `projects/kubee-admin/src/app/views/roles/roles.component.html`
- Create: `projects/kubee-admin/src/app/views/roles/roles.service.ts`
- Create: `projects/kubee-admin/src/app/views/roles/roles.routes.ts`
- Create: `projects/kubee-admin/src/app/views/permissions/permissions.component.ts`
- Create: `projects/kubee-admin/src/app/views/permissions/permissions.component.html`
- Create: `projects/kubee-admin/src/app/views/permissions/permissions.service.ts`
- Create: `projects/kubee-admin/src/app/views/permissions/permissions.routes.ts`

- [ ] **Step 1: Create roles.service.ts**

Create `projects/kubee-admin/src/app/views/roles/roles.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${RolesService.BASE_URL}/api/v1/admin/roles`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(RolesService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${RolesService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(RolesService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${RolesService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${RolesService.URL}/${id}`, success, error);
  }
}
```

- [ ] **Step 2: Create roles.component.ts**

Create `projects/kubee-admin/src/app/views/roles/roles.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RolesService } from './roles.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
})
export class RolesComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: RolesService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 3: Create roles.component.html**

Create `projects/kubee-admin/src/app/views/roles/roles.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Roles</h1>
        <p class="text-sm text-ez-secondary mt-1">Manage platform roles</p>
    </div>
    <div class="bg-ez-white border border-ez-border">
        <div class="p-4 border-b border-ez-border">
            <input [formControl]="searchControl" type="text"
                class="w-full max-w-sm px-3 py-2 border border-ez-border rounded text-sm outline-none focus:border-ez-primary"
                placeholder="Search roles...">
        </div>
        @if (isLoading) {
        <div class="p-8 text-center text-sm text-ez-secondary">Loading...</div>
        }
        @if (!isLoading && items.length === 0) {
        <div class="p-8 text-center text-sm text-ez-secondary">No roles found.</div>
        }
        @if (!isLoading && items.length > 0) {
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-ez-ash border-b border-ez-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Description</th>
                    </tr>
                </thead>
                <tbody>
                    @for (item of items; track $index) {
                    <tr class="border-b border-ez-border hover:bg-ez-ash">
                        <td class="px-4 py-3 text-ez-heading">{{ item.id }}</td>
                        <td class="px-4 py-3 text-ez-heading">{{ item.roleName || item.name || '—' }}</td>
                        <td class="px-4 py-3 text-ez-secondary">{{ item.description || '—' }}</td>
                    </tr>
                    }
                </tbody>
            </table>
        </div>
        }
    </div>
</div>
```

- [ ] **Step 4: Create roles.routes.ts**

Create `projects/kubee-admin/src/app/views/roles/roles.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./roles.component').then(c => c.RolesComponent)
  }
];
```

- [ ] **Step 5: Create permissions.service.ts**

Create `projects/kubee-admin/src/app/views/permissions/permissions.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${PermissionsService.BASE_URL}/api/v1/admin/permissions`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(PermissionsService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${PermissionsService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(PermissionsService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${PermissionsService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${PermissionsService.URL}/${id}`, success, error);
  }
}
```

- [ ] **Step 6: Create permissions.component.ts**

Create `projects/kubee-admin/src/app/views/permissions/permissions.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { PermissionsService } from './permissions.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './permissions.component.html',
})
export class PermissionsComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: PermissionsService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 7: Create permissions.component.html**

Create `projects/kubee-admin/src/app/views/permissions/permissions.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Permissions</h1>
        <p class="text-sm text-ez-secondary mt-1">Manage platform permissions</p>
    </div>
    <div class="bg-ez-white border border-ez-border">
        <div class="p-4 border-b border-ez-border">
            <input [formControl]="searchControl" type="text"
                class="w-full max-w-sm px-3 py-2 border border-ez-border rounded text-sm outline-none focus:border-ez-primary"
                placeholder="Search permissions...">
        </div>
        @if (isLoading) {
        <div class="p-8 text-center text-sm text-ez-secondary">Loading...</div>
        }
        @if (!isLoading && items.length === 0) {
        <div class="p-8 text-center text-sm text-ez-secondary">No permissions found.</div>
        }
        @if (!isLoading && items.length > 0) {
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-ez-ash border-b border-ez-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Key</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Description</th>
                    </tr>
                </thead>
                <tbody>
                    @for (item of items; track $index) {
                    <tr class="border-b border-ez-border hover:bg-ez-ash">
                        <td class="px-4 py-3 text-ez-heading">{{ item.id }}</td>
                        <td class="px-4 py-3 text-ez-secondary font-mono text-xs">{{ item.privilegeKey || item.key || '—' }}</td>
                        <td class="px-4 py-3 text-ez-secondary">{{ item.description || '—' }}</td>
                    </tr>
                    }
                </tbody>
            </table>
        </div>
        }
    </div>
</div>
```

- [ ] **Step 8: Create permissions.routes.ts**

Create `projects/kubee-admin/src/app/views/permissions/permissions.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const permissionsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./permissions.component').then(c => c.PermissionsComponent)
  }
];
```

- [ ] **Step 9: Commit**

```bash
git add projects/kubee-admin/src/app/views/roles/ projects/kubee-admin/src/app/views/permissions/
git commit -m "feat(admin): add roles and permissions modules"
```

---

### Task 12: Remaining modules — Resources + Audit Logs

**Files:**
- Create: `projects/kubee-admin/src/app/views/resources/resources.component.ts`
- Create: `projects/kubee-admin/src/app/views/resources/resources.component.html`
- Create: `projects/kubee-admin/src/app/views/resources/resources.service.ts`
- Create: `projects/kubee-admin/src/app/views/resources/resources.routes.ts`
- Create: `projects/kubee-admin/src/app/views/audit-logs/audit-logs.component.ts`
- Create: `projects/kubee-admin/src/app/views/audit-logs/audit-logs.component.html`
- Create: `projects/kubee-admin/src/app/views/audit-logs/audit-logs.service.ts`
- Create: `projects/kubee-admin/src/app/views/audit-logs/audit-logs.routes.ts`

- [ ] **Step 1: Create resources.service.ts**

Create `projects/kubee-admin/src/app/views/resources/resources.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${ResourcesService.BASE_URL}/api/v1/admin/resources`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(ResourcesService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${ResourcesService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(ResourcesService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${ResourcesService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${ResourcesService.URL}/${id}`, success, error);
  }
}
```

- [ ] **Step 2: Create resources.component.ts**

Create `projects/kubee-admin/src/app/views/resources/resources.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ResourcesService } from './resources.service';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './resources.component.html',
})
export class ResourcesComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: ResourcesService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 3: Create resources.component.html**

Create `projects/kubee-admin/src/app/views/resources/resources.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Resources</h1>
        <p class="text-sm text-ez-secondary mt-1">Manage platform resources</p>
    </div>
    <div class="bg-ez-white border border-ez-border">
        <div class="p-4 border-b border-ez-border">
            <input [formControl]="searchControl" type="text"
                class="w-full max-w-sm px-3 py-2 border border-ez-border rounded text-sm outline-none focus:border-ez-primary"
                placeholder="Search resources...">
        </div>
        @if (isLoading) {
        <div class="p-8 text-center text-sm text-ez-secondary">Loading...</div>
        }
        @if (!isLoading && items.length === 0) {
        <div class="p-8 text-center text-sm text-ez-secondary">No resources found.</div>
        }
        @if (!isLoading && items.length > 0) {
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-ez-ash border-b border-ez-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Name</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Type</th>
                    </tr>
                </thead>
                <tbody>
                    @for (item of items; track $index) {
                    <tr class="border-b border-ez-border hover:bg-ez-ash">
                        <td class="px-4 py-3 text-ez-heading">{{ item.id }}</td>
                        <td class="px-4 py-3 text-ez-heading">{{ item.resourceName || item.name || '—' }}</td>
                        <td class="px-4 py-3 text-ez-secondary">{{ item.resourceType || item.type || '—' }}</td>
                    </tr>
                    }
                </tbody>
            </table>
        </div>
        }
    </div>
</div>
```

- [ ] **Step 4: Create resources.routes.ts**

Create `projects/kubee-admin/src/app/views/resources/resources.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const resourcesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./resources.component').then(c => c.ResourcesComponent)
  }
];
```

- [ ] **Step 5: Create audit-logs.service.ts**

Create `projects/kubee-admin/src/app/views/audit-logs/audit-logs.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${AuditLogsService.BASE_URL}/api/v1/admin/audit-logs`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(AuditLogsService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${AuditLogsService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(AuditLogsService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${AuditLogsService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${AuditLogsService.URL}/${id}`, success, error);
  }
}
```

- [ ] **Step 6: Create audit-logs.component.ts**

Create `projects/kubee-admin/src/app/views/audit-logs/audit-logs.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AuditLogsService } from './audit-logs.service';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit-logs.component.html',
})
export class AuditLogsComponent implements OnInit {
  searchControl = new FormControl('');
  items: any[] = [];
  isLoading = false;

  constructor(private service: AuditLogsService) {}

  ngOnInit() { this.load(); }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }
}
```

- [ ] **Step 7: Create audit-logs.component.html**

Create `projects/kubee-admin/src/app/views/audit-logs/audit-logs.component.html`:

```html
<div class="p-6">
    <div class="mb-6">
        <h1 class="text-2xl font-semibold text-ez-heading">Audit Logs</h1>
        <p class="text-sm text-ez-secondary mt-1">Track all platform activity</p>
    </div>
    <div class="bg-ez-white border border-ez-border">
        <div class="p-4 border-b border-ez-border">
            <input [formControl]="searchControl" type="text"
                class="w-full max-w-sm px-3 py-2 border border-ez-border rounded text-sm outline-none focus:border-ez-primary"
                placeholder="Search audit logs...">
        </div>
        @if (isLoading) {
        <div class="p-8 text-center text-sm text-ez-secondary">Loading...</div>
        }
        @if (!isLoading && items.length === 0) {
        <div class="p-8 text-center text-sm text-ez-secondary">No audit logs found.</div>
        }
        @if (!isLoading && items.length > 0) {
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-ez-ash border-b border-ez-border">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">ID</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Action</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">User</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-ez-secondary uppercase">Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    @for (item of items; track $index) {
                    <tr class="border-b border-ez-border hover:bg-ez-ash">
                        <td class="px-4 py-3 text-ez-heading">{{ item.id }}</td>
                        <td class="px-4 py-3 text-ez-heading">{{ item.action || item.eventType || '—' }}</td>
                        <td class="px-4 py-3 text-ez-secondary">{{ item.userEmail || item.performedBy || '—' }}</td>
                        <td class="px-4 py-3 text-ez-secondary text-xs">{{ item.createdAt || item.timestamp || '—' }}</td>
                    </tr>
                    }
                </tbody>
            </table>
        </div>
        }
    </div>
</div>
```

- [ ] **Step 8: Create audit-logs.routes.ts**

Create `projects/kubee-admin/src/app/views/audit-logs/audit-logs.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const auditLogsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./audit-logs.component').then(c => c.AuditLogsComponent)
  }
];
```

- [ ] **Step 9: Commit**

```bash
git add projects/kubee-admin/src/app/views/resources/ projects/kubee-admin/src/app/views/audit-logs/
git commit -m "feat(admin): add resources and audit-logs modules"
```

---

### Task 13: Wire app.routes.ts — final wiring

**Files:**
- Modify: `projects/kubee-admin/src/app/app.routes.ts`

- [ ] **Step 1: Replace app.routes.ts with full route configuration**

Replace `projects/kubee-admin/src/app/app.routes.ts` with:

```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './layout/guards/auth.guard';
import { RedirectGuard } from './layout/guards/redirect.guard';
import { AdminLayout } from './layout/components/admin-layout/admin-layout';

export const routes: Routes = [

  // Root redirect
  {
    path: '',
    canActivate: [RedirectGuard],
    children: []
  },

  // Auth (public)
  {
    path: 'auth',
    loadChildren: () => import('./views/auth/auth.routes').then(m => m.adminAuthRoutes)
  },

  // Forbidden (public)
  {
    path: 'forbidden',
    loadComponent: () => import('./views/forbidden/forbidden.component').then(c => c.ForbiddenComponent)
  },

  // Protected routes — wrapped in AdminLayout
  {
    path: '',
    component: AdminLayout,
    canActivate: [AuthGuard],
    data: { moduleKey: 'KUBEE_OPS' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./views/dashboard/dashboard.component').then(c => c.DashboardComponent)
      },
      {
        path: 'tenants',
        loadChildren: () => import('./views/tenants/tenants.routes').then(m => m.tenantsRoutes)
      },
      {
        path: 'subscriptions',
        loadChildren: () => import('./views/subscriptions/subscriptions.routes').then(m => m.subscriptionsRoutes)
      },
      {
        path: 'users',
        loadChildren: () => import('./views/users/users.routes').then(m => m.usersRoutes)
      },
      {
        path: 'applications',
        loadChildren: () => import('./views/applications/applications.routes').then(m => m.applicationsRoutes)
      },
      {
        path: 'roles',
        loadChildren: () => import('./views/roles/roles.routes').then(m => m.rolesRoutes)
      },
      {
        path: 'permissions',
        loadChildren: () => import('./views/permissions/permissions.routes').then(m => m.permissionsRoutes)
      },
      {
        path: 'resources',
        loadChildren: () => import('./views/resources/resources.routes').then(m => m.resourcesRoutes)
      },
      {
        path: 'audit-logs',
        loadChildren: () => import('./views/audit-logs/audit-logs.routes').then(m => m.auditLogsRoutes)
      },
    ]
  },

  // Catch-all
  { path: '**', redirectTo: '' }
];
```

- [ ] **Step 2: Commit**

```bash
git add projects/kubee-admin/src/app/app.routes.ts
git commit -m "feat(admin): wire all routes with AdminLayout shell"
```

---

### Task 14: Verify build compiles

- [ ] **Step 1: Run the kubee-admin build**

```bash
npx ng build kubee-admin --configuration development
```

Expected: Build succeeds with no errors. Warnings about unused variables are acceptable.

If build fails with "Cannot find module 'ngx-permissions'" — check that `ngx-permissions` was fully removed from `auth.service.ts` (Task 3).

If build fails with a missing icon (e.g., `AppWindow`) — replace the icon with `LayoutGrid` from lucide-angular in `admin-layout.ts`.

If build fails with "Cannot find module 'kubee-ui'" — run `npx ng build kubee-ui` first, then retry.

- [ ] **Step 2: Commit if there were any fixups**

```bash
git add -A
git commit -m "fix(admin): resolve build errors from icon or module imports"
```
