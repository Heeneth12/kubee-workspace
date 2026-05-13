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
