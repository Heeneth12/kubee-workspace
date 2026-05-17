import { Inject, Injectable } from '@angular/core';
import { HttpService } from '../http-svc/http.service';
import { KUBEE_CONFIG, KubeeConfig } from '../../config/kubee-config.token';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  private readonly BASE_URL: string;
  private readonly AUTH_BASE_URL: string;
  private readonly USER_REQUEST_BASE_URL: string;

  constructor(
    private httpService: HttpService,
    @Inject(KUBEE_CONFIG) private config: KubeeConfig
  ) {
    this.BASE_URL = this.config.authUrl;
    this.AUTH_BASE_URL = this.BASE_URL + '/api/v1/auth';
    this.USER_REQUEST_BASE_URL = this.BASE_URL + '/api/v1/userrequests';
  }

  signIn(request: any, successfn: any, errorfn: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/signin`, request, successfn, errorfn);
  }

  initUser(success: any, error: any) {
    return this.httpService.getHttp(`${this.AUTH_BASE_URL}/user/init`, success, error);
  }

  refreshToken(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/refresh`, request, success, error);
  }

  validateToken(success: any, error: any) {
    return this.httpService.getHttp(`${this.AUTH_BASE_URL}/validate`, success, error);
  }

  signInWithGoogle(request: any, successfn: any, errorfn: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/google`, request, successfn, errorfn);
  }

  createTenant(filter: any, successfn: any, errorfn: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/register`, filter, successfn, errorfn);
  }

  verifyTenant(tenantId: any, otp: any, successfn: any, errorfn: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/verifyTenant?tenantId=${tenantId}&otp=${otp}`, null, successfn, errorfn);
  }

  signOut(success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/signout`, null, success, error);
  }

  forgotPassword(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/forgot-password`, request, success, error);
  }

  resetPassword(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/reset-password`, request, success, error);
  }

  resendOtp(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/resend-otp`, request, success, error);
  }

  createRequest(type: 'app' | 'mkt', request: any, success: any, error: any) {
    const url = type == 'app' ? `${this.USER_REQUEST_BASE_URL}` : `${this.USER_REQUEST_BASE_URL}/mkt`;
    return this.httpService.postHttp(url, request, success, error);
  }

  getRequestById(userReqUuid: any, success: any, error: any) {
    return this.httpService.getHttp(`${this.USER_REQUEST_BASE_URL}/${userReqUuid}`, success, error);
  }

  updateRequest(userReqUuid: any, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.USER_REQUEST_BASE_URL}/${userReqUuid}`, request, success, error);
  }

  getRequestsWithPagination(tenantUuid: any, page: any, size: any, sortBy: any, sortDir: any, success: any, error: any) {
    return this.httpService.getHttp(`${this.USER_REQUEST_BASE_URL}?tenantUuid=${tenantUuid}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`, success, error);
  }
}