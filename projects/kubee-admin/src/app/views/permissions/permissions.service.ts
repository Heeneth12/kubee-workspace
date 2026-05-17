import { Injectable } from '@angular/core';
import { HttpService } from 'kubee-ui';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${PermissionsService.BASE_URL}/api/v1/admin/permissions`;

  constructor(private http: HttpService) { }

  getAll(success: any, error: any) {
    return this.http.getHttp(PermissionsService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${PermissionsService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(PermissionsService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${PermissionsService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${PermissionsService.URL}/${id}`, success, error);
  }
}
