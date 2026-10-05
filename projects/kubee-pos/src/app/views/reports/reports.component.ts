import { Component, inject } from '@angular/core';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, TrendingUp, Wallet, Package, Landmark, Ban } from 'lucide-angular';
import { ReportPeriod } from './reports.models';
import { periodError, readPeriod } from './report-page';
import { isoDate } from '../orders/order-utils';

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
            <p class="text-ez-md text-ez-secondary">Sales, collections, items, GST and cancellations for a period (up to 366 days).</p>
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

  readonly today = isoDate();
  readonly tabs = [
    { label: 'Day sales', link: 'sales', icon: TrendingUp },
    { label: 'Payment modes', link: 'payments', icon: Wallet },
    { label: 'Item-wise', link: 'items', icon: Package },
    { label: 'GST summary', link: 'gst', icon: Landmark },
    { label: 'Cancellations & refunds', link: 'cancellations', icon: Ban },
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
