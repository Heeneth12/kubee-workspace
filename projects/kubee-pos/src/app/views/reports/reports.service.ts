import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../catalog/catalog.models';
import {
  CancellationReport, GstReport, ItemSalesReport, ItemSalesSort, PaymentModeReport, ReportPeriod, SalesSummaryReport,
  ShiftReport, CategorySalesReport, HourlySalesReport, StaffSalesReport, ExportableReport, ExportFormat,
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
  /** Item sales rolled up to each item's current category. */
  categorySales(period: ReportPeriod): Observable<CategorySalesReport> {
    return this.get('/categories', period);
  }
  /** Busy hours: all 24 hours of the day, summed over the period. */
  hourly(period: ReportPeriod): Observable<HourlySalesReport> {
    return this.get('/hourly', period);
  }
  /** Per staff member (user uuid). */
  staff(period: ReportPeriod): Observable<StaffSalesReport> {
    return this.get('/staff', period);
  }

  /**
   * CSV / Excel file of a report, same filters as the report. CSV puts several tables one after another;
   * Excel gives each its own sheet. Named like the server does: <report>_<from>_<to>.<ext>
   * (the browser can't read Content-Disposition cross-origin unless the backend exposes it).
   */
  exportReport(report: ExportableReport, format: ExportFormat, period: ReportPeriod,
               extra: { categoryUuid?: string; sort?: string } = {}): Observable<{ blob: Blob; fileName: string }> {
    let params = new HttpParams().set('format', format);
    for (const [key, value] of Object.entries({ ...period, ...extra })) {
      if (value) params = params.set(key, value);
    }
    return this.http.get(`${this.base}/${report}/export`, { params, responseType: 'blob' }).pipe(
      map(blob => ({ blob, fileName: `${report}_${period.from}_${period.to}.${format}` })),
    );
  }

  /** GSTR-1 JSON for one month (yyyy-MM), for the GST offline tool. Raw JSON, not the usual envelope. */
  gstr1(month: string): Observable<{ json: Record<string, unknown>; fileName: string }> {
    return this.http.get<Record<string, unknown>>(`${this.base}/gstr1`, { params: { month } }).pipe(
      map(json => ({ json, fileName: `GSTR1_${json['gstin'] ?? ''}_${json['fp'] ?? month}.json` })),
    );
  }

  /** Cash-drawer history: shifts opened in the period, expected vs counted cash. */
  shifts(period: ReportPeriod): Observable<ShiftReport> {
    return this.get('/shifts', period);
  }

  private get<T>(path: string, query: ReportPeriod & { categoryUuid?: string; sort?: string }): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<ApiResponse<T>>(`${this.base}${path}`, { params }).pipe(map(res => res.data as T));
  }
}
