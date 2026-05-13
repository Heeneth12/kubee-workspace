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