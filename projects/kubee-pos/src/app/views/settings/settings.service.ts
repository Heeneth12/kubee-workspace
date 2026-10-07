import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../catalog/catalog.models';
import { AuthService } from '../../layouts/guards/auth.service';
import { Address, Integration, IntegrationRequest, Plan, Profile, Subscription, Tenant, TenantDetails } from './settings.models';

/** Business, profile, subscription and integration settings, all stored in ezauth. */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly api = environment.authUrl + '/api/v1';

  /** Mirrors ezauth's AccessService: the owner, or anyone holding a *_SETTINGS_EDIT privilege. */
  canEditSettings(): boolean {
    const user = this.authService.getCurrentUserValue();
    if (!user) return false;
    if (user.userRoles?.includes('SUPER_ADMIN')) return true;
    return (user.userApplications || []).some((app: any) =>
      Object.values(app.modulePrivileges || {}).some((perms: any) =>
        Array.isArray(perms) && perms.some((key: string) => key.endsWith('_SETTINGS_EDIT'))));
  }

  get tenantId(): number {
    return Number(this.authService.getCurrentUserValue()?.tenantId);
  }

  // ---------- business ----------
  getTenant(): Observable<Tenant> {
    return this.unwrap(this.http.get<ApiResponse<Tenant>>(`${this.api}/tenant/${this.tenantId}`));
  }
  saveDetails(details: TenantDetails, exists: boolean): Observable<unknown> {
    const url = `${this.api}/tenant/${this.tenantId}/details`;
    return this.unwrap(exists
      ? this.http.put<ApiResponse<unknown>>(url, details)
      : this.http.post<ApiResponse<unknown>>(url, details));
  }
  saveTenantAddress(address: Address): Observable<unknown> {
    const base = `${this.api}/tenant/${this.tenantId}/address`;
    return this.unwrap(address.id
      ? this.http.put<ApiResponse<unknown>>(`${base}/${address.id}`, address)
      : this.http.post<ApiResponse<unknown>>(base, address));
  }
  deleteTenantAddress(id: number): Observable<unknown> {
    return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.api}/tenant/${this.tenantId}/address/${id}`));
  }

  // ---------- profile ----------
  getProfile(): Observable<Profile> {
    return this.unwrap(this.http.get<ApiResponse<Profile>>(`${this.api}/user/me`));
  }
  saveUserAddress(userId: number, address: Address): Observable<unknown> {
    const base = `${this.api}/user/${userId}/address`;
    return this.unwrap(address.id
      ? this.http.put<ApiResponse<unknown>>(`${base}/${address.id}`, address)
      : this.http.post<ApiResponse<unknown>>(base, address));
  }
  deleteUserAddress(userId: number, id: number): Observable<unknown> {
    return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.api}/user/${userId}/address/${id}`));
  }

  // ---------- subscription ----------
  getCurrentSubscription(): Observable<Subscription> {
    return this.unwrap(this.http.get<ApiResponse<Subscription>>(`${this.api}/subscription/tenant/${this.tenantId}/current`));
  }
  getPendingRequest(): Observable<Subscription | null> {
    return this.unwrap(this.http.get<ApiResponse<Subscription | null>>(`${this.api}/subscription/tenant/${this.tenantId}/pending`));
  }
  getActivePlans(): Observable<Plan[]> {
    return this.unwrap(this.http.get<ApiResponse<Plan[]>>(`${this.api}/subscription/active`));
  }
  /** Returns ezauth's message, e.g. that the change waits for payment. */
  requestPlan(planId: number): Observable<string> {
    return this.http.post<ApiResponse<{ message?: string }>>(`${this.api}/subscription/tenant/${this.tenantId}/plan/${planId}`, {})
      .pipe(map(res => res.data?.message ?? res.message));
  }
  cancelSubscription(subscriptionId: number): Observable<string> {
    return this.http.put<ApiResponse<{ message?: string }>>(`${this.api}/subscription/${subscriptionId}/cancel`, {})
      .pipe(map(res => res.data?.message ?? res.message));
  }

  // ---------- integrations ----------
  getIntegrations(): Observable<Integration[]> {
    return this.unwrap(this.http.get<ApiResponse<Integration[]>>(`${this.api}/integration`));
  }
  createIntegration(body: IntegrationRequest): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.api}/integration`, body));
  }
  updateIntegration(id: number, body: Partial<IntegrationRequest>): Observable<unknown> {
    return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.api}/integration/${id}/update`, body));
  }
  toggleIntegration(id: number): Observable<unknown> {
    return this.unwrap(this.http.patch<ApiResponse<unknown>>(`${this.api}/integration/${id}/toggle`, {}));
  }
  deleteIntegration(id: number): Observable<unknown> {
    return this.unwrap(this.http.delete<ApiResponse<unknown>>(`${this.api}/integration/${id}`));
  }

  private unwrap<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map(res => res.data as T));
  }
}
