import { Injectable } from '@angular/core';
import { HttpService } from 'kubee-ui';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL_USER_REQUESTS = `${AuditLogsService.BASE_URL}/api/v1/userrequests`;

  constructor(private http: HttpService) { }

  getUserRequests(
    page?: number,
    size?: number,
    success?: any,
    error?: any
  ) {
    return this.http.getHttp(
      `${AuditLogsService.URL_USER_REQUESTS}?page=${page}&size=${size}`,
      success,
      error
    );
  }

  getUserRequestById(
    userReqUuid?: string,
    success?: any,
    error?: any
  ) {
    return this.http.getHttp(
      `${AuditLogsService.URL_USER_REQUESTS}/${userReqUuid}`,
      success,
      error
    );
  }
}