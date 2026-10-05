import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResult } from '../catalog/catalog.models';
import { BillSearchParams, BillSummaryView, BillView, IssueBillRequest, ShareChannel } from './billing.models';

/** Kubee POS GST bills API. */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.devUrl + '/api/v1/bills';
  private readonly ordersBase = environment.devUrl + '/api/v1/orders';

  /** Same order again returns the same bill (safe to retry). */
  issueBill(body: IssueBillRequest): Observable<BillView> {
    return this.unwrap(this.http.post<ApiResponse<BillView>>(this.base, body));
  }
  getBill(uuid: string): Observable<BillView> {
    return this.unwrap(this.http.get<ApiResponse<BillView>>(`${this.base}/${uuid}`));
  }
  /** The order's current issued bill; 404 when it has none. */
  getOrderBill(orderUuid: string): Observable<BillView> {
    return this.unwrap(this.http.get<ApiResponse<BillView>>(`${this.ordersBase}/${orderUuid}/bill`));
  }
  searchBills(params: BillSearchParams = {}): Observable<PageResult<BillSummaryView>> {
    let query = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query = query.set(key, String(value));
    }
    return this.unwrap(this.http.get<ApiResponse<PageResult<BillSummaryView>>>(this.base, { params: query }));
  }
  /** Call after printing / reprinting; counts prints. */
  markPrinted(uuid: string): Observable<BillView> {
    return this.unwrap(this.http.post<ApiResponse<BillView>>(`${this.base}/${uuid}/print`, {}));
  }
  markShared(uuid: string, channel: ShareChannel): Observable<BillView> {
    return this.unwrap(this.http.post<ApiResponse<BillView>>(`${this.base}/${uuid}/share`, { channel }));
  }
  cancelBill(uuid: string, reason: string): Observable<BillView> {
    return this.unwrap(this.http.post<ApiResponse<BillView>>(`${this.base}/${uuid}/cancel`, { reason }));
  }

  private unwrap<T>(request: Observable<ApiResponse<T>>): Observable<T> {
    return request.pipe(map(res => res.data as T));
  }
}
