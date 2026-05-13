import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static URL = `${SubscriptionsService.BASE_URL}/api/v1/admin/subscriptions`;

  constructor(private http: HttpService) {}

  getAll(success: any, error: any) {
    return this.http.getHttp(SubscriptionsService.URL, success, error);
  }
  getById(id: number, success: any, error: any) {
    return this.http.getHttp(`${SubscriptionsService.URL}/${id}`, success, error);
  }
  create(data: any, success: any, error: any) {
    return this.http.postHttp(SubscriptionsService.URL, data, success, error);
  }
  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${SubscriptionsService.URL}/${id}`, data, success, error);
  }
  delete(id: number, success: any, error: any) {
    return this.http.deleteHttp(`${SubscriptionsService.URL}/${id}`, success, error);
  }
}
