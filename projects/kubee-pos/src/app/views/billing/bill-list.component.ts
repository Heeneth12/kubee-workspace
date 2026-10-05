import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, Search, ChevronLeft, ChevronRight, FileText } from 'lucide-angular';
import { BillingService } from './billing.service';
import { BillStatus, BillSummaryView } from './billing.models';
import { readApiError } from '../catalog/catalog-errors';

@Component({
  selector: 'app-bill-list',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, RouterModule, LucideAngularModule],
  template: `
    <div class="p-6">
      <h1 class="text-ez-2xl font-medium text-ez-heading mb-1">Bills</h1>
      <p class="text-ez-md text-ez-secondary mb-6">GST invoices issued for completed orders. Open one to reprint, share or cancel it.</p>

      <div class="flex flex-col xl:flex-row gap-3 mb-4">
        <div class="relative flex-1 min-w-0">
          <lucide-icon [img]="icons.search" class="w-4 h-4 text-ez-muted absolute left-3 top-1/2 -translate-y-1/2"></lucide-icon>
          <input type="text" [(ngModel)]="search" (ngModelChange)="search$.next($event)"
            placeholder="Bill number, order number, phone or GSTIN..." class="ez-input w-full pl-9">
        </div>
        <div class="flex flex-wrap gap-3 items-center">
          <select [(ngModel)]="status" (ngModelChange)="applyFilters()" class="ez-select w-32">
            <option value="">Any status</option>
            <option value="ISSUED">Issued</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <input type="date" [(ngModel)]="from" (ngModelChange)="applyFilters()" class="ez-input w-40" title="From">
          <input type="date" [(ngModel)]="to" (ngModelChange)="applyFilters()" class="ez-input w-40" title="To">
        </div>
      </div>

      <div class="border border-ez-border overflow-x-auto">
        <table class="w-full text-ez-base">
          <thead class="bg-ez-ash text-left">
            <tr>
              <th class="px-4 py-3 ez-micro-label">Bill #</th>
              <th class="px-4 py-3 ez-micro-label">Date</th>
              <th class="px-4 py-3 ez-micro-label">Token</th>
              <th class="px-4 py-3 ez-micro-label">Customer</th>
              <th class="px-4 py-3 ez-micro-label text-right">Tax</th>
              <th class="px-4 py-3 ez-micro-label text-right">Total</th>
              <th class="px-4 py-3 ez-micro-label">Status</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading && !bills.length) {
            <tr><td colspan="7" class="px-4 py-10 text-center text-ez-sm text-ez-muted">Loading bills...</td></tr>
            } @else {
            @for (bill of bills; track bill.uuid) {
            <tr class="border-t border-ez-border hover:bg-ez-ash cursor-pointer" [routerLink]="bill.uuid">
              <td class="px-4 py-3 font-medium text-ez-heading">{{ bill.billNumber }}</td>
              <td class="px-4 py-3 text-ez-secondary">{{ bill.billDate | date:'short' }}</td>
              <td class="px-4 py-3 text-ez-secondary">#{{ bill.orderNumber }}</td>
              <td class="px-4 py-3 text-ez-secondary">
                {{ bill.customerName ?? bill.customerPhone ?? '-' }}
                @if (bill.customerGstin) { <div class="text-ez-xs text-ez-muted">GSTIN {{ bill.customerGstin }}</div> }
              </td>
              <td class="px-4 py-3 text-right text-ez-secondary">{{ bill.taxAmount | currency:'INR' }}</td>
              <td class="px-4 py-3 text-right font-medium text-ez-heading">{{ bill.grandTotal | currency:'INR' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 text-ez-xs font-medium"
                  [class]="bill.status === 'ISSUED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'">{{ bill.status }}</span>
              </td>
            </tr>
            } @empty {
            <tr>
              <td colspan="7" class="px-4 py-12 text-center text-ez-muted">
                <lucide-icon [img]="icons.empty" class="w-8 h-8 mx-auto mb-2"></lucide-icon>
                <p class="text-ez-sm">No bills found</p>
              </td>
            </tr>
            }
            }
          </tbody>
        </table>
      </div>

      @if (totalPages > 1) {
      <div class="flex items-center justify-between mt-4 text-ez-sm text-ez-secondary">
        <span>{{ totalElements }} bills</span>
        <div class="flex items-center gap-3">
          <button (click)="goToPage(page - 1)" [disabled]="page === 0 || isLoading" class="ez-btn ez-btn-secondary !min-h-0 !p-1.5">
            <lucide-icon [img]="icons.prev" class="w-4 h-4"></lucide-icon>
          </button>
          <span>Page {{ page + 1 }} of {{ totalPages }}</span>
          <button (click)="goToPage(page + 1)" [disabled]="page >= totalPages - 1 || isLoading" class="ez-btn ez-btn-secondary !min-h-0 !p-1.5">
            <lucide-icon [img]="icons.next" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      </div>
      }
    </div>
  `
})
export class BillListComponent implements OnInit {
  private billingService = inject(BillingService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly icons = { search: Search, prev: ChevronLeft, next: ChevronRight, empty: FileText };
  readonly pageSize = 50;

  bills: BillSummaryView[] = [];
  isLoading = false;
  search = '';
  status: BillStatus | '' = '';
  from = '';
  to = '';
  page = 0;
  totalPages = 0;
  totalElements = 0;
  search$ = new Subject<string>();

  ngOnInit() {
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
    this.loadBills();
  }

  applyFilters() {
    this.page = 0;
    this.loadBills();
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.page = page;
    this.loadBills();
  }

  loadBills() {
    this.isLoading = true;
    this.billingService.searchBills({
      search: this.search.trim() || undefined,
      status: this.status || undefined,
      from: this.from || undefined,
      to: this.to || undefined,
      page: this.page,
      size: this.pageSize,
    }).subscribe({
      next: result => {
        this.bills = result.content;
        this.totalPages = result.totalPages;
        this.totalElements = result.totalElements;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }
}
