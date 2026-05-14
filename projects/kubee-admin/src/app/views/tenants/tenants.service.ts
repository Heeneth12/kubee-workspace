import { Injectable } from '@angular/core';
import { HttpService } from '../../layout/service/http-svc/http.service';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class TenantsService {

  private static BASE_URL = environment.authUrl;
  private static URL = `${TenantsService.BASE_URL}/api/v1/tenant`;

  constructor(private http: HttpService) {}

  getAllTenants(page: number, size: number, filter: any, success: any, error: any) {
    return this.http.postHttp(
      `${TenantsService.URL}/all?page=${page}&size=${size}`,
      filter,
      success,
      error
    );
  }

  getBulkTenants(ids: number[], success: any, error: any) {
    const query = ids.map(id => `ids=${id}`).join('&');

    return this.http.getHttp(
      `${TenantsService.URL}/bulk?${query}`,
      success,
      error
    );
  }

  getById(id: number, success: any, error: any) {
    return this.http.getHttp(
      `${TenantsService.URL}/${id}`,
      success,
      error
    );
  }

  update(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(
      `${TenantsService.URL}/${id}`,
      data,
      success,
      error
    );
  }

  getCurrentTenant(success: any, error: any) {
    return this.http.getHttp(
      `${TenantsService.URL}/current`,
      success,
      error
    );
  }

  toggleStatus(id: number, success: any, error: any) {
    return this.http.putHttp(
      `${TenantsService.URL}/${id}/toggle-status`,
      {},
      success,
      error
    );
  }

  createTenantDetails(id: number, data: any, success: any, error: any) {
    return this.http.postHttp(
      `${TenantsService.URL}/${id}/details`,
      data,
      success,
      error
    );
  }

  updateTenantDetails(id: number, data: any, success: any, error: any) {
    return this.http.putHttp(
      `${TenantsService.URL}/${id}/details`,
      data,
      success,
      error
    );
  }

  getTenantDetails(id: number, success: any, error: any) {
    return this.http.getHttp(
      `${TenantsService.URL}/${id}/details`,
      success,
      error
    );
  }

  createTenantAddress(id: number, data: any, success: any, error: any) {
    return this.http.postHttp(
      `${TenantsService.URL}/${id}/address`,
      data,
      success,
      error
    );
  }

  updateTenantAddress(
    id: number,
    addressId: number,
    data: any,
    success: any,
    error: any
  ) {
    return this.http.putHttp(
      `${TenantsService.URL}/${id}/address/${addressId}`,
      data,
      success,
      error
    );
  }

  deleteTenantAddress(
    id: number,
    addressId: number,
    success: any,
    error: any
  ) {
    return this.http.deleteHttp(
      `${TenantsService.URL}/${id}/address/${addressId}`,
      success,
      error
    );
  }

  getTenantBranches(id: number, success: any, error: any) {
    return this.http.getHttp(
      `${TenantsService.URL}/${id}/branches`,
      success,
      error
    );
  }

  getTenantBranchSummaries(id: number, success: any, error: any) {
    return this.http.getHttp(
      `${TenantsService.URL}/${id}/branches/summary`,
      success,
      error
    );
  }
}