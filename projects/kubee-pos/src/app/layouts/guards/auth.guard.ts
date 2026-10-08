import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { UserInitResponse } from 'kubee-ui';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {

    // 1. First, check if token exists and is valid on server
    return this.authService.isLoggedIn().pipe(
      switchMap((isValid) => {
        if (!isValid) {
          // Token invalid or missing -> Redirect to Login
          return of(this.router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: route.url.join('/') } }));
        }

        // 2. Token is valid. Do we have the User Data in memory?
        const currentUser = this.authService.getCurrentUserValue();

        if (currentUser) {
          // Data exists -> Check Permissions immediately
          return of(this.checkPermissions(route, currentUser));
        } else {
          // Data missing (User refreshed page) -> Fetch Init Data first
          return this.authService.fetchUserInit().pipe(
            map((user) => {
              return this.checkPermissions(route, user);
            }),
            catchError(() => {
              // If Init fails (401/500), logout and redirect
              this.authService.logout();
              return of(this.router.createUrlTree(['/auth/login']));
            })
          );
        }
      })
    );
  }

  canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.canActivate(route);
  }

  private checkPermissions(route: ActivatedRouteSnapshot, user: UserInitResponse): boolean | UrlTree {
    const requiredModuleKey = route.data['moduleKey'] as string;
    const requiredPrivilegeKey = route.data['privilegeKey'] as string;

    const moduleOk = !requiredModuleKey || this.hasModuleAccess(user, requiredModuleKey);
    const privilegeOk = !requiredPrivilegeKey || this.hasPrivilege(user, requiredPrivilegeKey);

    if (moduleOk && privilegeOk) {
      return true;
    }

    // Access Denied
    return this.router.createUrlTree(['/forbidden']);
  }

  /**
   * Helper to parse the UserInitResponse structure
   */
  public hasModuleAccess(user: UserInitResponse, moduleKey: string): boolean {
    if (!user.userApplications || user.userApplications.length === 0) {
      return false;
    }

    // Look through all applications assigned to the user
    return user.userApplications.some((app: any) => {
      // Check if modulePrivileges exists and has the specific key
      return app.modulePrivileges && Object.prototype.hasOwnProperty.call(app.modulePrivileges, moduleKey);
    });
  }

  public hasPrivilege(user: UserInitResponse, privilegeKey: string): boolean {
    return (user.userApplications || []).some((app: any) =>
      Object.values(app.modulePrivileges || {}).some((perms: any) =>
        Array.isArray(perms) && perms.includes(privilegeKey)
      )
    );
  }
}