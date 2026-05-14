import { Injectable } from '@angular/core';
import { CommonService } from '../service/common/common.service';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { UserInitResponse } from '../models/Init-response.model';
import { DrawerService } from 'kubee-ui';
import { NgxPermissionsService } from 'ngx-permissions';
import { ForgotPasswordModel, ResendOtpModel, ResetPasswordModel } from '../../views/auth/auth.model';
import { BannerLoaderService } from '../components/banner-loader/banner-loader.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<UserInitResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private commonService: CommonService, private router: Router, private bannerLoaderSvc: BannerLoaderService, private drawerSvc: DrawerService, private permissionsService: NgxPermissionsService) { }

  login(payload: any, success: (res: any) => void, error: (err: any) => void) {
    this.bannerLoaderSvc.show();
    this.commonService.signIn(payload,
      (res: any) => {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);

        this.fetchUserInit().subscribe({
          next: (userInitData) => {
            // Navigate to root - RedirectGuard will handle user type-based routing
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
        error(err)
      }
    );
  }

  fetchUserInit(): Observable<UserInitResponse> {
    return this.commonService.getUserInit().pipe(
      map((res: any) => res.data as UserInitResponse),
      tap((userData) => {
        sessionStorage.setItem('tenantId', userData.tenantId.toString());
        sessionStorage.setItem('userId', userData.id.toString());
        sessionStorage.setItem('currentUserUuid', userData.userUuid);
        this.loadPermissionsIntoStore(userData);
        this.currentUserSubject.next(userData);
      })
    );
  }

  loginWithGoogle(idToken: string, success: (res: any) => void, error: (err: any) => void) {
    const payload = {
      idToken: idToken,
      appKey: "EZH_INV_001"
    };
    // Use the new method in CommonService
    this.commonService.signInWithGoogle(payload,
      (res: any) => {
        //Save Tokens
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);

        //Fetch User Details & Navigate
        this.fetchUserInit().subscribe({
          next: (userInitData) => {
            // Navigate to root - RedirectGuard will handle user type-based routing
            this.router.navigate(['/']).then(() => {
              success(res);
            });
          },
          error: (err) => {
            this.logout();
            error(err);
          }
        });
      },
      (err: any) => error(err)
    );
  }

  public loadPermissionsIntoStore(user: UserInitResponse) {
    const allPermissions: string[] = [];
    user.userApplications.forEach(app => {
      if (app.modulePrivileges) {
        // Extract all arrays from the modulePrivileges object and flatten them
        Object.values(app.modulePrivileges).forEach((perms: any) => {
          if (Array.isArray(perms)) {
            allPermissions.push(...perms);
          }
        });
      }
    });
    // This tells ngx-permissions what the user can do
    this.permissionsService.loadPermissions(allPermissions);
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    // This handles the nesting logic once and for all
    return user.userApplications.some(app =>
      Object.values(app.modulePrivileges || {}).some((perms: any) =>
        perms.includes(permission)
      )
    );
  }

  logout() {
    localStorage.clear();
    this.drawerSvc.close();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
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

  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  // Refactored to be cleaner for RxJS pipes
  validateToken(): Observable<boolean> {
    this.bannerLoaderSvc.show();
    return new Observable<boolean>((observer) => {
      this.commonService.validateToken(
        (res: any) => {
          observer.next(true);
          observer.complete();
          this.bannerLoaderSvc.hide();
        },
        (err: any) => {
          this.logout(); // Auto logout on invalid token
          observer.next(false);
          observer.complete();
          this.bannerLoaderSvc.hide();
        }
      );
    });
  }

  isLoggedIn(): Observable<boolean> {
    const token = this.getAccessToken();
    if (!token) {
      return of(false);
    }
    // (Optional optimization, remove if you want strict server validation every route change)
    if (this.currentUserSubject.value) {
      return of(true);
    }

    return this.validateToken();
  }

  getCurrentUserValue(): UserInitResponse | null {
    return this.currentUserSubject.value;
  }
}