import { Injectable } from '@angular/core';
import { HttpService } from 'kubee-ui';
import { environment } from '../../../environments/environment.development';

export interface PlanSummary {
  id: number;
  applicationId: number;
  name: string;
  type: 'LIFETIME' | 'MONTHLY' | 'YEARLY';
  price: number;
  durationDays: number;
  maxUsers: number | null;
}

export interface PlanRequest {
  subscriptionId: number;
  tenantId: number;
  tenantName: string;
  tenantCode: string;
  requestedPlan: PlanSummary;
  currentPlan: PlanSummary | null;
  currentPlanEndsAt: string | null;
  requestedAt: string;
}

/** Tenants' pending plan changes. Activating replaces the tenant's current plan right away. */
@Injectable({ providedIn: 'root' })
export class PlanRequestsService {
  private static SUBSCRIPTION_URL = environment.authUrl + '/api/v1/subscription';

  constructor(private http: HttpService) { }

  getOpenRequests(success: any, error: any) {
    return this.http.getHttp(`${PlanRequestsService.SUBSCRIPTION_URL}/requests`, success, error);
  }

  activate(request: PlanRequest, success: any, error: any) {
    return this.http.postHttp(
      `${PlanRequestsService.SUBSCRIPTION_URL}/tenant/${request.tenantId}/plan/${request.requestedPlan.id}`, {}, success, error);
  }

  reject(request: PlanRequest, success: any, error: any) {
    return this.http.putHttp(`${PlanRequestsService.SUBSCRIPTION_URL}/${request.subscriptionId}/cancel`, {}, success, error);
  }
}
