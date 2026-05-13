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
