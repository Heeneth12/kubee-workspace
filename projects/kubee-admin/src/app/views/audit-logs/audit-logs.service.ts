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
