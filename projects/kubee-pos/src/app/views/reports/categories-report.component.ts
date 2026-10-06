import { Component, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReportPage } from './report-page';
import { CategorySalesReport, ReportPeriod } from './reports.models';
import { ReportsService } from './reports.service';

/** Item sales rolled up to each item's current category. */
@Component({
  selector: 'app-categories-report',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  template: `
    <div class="p-6 space-y-4">
      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {
      <p class="text-ez-sm text-ez-secondary">{{ r.categories.length }} categories · {{ r.totalNetAmount | currency:'INR' }} net</p>
      <section class="border border-ez-border overflow-x-auto" [class.opacity-60]="isLoading">
        <table class="w-full text-ez-base">
          <thead class="bg-ez-ash text-left">
            <tr>
              <th class="px-4 py-3 ez-micro-label">Category</th>
              <th class="px-4 py-3 ez-micro-label text-right">Qty</th>
              <th class="px-4 py-3 ez-micro-label text-right">Orders</th>
              <th class="px-4 py-3 ez-micro-label text-right">Gross</th>
              <th class="px-4 py-3 ez-micro-label text-right">Discount</th>
              <th class="px-4 py-3 ez-micro-label text-right">GST</th>
              <th class="px-4 py-3 ez-micro-label text-right">Net</th>
              <th class="px-4 py-3 ez-micro-label w-40">Share of sales</th>
            </tr>
          </thead>
          <tbody>
            @for (row of r.categories; track $index) {
            <tr class="border-t border-ez-border tabular-nums">
              <td class="px-4 py-2.5">
                @if (row.parentCategoryName) { <span class="text-ez-secondary">{{ row.parentCategoryName }} / </span> }
                <span class="font-medium" [class]="row.categoryUuid ? 'text-ez-heading' : 'text-ez-muted italic'">{{ row.categoryName ?? 'Uncategorised' }}</span>
              </td>
              <td class="px-4 py-2.5 text-right">{{ row.quantity | number:'1.0-3' }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.orderCount }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.grossAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.discountAmount ? '-' : '' }}{{ row.discountAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.taxAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right font-medium text-ez-heading">{{ row.netAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-ez-ash rounded-full overflow-hidden">
                    <div class="h-full bg-ez-primary rounded-full" [style.width.%]="row.shareOfSales"></div>
                  </div>
                  <span class="w-12 text-right text-ez-xs text-ez-muted">{{ row.shareOfSales | number:'1.1-1' }}%</span>
                </div>
              </td>
            </tr>
            } @empty {
            <tr><td colspan="8" class="px-4 py-10 text-center text-ez-sm text-ez-muted">No sales in this period.</td></tr>
            }
          </tbody>
        </table>
      </section>
      <p class="text-ez-xs text-ez-muted">Grouped by each item's current category. Net is after discounts and includes GST, without round off.</p>
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading report...</p>
      }
    </div>
  `
})
export class CategoriesReportComponent extends ReportPage<CategorySalesReport> {
  private reports = inject(ReportsService);

  protected fetch(period: ReportPeriod) {
    return this.reports.categorySales(period);
  }
}
