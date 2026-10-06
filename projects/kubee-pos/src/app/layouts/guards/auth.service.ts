import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CommonService, DrawerService, UserInitResponse } from 'kubee-ui';
import { NgxPermissionsService } from 'ngx-permissions';
import { BannerLoaderService } from '../components/banner-loader/banner-loader.service';
import { ShiftService } from '../../views/shifts/shift.service';
import { StaffDirectoryService } from '../../views/shared/staff-directory.service';
import { ForgotPasswordModel, ResendOtpModel, ResetPasswordModel } from '../../views/auth/auth.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<UserInitResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private commonService: CommonService, private router: Router, private bannerLoaderSvc: BannerLoaderService, private drawerSvc: DrawerService, private permissionsService: NgxPermissionsService, private shiftService: ShiftService, private staffDirectory: StaffDirectoryService) { }

  login(payload: any, success: (res: any) => void, error: (err: any) => void) {
    this.bannerLoaderSvc.show();
    this.commonService.signIn(payload,
      (res: any) => {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);

        this.fetchUserInit().subscribe({
          next: () => {
            // Navigate to root - RedirectGuard will route to the POS terminal
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
    return new Observable((observer) => {
      this.commonService.initUser(
        (res: any) => {
          const userData: UserInitResponse = res.data;
          sessionStorage.setItem('tenantId', userData.tenantId.toString());
          sessionStorage.setItem('userId', userData.id.toString());
          sessionStorage.setItem('currentUserUuid', userData.userUuid);
          this.currentUserSubject.next(userData);
          this.loadPermissionsIntoStore(userData);
          observer.next(userData);
          observer.complete();
        },
        (err: any) => { observer.error(err); }
      );
    });
  }

  loginWithGoogle(idToken: string, success: (res: any) => void, error: (err: any) => void) {
    const payload = { idToken, appKey: environment.appKey };
    this.commonService.signInWithGoogle(payload,
      (res: any) => {
        localStorage.setItem('access_token', res.data.accessToken);
        localStorage.setItem('refresh_token', res.data.refreshToken);

        this.fetchUserInit().subscribe({
          next: () => {
            // Navigate to root - RedirectGuard will route to the POS terminal
            this.router.navigate(['/']).then(() => success(res));
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

  forgotPassword(payload: ForgotPasswordModel, success: (res: any) => void, error: (err: any) => void) {
    this.commonService.forgotPassword(payload, success, error);
  }

  resendOtp(payload: ResendOtpModel, success: (res: any) => void, error: (err: any) => void) {
    this.commonService.resendOtp(payload, success, error);
  }

  resetPassword(payload: ResetPasswordModel, success: (res: any) => void, error: (err: any) => void) {
    this.commonService.resetPassword(payload, success, error);
  }

  public loadPermissionsIntoStore(user: UserInitResponse) {
    const allPermissions: string[] = [];
    user.userApplications.forEach(app => {
      if (app.modulePrivileges) {
        Object.values(app.modulePrivileges).forEach((perms: any) => {
          if (Array.isArray(perms)) {
            allPermissions.push(...perms);
          }
        });
      }
    });
    this.permissionsService.loadPermissions(allPermissions);
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;
    return user.userApplications.some(app =>
      Object.values(app.modulePrivileges || {}).some((perms: any) =>
        perms.includes(permission)
      )
    );
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear(); // drop the previous user's ids
    this.drawerSvc.close();
    this.shiftService.reset();
    this.staffDirectory.reset();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getAccessToken() {
    return localStorage.getItem('access_token');
  }

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  }

  validateToken(): Observable<boolean> {
    this.bannerLoaderSvc.show();
    return new Observable<boolean>((observer) => {
      this.commonService.validateToken(
        () => {
          observer.next(true);
          observer.complete();
          this.bannerLoaderSvc.hide();
        },
        () => {
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
    if (this.currentUserSubject.value) {
      return of(true);
    }
    return this.validateToken();
  }

  getCurrentUserValue(): UserInitResponse | null {
    return this.currentUserSubject.value;
  }
}
