import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, formatCurrency, formatDate } from '@angular/common';
import { ReportPage } from './report-page';
import { ReportPeriod, SalesSummaryReport } from './reports.models';
import { ReportsService } from './reports.service';
import { ColumnChartComponent, ColumnPoint } from './column-chart.component';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, ColumnChartComponent],
  template: `
    <div class="p-6 space-y-8">
      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {
      <!-- Headline -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3" [class.opacity-60]="isLoading">
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Net sales</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.netSales | currency:'INR' }}</p>
          <p class="text-ez-xs text-ez-muted mt-1">{{ r.completedOrders }} completed {{ r.completedOrders === 1 ? 'order' : 'orders' }}</p>
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Net collected</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.netCollected | currency:'INR' }}</p>
          <p class="text-ez-xs text-ez-muted mt-1">Should be in the drawer / bank</p>
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Avg. order value</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.averageOrderValue | currency:'INR' }}</p>
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">GST charged</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.taxAmount | currency:'INR' }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sales breakdown -->
        <section class="border border-ez-border p-5 space-y-2 text-ez-sm">
          <h2 class="ez-micro-label mb-3">Sales</h2>
          <div class="flex justify-between text-ez-secondary"><span>Gross sales</span><span>{{ r.grossSales | currency:'INR' }}</span></div>
          <div class="flex justify-between text-ez-secondary"><span>Discounts</span><span>-{{ r.discountAmount | currency:'INR' }}</span></div>
          <div class="flex justify-between text-ez-secondary"><span>Taxable value</span><span>{{ r.taxableAmount | currency:'INR' }}</span></div>
          <div class="flex justify-between text-ez-secondary"><span>GST</span><span>{{ r.taxAmount | currency:'INR' }}</span></div>
          <div class="flex justify-between text-ez-secondary"><span>Round off</span><span>{{ r.roundOffAmount | currency:'INR' }}</span></div>
          <div class="flex justify-between font-medium text-ez-heading pt-2 border-t border-ez-border">
            <span>Net sales</span><span>{{ r.netSales | currency:'INR' }}</span>
          </div>
        </section>

        <!-- Money & exceptions -->
        <section class="border border-ez-border p-5 space-y-2 text-ez-sm">
          <h2 class="ez-micro-label mb-3">Collections</h2>
          <div class="flex justify-between text-ez-secondary"><span>Collected</span><span>{{ r.collected | currency:'INR' }}</span></div>
          <div class="flex justify-between text-ez-secondary"><span>Refunded</span><span>-{{ r.refunded | currency:'INR' }}</span></div>
          <div class="flex justify-between font-medium text-ez-heading pt-2 border-t border-ez-border">
            <span>Net collected</span><span>{{ r.netCollected | currency:'INR' }}</span>
          </div>
          <div class="flex justify-between text-ez-secondary pt-4"><span>Bills issued</span><span>{{ r.billsIssued }}</span></div>
          <div class="flex justify-between text-ez-secondary"><span>Bills cancelled</span><span>{{ r.billsCancelled }}</span></div>
          <div class="flex justify-between text-ez-secondary"><span>Orders cancelled</span><span>{{ r.cancelledOrders }}</span></div>
        </section>
      </div>

      <!-- Daily: chart for ranges, table always (the chart's accessible twin) -->
      @if (r.days.length && r.from !== r.to) {
      <section>
        <h2 class="text-ez-lg font-medium text-ez-heading mb-1">Net sales per day</h2>
        <p class="text-ez-xs text-ez-muted mb-4">Hover a day for its total. Days without sales are left empty.</p>
        <app-column-chart [points]="dailyPoints(r)" [axisLabels]="dailyAxis(r)" ariaLabel="Net sales per day"></app-column-chart>
      </section>
      }

      @if (r.days.length) {
      <section class="border border-ez-border overflow-x-auto">
        <table class="w-full text-ez-base">
          <thead class="bg-ez-ash text-left">
            <tr>
              <th class="px-4 py-3 ez-micro-label">Date</th>
              <th class="px-4 py-3 ez-micro-label text-right">Orders</th>
              <th class="px-4 py-3 ez-micro-label text-right">Avg. order</th>
              <th class="px-4 py-3 ez-micro-label text-right">GST</th>
              <th class="px-4 py-3 ez-micro-label text-right">Net sales</th>
            </tr>
          </thead>
          <tbody>
            @for (day of r.days; track day.date) {
            <tr class="border-t border-ez-border">
              <td class="px-4 py-2.5 text-ez-heading">{{ day.date | date:'EEE, d MMM y' }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums">{{ day.orders }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums text-ez-secondary">{{ day.averageOrderValue | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums text-ez-secondary">{{ day.taxAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums font-medium text-ez-heading">{{ day.netSales | currency:'INR' }}</td>
            </tr>
            }
          </tbody>
        </table>
      </section>
      } @else {
      <p class="text-ez-sm text-ez-muted">No completed orders in this period.</p>
      }
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading report...</p>
      }
    </div>
  `
})
export class SalesReportComponent extends ReportPage<SalesSummaryReport> {
  private reports = inject(ReportsService);

  private chartFor: SalesSummaryReport | null = null;
  private chartPoints: ColumnPoint[] = [];

  protected fetch(period: ReportPeriod) {
    return this.reports.salesSummary(period);
  }

  /** One column per calendar day; the API only returns days that had sales. Cached per report. */
  dailyPoints(report: SalesSummaryReport): ColumnPoint[] {
    if (this.chartFor === report) return this.chartPoints;
    const byDate = new Map(report.days.map(d => [d.date, d]));
    const points: ColumnPoint[] = [];
    const cursor = new Date(report.from + 'T00:00:00');
    const end = new Date(report.to + 'T00:00:00');
    while (cursor <= end) {
      const key = formatDate(cursor, 'yyyy-MM-dd', 'en-US');
      const day = byDate.get(key);
      const orders = day?.orders ?? 0;
      points.push({
        key,
        value: day?.netSales ?? 0,
        tooltip: [
          formatDate(cursor, 'EEE d MMM', 'en-US'),
          `${formatCurrency(day?.netSales ?? 0, 'en-US', '₹', 'INR')} · ${orders} ${orders === 1 ? 'order' : 'orders'}`,
        ],
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    this.chartFor = report;
    this.chartPoints = points;
    return points;
  }

  dailyAxis(report: SalesSummaryReport): string[] {
    const points = this.dailyPoints(report);
    const label = (p?: ColumnPoint) => p ? formatDate(p.key + 'T00:00:00', 'd MMM', 'en-US') : '';
    if (points.length < 3) return points.map(p => label(p));
    return [label(points[0]), label(points[Math.floor((points.length - 1) / 2)]), label(points[points.length - 1])];
  }
}
