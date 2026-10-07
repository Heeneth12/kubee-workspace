import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { UserInitResponse } from 'kubee-ui';
import { AuthGuard } from './auth.guard';
import { PosModules, PosPrivileges } from './pos-permissions';

@Injectable({ providedIn: 'root' })
export class RedirectGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private authGuard: AuthGuard,
    private router: Router
  ) { }

  canActivate(): Observable<boolean | UrlTree> {
    // Check if user is logged in
    return this.authService.isLoggedIn().pipe(
      switchMap((isValid) => {
        if (!isValid) {
          // Not logged in -> redirect to login
          return of(this.router.createUrlTree(['/auth/login']));
        }

        // Get current user data
        const currentUser = this.authService.getCurrentUserValue();

        if (currentUser) {
          // User data exists -> redirect based on user type
          return of(this.redirectToLanding(currentUser));
        } else {
          // Fetch user data first
          return this.authService.fetchUserInit().pipe(
            map((user) => {
              return this.redirectToLanding(user);
            }),
            catchError(() => {
              // If fetch fails, logout and redirect to login
              this.authService.logout();
              return of(this.router.createUrlTree(['/auth/login']));
            })
          );
        }
      })
    );
  }

  // Terminal first for cashiers; otherwise the first section the user has access to
  private redirectToLanding(user: UserInitResponse): UrlTree {
    if (this.authGuard.hasPrivilege(user, PosPrivileges.ORDERS_CREATE)) {
      return this.router.createUrlTree(['/pos']);
    }
    const landings: [string, string][] = [
      ['/orders', PosModules.ORDERS],
      ['/bills', PosModules.BILLS],
      ['/catalog', PosModules.CATALOG],
      ['/reports', PosModules.REPORTS],
      ['/dashboard', PosModules.DASHBOARD],
    ];
    const landing = landings.find(([, moduleKey]) => this.authGuard.hasModuleAccess(user, moduleKey));
    return this.router.createUrlTree([landing ? landing[0] : '/forbidden']);
  }
}
