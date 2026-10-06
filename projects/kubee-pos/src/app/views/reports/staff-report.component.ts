import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ReportPage } from './report-page';
import { ReportPeriod, StaffSalesReport } from './reports.models';
import { ReportsService } from './reports.service';

/** Per staff member: orders completed, money received / refunded, and what they cancelled. */
@Component({
  selector: 'app-staff-report',
  standalone: true,
  imports: [CurrencyPipe],
  template: `
    <div class="p-6 space-y-4">
      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {
      <section class="border border-ez-border overflow-x-auto" [class.opacity-60]="isLoading">
        <table class="w-full text-ez-base">
          <thead class="bg-ez-ash text-left">
            <tr>
              <th class="px-4 py-3 ez-micro-label">Staff</th>
              <th class="px-4 py-3 ez-micro-label text-right">Orders</th>
              <th class="px-4 py-3 ez-micro-label text-right">Net sales</th>
              <th class="px-4 py-3 ez-micro-label text-right">Discounts given</th>
              <th class="px-4 py-3 ez-micro-label text-right">Received</th>
              <th class="px-4 py-3 ez-micro-label text-right">Refunded</th>
              <th class="px-4 py-3 ez-micro-label text-right">Cancelled orders</th>
              <th class="px-4 py-3 ez-micro-label text-right">Cancelled bills</th>
            </tr>
          </thead>
          <tbody>
            @for (row of r.staff; track $index) {
            <tr class="border-t border-ez-border tabular-nums">
              <td class="px-4 py-2.5 font-medium text-ez-heading">{{ who(row.userUuid) }}</td>
              <td class="px-4 py-2.5 text-right">{{ row.completedOrders }}</td>
              <td class="px-4 py-2.5 text-right font-medium text-ez-heading">{{ row.netSales | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.discountAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">
                {{ row.paymentAmount | currency:'INR' }} <span class="text-ez-xs text-ez-muted">×{{ row.paymentCount }}</span>
              </td>
              <td class="px-4 py-2.5 text-right" [class]="row.refundAmount ? 'text-red-600' : 'text-ez-secondary'">
                {{ row.refundAmount | currency:'INR' }} <span class="text-ez-xs text-ez-muted">×{{ row.refundCount }}</span>
              </td>
              <td class="px-4 py-2.5 text-right" [class]="row.cancelledOrders ? 'text-red-600 font-medium' : 'text-ez-secondary'">{{ row.cancelledOrders }}</td>
              <td class="px-4 py-2.5 text-right" [class]="row.cancelledBills ? 'text-red-600 font-medium' : 'text-ez-secondary'">{{ row.cancelledBills }}</td>
            </tr>
            } @empty {
            <tr><td colspan="8" class="px-4 py-10 text-center text-ez-sm text-ez-muted">No staff activity in this period.</td></tr>
            }
          </tbody>
        </table>
      </section>
      <p class="text-ez-xs text-ez-muted">Orders are counted for the person who took them; payments and refunds for the person who recorded them.</p>
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading report...</p>
      }
    </div>
  `
})
export class StaffReportComponent extends ReportPage<StaffSalesReport> {
  private reports = inject(ReportsService);

  protected fetch(period: ReportPeriod) {
    return this.reports.staff(period);
  }
}
