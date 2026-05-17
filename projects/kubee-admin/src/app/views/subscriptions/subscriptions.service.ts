import { Injectable } from '@angular/core';
import { HttpService } from 'kubee-ui';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private static BASE_URL = environment.authUrl;
  private static URL = `${SubscriptionsService.BASE_URL}/api/v1/subscriptions`;

  constructor(private http: HttpService) { }

  // TENANT SUBSCRIPTION MANAGEMENT

  subscribeTenant(tenantId: number, planId: number, success: any, error: any) {
    return this.http.postHttp(`${SubscriptionsService.URL}/tenant/${tenantId}/plan/${planId}`, {}, success, error);
  }

  getCurrentSubscription(tenantId: number, success: any, error: any) {
    return this.http.getHttp(`${SubscriptionsService.URL}/tenant/${tenantId}/current`, success, error);
  }

  cancelSubscription(subscriptionId: number, success: any, error: any) {
    return this.http.putHttp(`${SubscriptionsService.URL}/${subscriptionId}/cancel`, {}, success, error);
  }

  // SUBSCRIPTION PLAN MANAGEMENT

  getAllPlans(page: number = 0, size: number = 10, success: any, error: any) {
    return this.http.getHttp(`${SubscriptionsService.URL}/plan/all?page=${page}&size=${size}`, success, error);
  }

  getActivePlans(page: number = 0, size: number = 10, success: any, error: any) {
    return this.http.getHttp(`${SubscriptionsService.URL}/plan/active?page=${page}&size=${size}`, success, error);
  }

  getPlanById(id: number, success: any, error: any) {
    return this.http.getHttp(`${SubscriptionsService.URL}/${id}`, success, error);
  }

  createPlan(data: any, success: any, error: any) {
    return this.http.postHttp(`${SubscriptionsService.URL}`, data, success, error);
  }

  editPlan(planId: number, data: any, success: any, error: any) {
    return this.http.putHttp(`${SubscriptionsService.URL}/plan/${planId}`, data, success, error);
  }

  deletePlan(planId: number, success: any, error: any) {
    return this.http.deleteHttp(`${SubscriptionsService.URL}/plan/${planId}`, success, error);
  }

  disablePlan(planId: number, success: any, error: any) {
    return this.http.patchHttp(`${SubscriptionsService.URL}/plan/${planId}/disable`, {}, success, error);
  }
}