import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private static BASE_URL = environment.authUrl;
  // TODO: fill exact paths from Swagger
  private static STATS_URL = `${DashboardService.BASE_URL}/api/v1/admin/dashboard/stats`;

  constructor(private http: HttpService) {}

  getStats(success: any, error: any) {
    return this.http.getHttp(DashboardService.STATS_URL, success, error);
  }
}
