import { Component, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule, TriangleAlert } from 'lucide-angular';
import { ReportPage } from './report-page';
import { GstReport, ReportPeriod } from './reports.models';
import { ReportsService } from './reports.service';

/** GSTR-1 style summary for the shop's CA, from issued bills only. */
@Component({
  selector: 'app-gst-report',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterModule, LucideAngularModule],
  template: `
    <div class="p-6 space-y-8">
      @if (error) {
      <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
      } @else if (data; as r) {

      @if (r.ordersWithoutBill > 0) {
      <div class="border border-amber-300 bg-amber-50 text-amber-800 text-ez-sm px-4 py-3 flex items-start gap-3">
        <lucide-icon [img]="icons.warn" class="w-5 h-5 shrink-0"></lucide-icon>
        <div>
          <p class="font-medium">{{ r.ordersWithoutBill }} completed {{ r.ordersWithoutBill === 1 ? 'order has' : 'orders have' }} no GST bill</p>
          <p>GST was charged on them but no invoice was issued, so their tax is not in this report.
            Issue the bills from <a routerLink="/orders" [queryParams]="{ status: 'COMPLETED', from: period.from, to: period.to }" class="underline">Orders</a>.</p>
        </div>
      </div>
      }

      <!-- Totals -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-3" [class.opacity-60]="isLoading">
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Invoices</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.totals.invoiceCount }}</p>
          @if (r.cancelledBills) { <p class="text-ez-xs text-ez-muted mt-1">{{ r.cancelledBills }} cancelled, excluded</p> }
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Taxable value</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.totals.taxableAmount | currency:'INR' }}</p>
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Total tax</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.totals.totalTax | currency:'INR' }}</p>
        </div>
        <div class="ez-surface p-5 text-ez-sm space-y-0.5">
          <p class="ez-micro-label mb-2">Tax split</p>
          <div class="flex justify-between"><span class="text-ez-secondary">CGST</span><span class="tabular-nums">{{ r.totals.cgst | currency:'INR' }}</span></div>
          <div class="flex justify-between"><span class="text-ez-secondary">SGST</span><span class="tabular-nums">{{ r.totals.sgst | currency:'INR' }}</span></div>
          <div class="flex justify-between"><span class="text-ez-secondary">IGST</span><span class="tabular-nums">{{ r.totals.igst | currency:'INR' }}</span></div>
          @if (r.totals.cess) { <div class="flex justify-between"><span class="text-ez-secondary">Cess</span><span class="tabular-nums">{{ r.totals.cess | currency:'INR' }}</span></div> }
        </div>
        <div class="ez-surface p-5">
          <p class="ez-micro-label mb-2">Invoice value</p>
          <p class="text-ez-2xl font-medium text-ez-heading">{{ r.totals.invoiceValue | currency:'INR' }}</p>
          <p class="text-ez-xs text-ez-muted mt-1">Incl. round off {{ r.totals.roundOff | currency:'INR' }}</p>
        </div>
      </div>

      <!-- By rate -->
      <section>
        <h2 class="text-ez-lg font-medium text-ez-heading mb-3">By tax rate</h2>
        <div class="border border-ez-border overflow-x-auto">
          <table class="w-full text-ez-base">
            <thead class="bg-ez-ash text-left">
              <tr>
                <th class="px-4 py-3 ez-micro-label">Rate</th>
                <th class="px-4 py-3 ez-micro-label text-right">Taxable</th>
                <th class="px-4 py-3 ez-micro-label text-right">CGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">SGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">IGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">Cess</th>
                <th class="px-4 py-3 ez-micro-label text-right">Total tax</th>
                <th class="px-4 py-3 ez-micro-label text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              @for (row of r.byRate; track row.rate) {
              <tr class="border-t border-ez-border tabular-nums">
                <td class="px-4 py-2.5 font-medium text-ez-heading">{{ row.rate | number:'1.0-3' }}%</td>
                <td class="px-4 py-2.5 text-right">{{ row.taxableAmount | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.cgst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.sgst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.igst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.cess | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right">{{ row.totalTax | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right font-medium text-ez-heading">{{ row.invoiceValue | currency:'INR' }}</td>
              </tr>
              } @empty {
              <tr><td colspan="8" class="px-4 py-8 text-center text-ez-sm text-ez-muted">No issued bills in this period.</td></tr>
              }
            </tbody>
          </table>
        </div>
        <p class="text-ez-xs text-ez-muted mt-2">Value here excludes the bills' round off.</p>
      </section>

      <!-- B2B -->
      <section>
        <h2 class="text-ez-lg font-medium text-ez-heading mb-1">B2B invoices <span class="text-ez-sm font-normal text-ez-muted">(GSTR-1 table 4)</span></h2>
        <p class="text-ez-xs text-ez-muted mb-3">Bills issued to registered buyers (with a GSTIN).</p>
        <div class="border border-ez-border overflow-x-auto">
          <table class="w-full text-ez-base">
            <thead class="bg-ez-ash text-left">
              <tr>
                <th class="px-4 py-3 ez-micro-label">Bill #</th>
                <th class="px-4 py-3 ez-micro-label">Date</th>
                <th class="px-4 py-3 ez-micro-label">Buyer GSTIN</th>
                <th class="px-4 py-3 ez-micro-label">POS</th>
                <th class="px-4 py-3 ez-micro-label text-right">Taxable</th>
                <th class="px-4 py-3 ez-micro-label text-right">CGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">SGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">IGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              @for (row of r.b2bInvoices; track row.billNumber) {
              <tr class="border-t border-ez-border tabular-nums">
                <td class="px-4 py-2.5 font-medium text-ez-heading">{{ row.billNumber }}</td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.billDate | date:'dd-MM-yyyy' }}</td>
                <td class="px-4 py-2.5">
                  {{ row.customerGstin }}
                  @if (row.customerName) { <div class="text-ez-xs text-ez-muted">{{ row.customerName }}</div> }
                </td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.placeOfSupply }}</td>
                <td class="px-4 py-2.5 text-right">{{ row.taxableAmount | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.cgst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.sgst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.igst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right font-medium text-ez-heading">{{ row.invoiceValue | currency:'INR' }}</td>
              </tr>
              } @empty {
              <tr><td colspan="9" class="px-4 py-8 text-center text-ez-sm text-ez-muted">No B2B invoices.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- B2C -->
      <section>
        <h2 class="text-ez-lg font-medium text-ez-heading mb-1">B2C supplies <span class="text-ez-sm font-normal text-ez-muted">(GSTR-1 table 7)</span></h2>
        <p class="text-ez-xs text-ez-muted mb-3">Unregistered buyers, by place of supply and rate.</p>
        <div class="border border-ez-border overflow-x-auto">
          <table class="w-full text-ez-base">
            <thead class="bg-ez-ash text-left">
              <tr>
                <th class="px-4 py-3 ez-micro-label">Place of supply</th>
                <th class="px-4 py-3 ez-micro-label">Rate</th>
                <th class="px-4 py-3 ez-micro-label text-right">Taxable</th>
                <th class="px-4 py-3 ez-micro-label text-right">CGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">SGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">IGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">Cess</th>
              </tr>
            </thead>
            <tbody>
              @for (row of r.b2c; track $index) {
              <tr class="border-t border-ez-border tabular-nums">
                <td class="px-4 py-2.5 text-ez-heading">{{ row.placeOfSupply ?? 'Shop state' }}</td>
                <td class="px-4 py-2.5">{{ row.rate | number:'1.0-3' }}%</td>
                <td class="px-4 py-2.5 text-right">{{ row.taxableAmount | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.cgst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.sgst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.igst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.cess | currency:'INR' }}</td>
              </tr>
              } @empty {
              <tr><td colspan="7" class="px-4 py-8 text-center text-ez-sm text-ez-muted">No B2C supplies.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <!-- HSN -->
      <section>
        <h2 class="text-ez-lg font-medium text-ez-heading mb-1">HSN / SAC summary <span class="text-ez-sm font-normal text-ez-muted">(GSTR-1 table 12)</span></h2>
        @if (missingHsn(r)) {
        <p class="text-ez-xs text-amber-700 mb-3">Rows marked "Missing" are items without an HSN/SAC code in the catalog. Your CA will need one.</p>
        }
        <div class="border border-ez-border overflow-x-auto">
          <table class="w-full text-ez-base">
            <thead class="bg-ez-ash text-left">
              <tr>
                <th class="px-4 py-3 ez-micro-label">HSN / SAC</th>
                <th class="px-4 py-3 ez-micro-label">UQC</th>
                <th class="px-4 py-3 ez-micro-label">Rate</th>
                <th class="px-4 py-3 ez-micro-label text-right">Qty</th>
                <th class="px-4 py-3 ez-micro-label text-right">Taxable</th>
                <th class="px-4 py-3 ez-micro-label text-right">CGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">SGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">IGST</th>
                <th class="px-4 py-3 ez-micro-label text-right">Total value</th>
              </tr>
            </thead>
            <tbody>
              @for (row of r.hsn; track $index) {
              <tr class="border-t border-ez-border tabular-nums">
                <td class="px-4 py-2.5">
                  @if (row.hsnSacCode) { <span class="text-ez-heading">{{ row.hsnSacCode }}</span> }
                  @else { <span class="px-1.5 py-0.5 text-ez-xs font-medium bg-amber-50 text-amber-700">Missing</span> }
                </td>
                <td class="px-4 py-2.5 text-ez-secondary">{{ row.unitOfMeasure }}</td>
                <td class="px-4 py-2.5">{{ row.rate | number:'1.0-3' }}%</td>
                <td class="px-4 py-2.5 text-right">{{ row.quantity | number:'1.0-3' }}</td>
                <td class="px-4 py-2.5 text-right">{{ row.taxableAmount | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.cgst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.sgst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right text-ez-secondary">{{ row.igst | currency:'INR' }}</td>
                <td class="px-4 py-2.5 text-right font-medium text-ez-heading">{{ row.totalValue | currency:'INR' }}</td>
              </tr>
              } @empty {
              <tr><td colspan="9" class="px-4 py-8 text-center text-ez-sm text-ez-muted">No HSN rows.</td></tr>
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
export class GstReportComponent extends ReportPage<GstReport> {
  private reports = inject(ReportsService);
  readonly icons = { warn: TriangleAlert };

  protected fetch(period: ReportPeriod) {
    return this.reports.gst(period);
  }

  missingHsn(report: GstReport): boolean {
    return report.hsn.some(h => !h.hsnSacCode);
  }
}
