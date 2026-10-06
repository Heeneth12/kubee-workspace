import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportPage } from './report-page';
import { CancellationReport, ReportPeriod } from './reports.models';
import { ReportsService } from './reports.service';
import { label } from '../orders/order-utils';

@Component({
  selector: 'app-cancellations-report',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterModule],
  template: `
    <div class="p-6 space-y-8">
      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" [class.opacity-60]="isLoading">
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Cancelled orders</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.cancelledOrderCount }}</p>
          <p class="text-ez-xs text-ez-muted mt-1">Worth {{ r.cancelledOrderValue | currency:'INR' }}</p>
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Cancelled bills</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.cancelledBillCount }}</p>
          <p class="text-ez-xs text-ez-muted mt-1">Worth {{ r.cancelledBillValue | currency:'INR' }}</p>
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Refunds</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.refundCount }}</p>
          <p class="text-ez-xs text-ez-muted mt-1">{{ r.refundAmount | currency:'INR' }} returned</p>
        </div>
      </div>

      <!-- Cancelled orders -->
      <section>
        <h2 class="text-ez-lg font-medium text-ez-heading mb-3">Cancelled orders</h2>
        <div class="border border-ez-border overflow-x-auto">
          <table class="w-full text-ez-base">
            <thead class="bg-ez-ash text-left">
              <tr>
                <th class="px-4 py-3 ez-micro-label">Token</th>
                <th class="px-4 py-3 ez-micro-label">Cancelled</th>
                <th class="px-4 py-3 ez-micro-label">By</th>
                <th class="px-4 py-3 ez-micro-label">Reason</th>
                <th class="px-4 py-3 ez-micro-label text-right">Items</th>
                <th class="px-4 py-3 ez-micro-label text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              @for (row of r.cancelledOrders; track row.orderUuid) {
              <tr class="border-t border-ez-border hover:bg-ez-ash cursor-pointer" [routerLink]="['/orders', row.orderUuid]">
                <td class="px-4 py-2.5 font-medium text-ez-heading">#{{ row.orderNumber }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">
                  {{ row.cancelledAt | date:'short' }}
                  <div class="text-ez-xs text-ez-muted">Created {{ row.createdAt | date:'shortTime' }}</div>
                </td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ who(row.cancelledBy) }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.reason }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums text-ez-secondary">{{ row.lineCount }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums font-medium text-ez-heading">{{ row.orderValue | currency:'INR' }}</td>
              </tr>
              } @empty {
              <tr><td colspan="6" class="px-4 py-8 text-center text-ez-sm text-ez-muted">No cancelled orders.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Cancelled bills -->
      <section>
        <h2 class="text-ez-lg font-medium text-ez-heading mb-3">Cancelled bills</h2>
        <div class="border border-ez-border overflow-x-auto">
          <table class="w-full text-ez-base">
            <thead class="bg-ez-ash text-left">
              <tr>
                <th class="px-4 py-3 ez-micro-label">Bill #</th>
                <th class="px-4 py-3 ez-micro-label">Token</th>
                <th class="px-4 py-3 ez-micro-label">Bill date</th>
                <th class="px-4 py-3 ez-micro-label">Cancelled</th>
                <th class="px-4 py-3 ez-micro-label">By</th>
                <th class="px-4 py-3 ez-micro-label">Reason</th>
                <th class="px-4 py-3 ez-micro-label text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              @for (row of r.cancelledBills; track row.billUuid) {
              <tr class="border-t border-ez-border hover:bg-ez-ash cursor-pointer" [routerLink]="['/bills', row.billUuid]">
                <td class="px-4 py-2.5 font-medium text-ez-heading">{{ row.billNumber }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">#{{ row.orderNumber }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.billDate | date:'short' }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.cancelledAt | date:'short' }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ who(row.cancelledBy) }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.reason }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums font-medium text-ez-heading">{{ row.billValue | currency:'INR' }}</td>
              </tr>
              } @empty {
              <tr><td colspan="7" class="px-4 py-8 text-center text-ez-sm text-ez-muted">No cancelled bills.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- Refunds -->
      <section>
        <h2 class="text-ez-lg font-medium text-ez-heading mb-3">Refunds</h2>
        <div class="border border-ez-border overflow-x-auto">
          <table class="w-full text-ez-base">
            <thead class="bg-ez-ash text-left">
              <tr>
                <th class="px-4 py-3 ez-micro-label">Token</th>
                <th class="px-4 py-3 ez-micro-label">Refunded</th>
                <th class="px-4 py-3 ez-micro-label">By</th>
                <th class="px-4 py-3 ez-micro-label">Mode</th>
                <th class="px-4 py-3 ez-micro-label">Reason</th>
                <th class="px-4 py-3 ez-micro-label text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              @for (row of r.refunds; track row.paymentUuid) {
              <tr class="border-t border-ez-border hover:bg-ez-ash cursor-pointer" [routerLink]="['/orders', row.orderUuid]">
                <td class="px-4 py-2.5 font-medium text-ez-heading">#{{ row.orderNumber }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.refundedAt | date:'short' }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ who(row.refundedBy) }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ label(row.method) }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.reason ?? '-' }}</td>
                <td class="px-4 py-2.5 text-right tabular-nums font-medium text-red-600">-{{ row.amount | currency:'INR' }}</td>
              </tr>
              } @empty {
              <tr><td colspan="6" class="px-4 py-8 text-center text-ez-sm text-ez-muted">No refunds.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading report...</p>
      }
    </div>
  `
})
export class CancellationsReportComponent extends ReportPage<CancellationReport> {
  private reports = inject(ReportsService);
  readonly label = label;

  protected fetch(period: ReportPeriod) {
    return this.reports.cancellations(period);
  }
}
