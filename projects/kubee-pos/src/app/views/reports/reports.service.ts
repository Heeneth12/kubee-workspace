import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../catalog/catalog.models';
import {
  CancellationReport, GstReport, ItemSalesReport, ItemSalesSort, PaymentModeReport, ReportPeriod, SalesSummaryReport,
} from './reports.models';

/** Kubee POS reports API (read-only). Every report takes an inclusive from/to period of at most 366 days. */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.devUrl + '/api/v1/reports';

  salesSummary(period: ReportPeriod): Observable<SalesSummaryReport> {
    return this.get('/sales-summary', period);
  }
  paymentModes(period: ReportPeriod): Observable<PaymentModeReport> {
    return this.get('/payment-modes', period);
  }
  /** categoryUuid: items currently in that category; sort: best sellers by value (default) or quantity. */
  itemSales(period: ReportPeriod, categoryUuid?: string, sort?: ItemSalesSort): Observable<ItemSalesReport> {
    return this.get('/items', { ...period, categoryUuid, sort });
  }
  gst(period: ReportPeriod): Observable<GstReport> {
    return this.get('/gst', period);
  }
  cancellations(period: ReportPeriod): Observable<CancellationReport> {
    return this.get('/cancellations', period);
  }

  private get<T>(path: string, query: ReportPeriod & { categoryUuid?: string; sort?: string }): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<ApiResponse<T>>(`${this.base}${path}`, { params }).pipe(map(res => res.data as T));
  }
}
