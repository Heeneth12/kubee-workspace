import { Component, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReportPage } from './report-page';
import { PaymentModeReport, PaymentModeRow, ReportPeriod } from './reports.models';
import { ReportsService } from './reports.service';
import { label } from '../orders/order-utils';

@Component({
  selector: 'app-payment-modes-report',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  template: `
    <div class="p-6 space-y-6">
      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {
      @if (cash(r); as c) {
      <div class="ez-surface p-5 max-w-sm" [class.opacity-60]="isLoading">
        <p class="ez-micro-label mb-2">Cash expected in the drawer</p>
        <p class="text-ez-2xl font-medium text-ez-heading">{{ c.netAmount | currency:'INR' }}</p>
        <p class="text-ez-xs text-ez-muted mt-1">Cash received minus cash refunds, from sales only</p>
      </div>
      }

      <section class="border border-ez-border overflow-x-auto" [class.opacity-60]="isLoading">
        <table class="w-full text-ez-base">
          <thead class="bg-ez-ash text-left">
            <tr>
              <th class="px-4 py-3 ez-micro-label">Mode</th>
              <th class="px-4 py-3 ez-micro-label text-right">Payments</th>
              <th class="px-4 py-3 ez-micro-label text-right">Received</th>
              <th class="px-4 py-3 ez-micro-label text-right">Refunds</th>
              <th class="px-4 py-3 ez-micro-label text-right">Refunded</th>
              <th class="px-4 py-3 ez-micro-label text-right">Net</th>
              <th class="px-4 py-3 ez-micro-label w-48">Share of net</th>
            </tr>
          </thead>
          <tbody>
            @for (row of r.methods; track row.method) {
            <tr class="border-t border-ez-border">
              <td class="px-4 py-3 font-medium text-ez-heading">{{ label(row.method) }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-ez-secondary">{{ row.paymentCount }}</td>
              <td class="px-4 py-3 text-right tabular-nums">{{ row.paymentAmount | currency:'INR' }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-ez-secondary">{{ row.refundCount }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-ez-secondary">{{ row.refundAmount ? '-' : '' }}{{ row.refundAmount | currency:'INR' }}</td>
              <td class="px-4 py-3 text-right tabular-nums font-medium text-ez-heading">{{ row.netAmount | currency:'INR' }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-ez-ash rounded-full overflow-hidden">
                    <div class="h-full bg-ez-primary rounded-full" [style.width.%]="share(row, r.total)"></div>
                  </div>
                  <span class="w-10 text-right text-ez-xs text-ez-muted tabular-nums">{{ share(row, r.total) | number:'1.0-0' }}%</span>
                </div>
              </td>
            </tr>
            } @empty {
            <tr><td colspan="7" class="px-4 py-10 text-center text-ez-sm text-ez-muted">No payments in this period.</td></tr>
            }
          </tbody>
          @if (r.methods.length) {
          <tfoot>
            <tr class="border-t-2 border-ez-border bg-ez-ash font-medium text-ez-heading">
              <td class="px-4 py-3">Total</td>
              <td class="px-4 py-3 text-right tabular-nums">{{ r.total.paymentCount }}</td>
              <td class="px-4 py-3 text-right tabular-nums">{{ r.total.paymentAmount | currency:'INR' }}</td>
              <td class="px-4 py-3 text-right tabular-nums">{{ r.total.refundCount }}</td>
              <td class="px-4 py-3 text-right tabular-nums">{{ r.total.refundAmount ? '-' : '' }}{{ r.total.refundAmount | currency:'INR' }}</td>
              <td class="px-4 py-3 text-right tabular-nums">{{ r.total.netAmount | currency:'INR' }}</td>
              <td></td>
            </tr>
          </tfoot>
          }
        </table>
      </section>
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading report...</p>
      }
    </div>
  `
})
export class PaymentModesReportComponent extends ReportPage<PaymentModeReport> {
  private reports = inject(ReportsService);
  readonly label = label;

  protected fetch(period: ReportPeriod) {
    return this.reports.paymentModes(period);
  }

  cash(report: PaymentModeReport): PaymentModeRow | undefined {
    return report.methods.find(m => m.method === 'CASH');
  }

  share(row: PaymentModeRow, total: PaymentModeRow): number {
    return total.netAmount > 0 ? Math.max(0, row.netAmount / total.netAmount * 100) : 0;
  }
}
