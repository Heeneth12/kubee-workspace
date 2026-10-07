import { Component, inject } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, TrendingUp, Wallet, Package, Landmark, Ban, Vault, FolderTree, Clock, Users, Download } from 'lucide-angular';
import { ExportFormat, ExportableReport, ItemSalesSort, ReportPeriod } from './reports.models';
import { ReportsService } from './reports.service';
import { readBlobError, saveFile } from './download';
import { periodError, readPeriod } from './report-page';
import { isoDate } from '../orders/order-utils';
import { AuthService } from '../../layouts/guards/auth.service';
import { PosPrivileges } from '../../layouts/guards/pos-permissions';

interface Preset {
  id: string;
  label: string;
  period: () => ReportPeriod;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/** Indian financial year (April–March) containing today. */
function financialYearStart(): Date {
  const now = new Date();
  return new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="flex flex-col h-full">
      <div class="px-6 pt-6 border-b border-ez-border shrink-0">
        <div class="flex flex-col xl:flex-row xl:items-end gap-4 mb-4">
          <div class="flex-1">
            <h1 class="text-ez-2xl font-medium text-ez-heading mb-1">Reports</h1>
            <p class="text-ez-md text-ez-secondary">Sales, collections, items, categories, busy hours, staff, GST, cancellations and cash-drawer shifts for a period (up to 366 days).</p>
          </div>
          <!-- Period: presets + custom range, kept in the URL so a report can be bookmarked -->
          <div class="flex flex-wrap items-center gap-2">
            @for (preset of presets; track preset.id) {
            <button (click)="applyPreset(preset)"
              class="px-3 py-1.5 text-ez-sm font-medium whitespace-nowrap border rounded transition-colors duration-ez"
              [class]="activePreset === preset.id ? 'bg-ez-carbon text-white border-ez-carbon' : 'bg-ez-white text-ez-body border-ez-border hover:border-ez-subtle'">
              {{ preset.label }}
            </button>
            }
            <input type="date" [(ngModel)]="from" (change)="applyCustom()" [max]="today" class="ez-input w-40" title="From">
            <span class="text-ez-muted">–</span>
            <input type="date" [(ngModel)]="to" (change)="applyCustom()" [max]="today" class="ez-input w-40" title="To">
            <!-- Export the open report with the same period and filters -->
            @if (canExport) {
            <div class="relative">
              <button (click)="exportOpen = !exportOpen" [disabled]="exporting || !!rangeError" class="ez-btn ez-btn-secondary">
                <lucide-icon [img]="icons.download" class="w-4 h-4"></lucide-icon>
                {{ exporting ? 'Exporting...' : 'Export' }}
              </button>
              @if (exportOpen) {
              <div class="fixed inset-0 z-10" (click)="exportOpen = false"></div>
              <div class="absolute right-0 top-full mt-1 z-20 w-44 bg-ez-white border border-ez-border shadow-sm">
                <button (click)="exportFile('xlsx')" class="w-full text-left px-4 py-2.5 text-ez-sm text-ez-body hover:bg-ez-ash">Excel (.xlsx)</button>
                <button (click)="exportFile('csv')" class="w-full text-left px-4 py-2.5 text-ez-sm text-ez-body hover:bg-ez-ash border-t border-ez-border">CSV (.csv)</button>
              </div>
              }
            </div>
            }
          </div>
        </div>
        @if (rangeError) {
        <p class="text-ez-sm text-red-600 mb-3">{{ rangeError }}</p>
        }
        <nav class="flex gap-6 -mb-px overflow-x-auto">
          @for (tab of tabs; track tab.link) {
          <a [routerLink]="tab.link" queryParamsHandling="preserve" routerLinkActive="!border-ez-primary !text-ez-heading"
            class="flex items-center gap-2 pb-3 border-b-2 border-transparent text-ez-sm font-medium text-ez-secondary hover:text-ez-heading whitespace-nowrap transition-colors duration-ez">
            <lucide-icon [img]="tab.icon" class="w-4 h-4"></lucide-icon>
            {{ tab.label }}
          </a>
          }
        </nav>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class ReportsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reports = inject(ReportsService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  readonly canExport = this.authService.hasPermission(PosPrivileges.REPORTS_EXPORT);

  readonly icons = { download: Download };
  /** Tab path -> report name for GET /reports/{report}/export. */
  private readonly exportNames: Record<string, ExportableReport> = {
    sales: 'sales-summary', payments: 'payment-modes', items: 'items', categories: 'categories',
    hourly: 'hourly', staff: 'staff', gst: 'gst', cancellations: 'cancellations', shifts: 'shifts',
  };
  exportOpen = false;
  exporting = false;

  readonly today = isoDate();
  readonly tabs = [
    { label: 'Day sales', link: 'sales', icon: TrendingUp },
    { label: 'Payment modes', link: 'payments', icon: Wallet },
    { label: 'Item-wise', link: 'items', icon: Package },
    { label: 'Categories', link: 'categories', icon: FolderTree },
    { label: 'Busy hours', link: 'hourly', icon: Clock },
    { label: 'Staff', link: 'staff', icon: Users },
    { label: 'GST summary', link: 'gst', icon: Landmark },
    { label: 'Cancellations & refunds', link: 'cancellations', icon: Ban },
    { label: 'Shifts', link: 'shifts', icon: Vault },
  ];
  readonly presets: Preset[] = [
    { id: 'today', label: 'Today', period: () => ({ from: isoDate(), to: isoDate() }) },
    { id: 'yesterday', label: 'Yesterday', period: () => ({ from: isoDate(daysAgo(1)), to: isoDate(daysAgo(1)) }) },
    { id: '7d', label: 'Last 7 days', period: () => ({ from: isoDate(daysAgo(6)), to: isoDate() }) },
    { id: 'month', label: 'This month', period: () => {
      const now = new Date();
      return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: isoDate() };
    } },
    { id: 'last-month', label: 'Last month', period: () => {
      const now = new Date();
      return {
        from: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    } },
    { id: 'fy', label: 'This FY', period: () => ({ from: isoDate(financialYearStart()), to: isoDate() }) },
  ];

  from = this.today;
  to = this.today;
  activePreset: string | null = 'today';
  rangeError: string | null = null;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(params => {
      const period = readPeriod(params);
      this.from = period.from;
      this.to = period.to;
      this.activePreset = this.presets.find(p => {
        const preset = p.period();
        return preset.from === period.from && preset.to === period.to;
      })?.id ?? null;
      this.rangeError = periodError(period);
    });
  }

  /** Downloads the open tab's report as Excel or CSV. */
  exportFile(format: ExportFormat) {
    if (!this.canExport) return;
    this.exportOpen = false;
    const tab = this.route.firstChild?.snapshot.url[0]?.path ?? 'sales';
    const report = this.exportNames[tab];
    if (!report) return;
    const q = this.route.snapshot.queryParamMap;
    const extra = report === 'items'
      ? { categoryUuid: q.get('categoryUuid') ?? undefined, sort: (q.get('sort') as ItemSalesSort) ?? undefined }
      : {};
    this.exporting = true;
    this.reports.exportReport(report, format, { from: this.from, to: this.to }, extra).subscribe({
      next: ({ blob, fileName }) => {
        this.exporting = false;
        saveFile(blob, fileName);
      },
      error: async (err: HttpErrorResponse) => {
        this.exporting = false;
        this.toastService.show(await readBlobError(err), 'error');
      }
    });
  }

  applyPreset(preset: Preset) {
    this.setPeriod(preset.period());
  }

  applyCustom() {
    if (!this.from || !this.to) return;
    this.setPeriod({ from: this.from, to: this.to });
  }

  private setPeriod(period: ReportPeriod) {
    this.rangeError = periodError(period);
    this.router.navigate([], { relativeTo: this.route.firstChild ?? this.route, queryParams: period, queryParamsHandling: 'merge' });
  }
}
