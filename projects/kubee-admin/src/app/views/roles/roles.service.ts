import { Injectable } from '@angular/core';
import { HttpService } from 'kubee-ui';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${RolesService.BASE_URL}/api/v1/admin/roles`;

  constructor(private http: HttpService) { }

  getAll(success: any, error: any) {
    return this.http.getHttp(RolesService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${RolesService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(RolesService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${RolesService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${RolesService.URL}/${id}`, success, error);
  }
}
