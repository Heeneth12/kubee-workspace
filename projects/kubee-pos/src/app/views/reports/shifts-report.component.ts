import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportPage } from './report-page';
import { ReportPeriod, ShiftReport } from './reports.models';
import { ReportsService } from './reports.service';

/** Cash-drawer history: shifts opened in the period, expected vs counted cash. */
@Component({
  selector: 'app-shifts-report',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterModule],
  template: `
    <div class="p-6 space-y-6">
      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3" [class.opacity-60]="isLoading">
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Shifts</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.shiftCount }}</p>
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Total short</p>
          <p class="text-ez-2xl font-medium" [class]="r.totalShort ? 'text-red-600' : 'text-ez-heading'">{{ r.totalShort | currency:'INR' }}</p>
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Total excess</p>
          <p class="text-ez-2xl font-medium" [class]="r.totalExcess ? 'text-amber-700' : 'text-ez-heading'">{{ r.totalExcess | currency:'INR' }}</p>
        </div>
      </div>

      <section class="border border-ez-border overflow-x-auto" [class.opacity-60]="isLoading">
        <table class="w-full text-ez-base">
          <thead class="bg-ez-ash text-left">
            <tr>
              <th class="px-4 py-3 ez-micro-label">Opened</th>
              <th class="px-4 py-3 ez-micro-label">Closed</th>
              <th class="px-4 py-3 ez-micro-label">By</th>
              <th class="px-4 py-3 ez-micro-label text-right">Opening</th>
              <th class="px-4 py-3 ez-micro-label text-right">Cash sales</th>
              <th class="px-4 py-3 ez-micro-label text-right">In / out</th>
              <th class="px-4 py-3 ez-micro-label text-right">Expected</th>
              <th class="px-4 py-3 ez-micro-label text-right">Counted</th>
              <th class="px-4 py-3 ez-micro-label text-right">Difference</th>
            </tr>
          </thead>
          <tbody>
            @for (row of r.shifts; track row.shiftUuid) {
            <tr class="border-t border-ez-border hover:bg-ez-ash cursor-pointer tabular-nums" [routerLink]="['/shifts', row.shiftUuid]">
              <td class="px-4 py-2.5 text-ez-heading">{{ row.openedAt | date:'EEE d MMM, h:mm a' }}</td>
              <td class="px-4 py-2.5 text-ez-secondary">
                @if (row.closedAt) { {{ row.closedAt | date:'h:mm a' }} }
                @else { <span class="px-2 py-0.5 text-ez-xs font-medium bg-blue-50 text-blue-700">Open</span> }
              </td>
              <td class="px-4 py-2.5 text-ez-secondary">{{ who(row.closedBy ?? row.openedBy) }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.openingCash | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.cashSales | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">+{{ row.cashIn | currency:'INR' }} / -{{ row.cashOut | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right">{{ row.expectedCash | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right">{{ row.countedCash !== null ? (row.countedCash | currency:'INR') : '-' }}</td>
              <td class="px-4 py-2.5 text-right font-medium" [class]="diffClass(row.cashDifference)">
                @if (row.cashDifference !== null) {
                {{ row.cashDifference > 0 ? '+' : '' }}{{ row.cashDifference | currency:'INR' }}
                @if (row.closingNotes) { <div class="text-ez-xs font-normal text-ez-muted truncate max-w-48 ml-auto" [title]="row.closingNotes">{{ row.closingNotes }}</div> }
                } @else { - }
              </td>
            </tr>
            } @empty {
            <tr><td colspan="9" class="px-4 py-10 text-center text-ez-sm text-ez-muted">No shifts opened in this period.</td></tr>
            }
          </tbody>
        </table>
      </section>
      <p class="text-ez-xs text-ez-muted">Open shifts show live figures and no count yet. Difference = counted − expected; negative means cash is short.</p>
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading report...</p>
      }
    </div>
  `
})
export class ShiftsReportComponent extends ReportPage<ShiftReport> {
  private reports = inject(ReportsService);

  protected fetch(period: ReportPeriod) {
    return this.reports.shifts(period);
  }

  diffClass(diff: number | null): string {
    if (diff === null) return 'text-ez-muted';
    if (diff === 0) return 'text-green-700';
    return diff < 0 ? 'text-red-600' : 'text-amber-700';
  }
}
