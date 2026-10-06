import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportPage } from './report-page';
import { ItemSalesReport, ItemSalesSort, ReportPeriod } from './reports.models';
import { ReportsService } from './reports.service';
import { CatalogService } from '../catalog/catalog.service';
import { Category } from '../catalog/catalog.models';

@Component({
  selector: 'app-items-report',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="p-6 space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <select [ngModel]="categoryUuid" (ngModelChange)="setFilter({ categoryUuid: $event || null })" class="ez-select w-52">
          <option value="">All categories</option>
          @for (cat of categories; track cat.uuid) {
          <option [value]="cat.uuid">{{ categoryLabel(cat) }}</option>
          }
        </select>
        <div class="flex border border-ez-border">
          @for (option of sortOptions; track option.value) {
          <button (click)="setFilter({ sort: option.value === 'AMOUNT' ? null : option.value })"
            class="px-3 py-2 text-ez-sm font-medium transition-colors duration-ez"
            [class]="sort === option.value ? 'bg-ez-carbon text-white' : 'bg-ez-white text-ez-body hover:text-ez-heading'">
            {{ option.label }}
          </button>
          }
        </div>
        @if (data) {
        <span class="ml-auto text-ez-sm text-ez-secondary">
          {{ data.items.length }} items · {{ data.totalNetAmount | currency:'INR' }} net
        </span>
        }
      </div>

      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {
      <section class="border border-ez-border overflow-x-auto" [class.opacity-60]="isLoading">
        <table class="w-full text-ez-base">
          <thead class="bg-ez-ash text-left">
            <tr>
              <th class="px-4 py-3 ez-micro-label w-10">#</th>
              <th class="px-4 py-3 ez-micro-label">Item</th>
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
            @for (row of r.items; track $index; let i = $index) {
            <tr class="border-t border-ez-border">
              <td class="px-4 py-2.5 text-ez-muted tabular-nums">{{ i + 1 }}</td>
              <td class="px-4 py-2.5">
                <span class="font-medium text-ez-heading">{{ row.itemName }}</span>
                @if (row.variantName) { <span class="text-ez-secondary"> ({{ row.variantName }})</span> }
              </td>
              <td class="px-4 py-2.5 text-ez-secondary">{{ row.categoryName ?? '-' }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums">{{ row.quantity | number:'1.0-3' }} <span class="text-ez-xs text-ez-muted">{{ row.unitOfMeasure }}</span></td>
              <td class="px-4 py-2.5 text-right tabular-nums text-ez-secondary">{{ row.orderCount }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums text-ez-secondary">{{ row.grossAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums text-ez-secondary">{{ row.discountAmount ? '-' : '' }}{{ row.discountAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums text-ez-secondary">{{ row.taxAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5 text-right tabular-nums font-medium text-ez-heading">{{ row.netAmount | currency:'INR' }}</td>
              <td class="px-4 py-2.5">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-ez-ash rounded-full overflow-hidden">
                    <div class="h-full bg-ez-primary rounded-full" [style.width.%]="row.shareOfSales"></div>
                  </div>
                  <span class="w-12 text-right text-ez-xs text-ez-muted tabular-nums">{{ row.shareOfSales | number:'1.1-1' }}%</span>
                </div>
              </td>
            </tr>
            } @empty {
            <tr><td colspan="10" class="px-4 py-10 text-center text-ez-sm text-ez-muted">No items sold in this period.</td></tr>
            }
          </tbody>
        </table>
      </section>
      <p class="text-ez-xs text-ez-muted">
        Net is after discounts and includes GST, without the order round-off. Refunds are recorded per payment, so they aren't taken off here.
      </p>
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading report...</p>
      }
    </div>
  `
})
export class ItemsReportComponent extends ReportPage<ItemSalesReport> implements OnInit {
  private reports = inject(ReportsService);
  private catalogService = inject(CatalogService);

  readonly sortOptions: { value: ItemSalesSort; label: string }[] = [
    { value: 'AMOUNT', label: 'By value' },
    { value: 'QUANTITY', label: 'By quantity' },
  ];
  categories: Category[] = [];
  private router = inject(Router);

  // Kept in the URL (?categoryUuid=&sort=) so the header's export uses the same filters
  categoryUuid = '';
  sort: ItemSalesSort = 'AMOUNT';

  override ngOnInit() {
    this.readFilters();
    super.ngOnInit();
    this.route.queryParamMap.subscribe(() => {
      if (this.readFilters()) this.reload();
    });
    this.catalogService.listCategories().subscribe({
      next: categories => this.categories = categories,
      error: () => { /* filter stays empty */ }
    });
  }

  /** Reads the filters from the URL; true when they changed. */
  private readFilters(): boolean {
    const q = this.route.snapshot.queryParamMap;
    const categoryUuid = q.get('categoryUuid') ?? '';
    const sort = (q.get('sort') as ItemSalesSort) || 'AMOUNT';
    const changed = categoryUuid !== this.categoryUuid || sort !== this.sort;
    this.categoryUuid = categoryUuid;
    this.sort = sort;
    return changed;
  }

  setFilter(filter: { categoryUuid?: string | null; sort?: ItemSalesSort | null }) {
    this.router.navigate([], { relativeTo: this.route, queryParams: filter, queryParamsHandling: 'merge' });
  }

  protected fetch(period: ReportPeriod) {
    return this.reports.itemSales(period, this.categoryUuid || undefined, this.sort);
  }

  categoryLabel(category: Category): string {
    const parent = category.parentUuid ? this.categories.find(c => c.uuid === category.parentUuid) : null;
    return parent ? `${parent.name} / ${category.name}` : category.name;
  }
}
