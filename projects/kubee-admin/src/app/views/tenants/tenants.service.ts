import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${TenantsService.BASE_URL}/api/v1/admin/tenants`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(TenantsService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${TenantsService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(TenantsService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${TenantsService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${TenantsService.URL}/${id}`, success, error);
  }
}
