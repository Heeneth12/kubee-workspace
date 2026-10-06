import { Component, inject } from '@angular/core';
import { CurrencyPipe, formatCurrency } from '@angular/common';
import { ReportPage } from './report-page';
import { HourlySalesReport, ReportPeriod } from './reports.models';
import { ReportsService } from './reports.service';
import { ColumnChartComponent, ColumnPoint } from './column-chart.component';

/** Busy hours: completed orders per hour of the day, summed over the period. */
@Component({
  selector: 'app-hourly-report',
  standalone: true,
  imports: [CurrencyPipe, ColumnChartComponent],
  template: `
    <div class="p-6 space-y-6">
      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {
      <section [class.opacity-60]="isLoading">
        <h2 class="text-ez-lg font-medium text-ez-heading mb-1">Orders by hour of day</h2>
        <p class="text-ez-xs text-ez-muted mb-4">
          @if (busiest(r); as b) { Busiest: {{ hourLabel(b.hour) }} with {{ b.orders }} orders. }
          Hover an hour for its sales.
        </p>
        <app-column-chart [points]="points(r)" [axisLabels]="axis" [format]="plain" ariaLabel="Completed orders per hour of day"></app-column-chart>
      </section>

      <section class="border border-ez-border overflow-x-auto">
        <table class="w-full text-ez-base">
          <thead class="bg-ez-ash text-left">
            <tr>
              <th class="px-4 py-3 ez-micro-label">Hour</th>
              <th class="px-4 py-3 ez-micro-label text-right">Orders</th>
              <th class="px-4 py-3 ez-micro-label text-right">Avg. order</th>
              <th class="px-4 py-3 ez-micro-label text-right">Net sales</th>
            </tr>
          </thead>
          <tbody>
            @for (h of activeHours(r); track h.hour) {
            <tr class="border-t border-ez-border tabular-nums">
              <td class="px-4 py-2.5 text-ez-heading">{{ hourLabel(h.hour) }} – {{ hourLabel(h.hour + 1) }}</td>
              <td class="px-4 py-2.5 text-right">{{ h.orders }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">{{ h.averageOrderValue | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right font-medium text-ez-heading">{{ h.netSales | currency:'INR' }}</td>
            </tr>
            } @empty {
            <tr><td colspan="4" class="px-4 py-10 text-center text-ez-sm text-ez-muted">No completed orders in this period.</td></tr>
            }
          </tbody>
        </table>
      </section>
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading report...</p>
      }
    </div>
  `
})
export class HourlyReportComponent extends ReportPage<HourlySalesReport> {
  private reports = inject(ReportsService);
  readonly axis = ['12 am', '6 am', '12 pm', '6 pm', '11 pm'];
  readonly plain = (value: number) => String(value);
  private pointsFor: HourlySalesReport | null = null;
  private cached: ColumnPoint[] = [];

  protected fetch(period: ReportPeriod) {
    return this.reports.hourly(period);
  }

  points(report: HourlySalesReport): ColumnPoint[] {
    if (this.pointsFor !== report) {
      this.pointsFor = report;
      this.cached = report.hours.map(h => ({
        key: String(h.hour),
        value: h.orders,
        tooltip: [
          `${this.hourLabel(h.hour)} – ${this.hourLabel(h.hour + 1)}`,
          `${h.orders} ${h.orders === 1 ? 'order' : 'orders'} · ${formatCurrency(h.netSales, 'en-US', '₹', 'INR')}`,
        ],
      }));
    }
    return this.cached;
  }

  activeHours(report: HourlySalesReport) {
    return report.hours.filter(h => h.orders > 0);
  }

  busiest(report: HourlySalesReport) {
    return report.hours.reduce<HourlySalesReport['hours'][number] | null>(
      (best, h) => h.orders > 0 && (!best || h.orders > best.orders) ? h : best, null);
  }

  /** 0 -> "12 am", 13 -> "1 pm", 24 -> "12 am". */
  hourLabel(hour: number): string {
    const h = hour % 24;
    return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'am' : 'pm'}`;
  }
}
