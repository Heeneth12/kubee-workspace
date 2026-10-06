import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResult } from '../catalog/catalog.models';
import {
  ChangeOrderLineRequest, CreateOrderRequest, DiscountRequest, OrderDetailsRequest, OrderLineRequest,
  OrderSearchParams, OrderSummaryView, OrderView, PaymentRequest, RefundRequest,
} from './orders.models';

/** Kubee POS orders & payments API. Every write returns the whole updated order. */
@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.devUrl + '/api/v1/orders';

  // ---------- orders ----------
  createOrder(body: CreateOrderRequest = {}): Observable<OrderView> {
    return this.unwrap(this.http.post<ApiResponse<OrderView>>(this.base, body));
  }
  searchOrders(params: OrderSearchParams = {}): Observable<PageResult<OrderSummaryView>> {
    let query = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') query = query.set(key, String(value));
    }
    return this.unwrap(this.http.get<ApiResponse<PageResult<OrderSummaryView>>>(this.base, { params: query }));
  }
  getOrder(uuid: string): Observable<OrderView> {
    return this.unwrap(this.http.get<ApiResponse<OrderView>>(`${this.base}/${uuid}`));
  }
  /** Full replace: omitted fields are cleared. */
  updateDetails(uuid: string, body: OrderDetailsRequest): Observable<OrderView> {
    return this.unwrap(this.http.put<ApiResponse<OrderView>>(`${this.base}/${uuid}/details`, body));
  }

  // ---------- lines ----------
  addLine(uuid: string, body: OrderLineRequest): Observable<OrderView> {
    return this.unwrap(this.http.post<ApiResponse<OrderView>>(`${this.base}/${uuid}/lines`, body));
  }
  /** Full replace: omitted discount / note are removed. */
  changeLine(uuid: string, lineUuid: string, body: ChangeOrderLineRequest): Observable<OrderView> {
    return this.unwrap(this.http.patch<ApiResponse<OrderView>>(`${this.base}/${uuid}/lines/${lineUuid}`, body));
  }
  removeLine(uuid: string, lineUuid: string): Observable<OrderView> {
    return this.unwrap(this.http.delete<ApiResponse<OrderView>>(`${this.base}/${uuid}/lines/${lineUuid}`));
  }

  // ---------- bill discount ----------
  setDiscount(uuid: string, body: DiscountRequest): Observable<OrderView> {
    return this.unwrap(this.http.put<ApiResponse<OrderView>>(`${this.base}/${uuid}/discount`, body));
  }
  removeDiscount(uuid: string): Observable<OrderView> {
    return this.unwrap(this.http.delete<ApiResponse<OrderView>>(`${this.base}/${uuid}/discount`));
  }

  // ---------- lifecycle ----------
  hold(uuid: string): Observable<OrderView> {
    return this.unwrap(this.http.post<ApiResponse<OrderView>>(`${this.base}/${uuid}/hold`, {}));
  }
  recall(uuid: string): Observable<OrderView> {
    return this.unwrap(this.http.post<ApiResponse<OrderView>>(`${this.base}/${uuid}/recall`, {}));
  }
  /** Only for an order with nothing due (total 0); paid orders complete themselves. */
  complete(uuid: string): Observable<OrderView> {
    return this.unwrap(this.http.post<ApiResponse<OrderView>>(`${this.base}/${uuid}/complete`, {}));
  }
  cancel(uuid: string, reason: string): Observable<OrderView> {
    return this.unwrap(this.http.post<ApiResponse<OrderView>>(`${this.base}/${uuid}/cancel`, { reason }));
  }

  // ---------- payments ----------
  addPayment(uuid: string, body: PaymentRequest): Observable<OrderView> {
    return this.unwrap(this.http.post<ApiResponse<OrderView>>(`${this.base}/${uuid}/payments`, body));
  }
  refund(uuid: string, paymentUuid: string, body: RefundRequest): Observable<OrderView> {
    return this.unwrap(this.http.post<ApiResponse<OrderView>>(`${this.base}/${uuid}/payments/${paymentUuid}/refund`, body));
  }

  private unwrap<T>(request: Observable<ApiResponse<T>>): Observable<T> {
    return request.pipe(map(res => res.data as T));
  }
}
