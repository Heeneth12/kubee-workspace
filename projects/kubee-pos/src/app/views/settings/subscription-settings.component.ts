import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin, of, catchError } from 'rxjs';
import { ToastService, ConfirmationModalService } from 'kubee-ui';
import { LucideAngularModule, Check } from 'lucide-angular';
import { SettingsService } from './settings.service';
import { UsersService } from '../users/users.service';
import { Plan, Subscription } from './settings.models';
import { readApiError } from '../catalog/catalog-errors';

/**
 * Current POS plan and plan changes. A change is a request: ezauth keeps it pending until
 * the platform activates it after payment, so the current plan keeps running meanwhile.
 */
@Component({
  selector: 'app-subscription-settings',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, LucideAngularModule],
  template: `
    @if (isLoading) {
    <p class="p-6 text-ez-sm text-ez-muted">Loading...</p>
    } @else {
    <div class="p-6 space-y-8 max-w-5xl">

      <section>
        <h3 class="ez-micro-label mb-4">Current plan</h3>
        @if (current) {
        <div class="border border-ez-border p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-ez-xl font-medium text-ez-heading">{{ current.plan.name }}</p>
            <p class="text-ez-sm text-ez-secondary mt-1">
              {{ current.plan.price | currency:currency }} / {{ period(current.plan) }}
              · {{ current.plan.maxUsers ? 'up to ' + current.plan.maxUsers + ' users' : 'unlimited users' }}
            </p>
            <p class="text-ez-sm mt-2" [class]="current.daysRemaining <= 7 ? 'text-red-600' : 'text-ez-secondary'">
              {{ current.autoRenew ? 'Renews' : 'Ends' }} on {{ current.endDate | date:'mediumDate' }}
              ({{ current.daysRemaining }} {{ current.daysRemaining === 1 ? 'day' : 'days' }} left)
            </p>
          </div>
          @if (canEdit && current.autoRenew) {
          <button type="button" (click)="stopRenewal()" [disabled]="busy" class="ez-btn ez-btn-secondary hover:!text-red-600">Turn off auto-renew</button>
          }
        </div>
        } @else {
        <p class="text-ez-sm text-ez-muted">No active plan.</p>
        }
      </section>

      @if (pending) {
      <section class="border border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
        <p class="text-ez-sm text-amber-800">
          You asked to move to <strong>{{ pending.plan.name }}</strong>. It will be activated once payment is confirmed.
        </p>
        @if (canEdit) {
        <button type="button" (click)="withdraw()" [disabled]="busy" class="ez-btn ez-btn-secondary !min-h-0 !py-1.5">Withdraw request</button>
        }
      </section>
      }

      <section>
        <h3 class="ez-micro-label mb-4">Plans</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          @for (plan of plans; track plan.id) {
          <div class="border p-5 flex flex-col" [class]="isCurrent(plan) ? 'border-ez-primary' : 'border-ez-border'">
            <p class="text-ez-lg font-medium text-ez-heading">{{ plan.name }}</p>
            <p class="text-ez-2xl font-medium text-ez-heading mt-2">
              {{ plan.price | currency:currency }}<span class="text-ez-sm text-ez-secondary font-normal"> / {{ period(plan) }}</span>
            </p>
            <p class="text-ez-sm text-ez-secondary mt-2 flex-1">{{ plan.description }}</p>
            <p class="text-ez-sm text-ez-body mt-3">{{ plan.maxUsers ? 'Up to ' + plan.maxUsers + ' users' : 'Unlimited users' }}</p>
            <div class="mt-4">
              @if (isCurrent(plan)) {
              <span class="inline-flex items-center gap-1 text-ez-sm font-medium text-ez-primary">
                <lucide-icon [img]="icons.check" class="w-4 h-4"></lucide-icon> Current plan
              </span>
              } @else if (pending?.plan?.id === plan.id) {
              <span class="text-ez-sm text-amber-700">Requested</span>
              } @else if (canEdit && plan.price > 0) {
              <button type="button" (click)="request(plan)" [disabled]="busy" class="ez-btn ez-btn-primary w-full">Request this plan</button>
              }
            </div>
          </div>
          } @empty {
          <p class="text-ez-sm text-ez-muted">No plans available.</p>
          }
        </div>
      </section>
    </div>
    }
  `
})
export class SubscriptionSettingsComponent implements OnInit {
  private settings = inject(SettingsService);
  private usersService = inject(UsersService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmationModalService);

  readonly icons = { check: Check };
  readonly canEdit = this.settings.canEditSettings();
  readonly currency = 'INR';

  current: Subscription | null = null;
  pending: Subscription | null = null;
  plans: Plan[] = [];
  isLoading = true;
  busy = false;

  ngOnInit() {
    this.load();
  }

  private load() {
    forkJoin({
      app: this.usersService.getPosApp(),
      // No active plan comes back as an error; show "No active plan" instead of failing the page
      current: this.settings.getCurrentSubscription().pipe(catchError(() => of(null))),
      pending: this.settings.getPendingRequest(),
      plans: this.settings.getActivePlans(),
    }).subscribe({
      next: ({ app, current, pending, plans }) => {
        this.current = current;
        this.pending = pending;
        this.plans = plans
          .filter(p => app && p.applicationId === app.id)
          .sort((a, b) => a.price - b.price);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  period(plan: Plan): string {
    if (plan.type === 'YEARLY') return 'year';
    if (plan.type === 'MONTHLY') return 'month';
    return plan.durationDays + ' days';
  }

  isCurrent(plan: Plan): boolean {
    return this.current?.plan?.id === plan.id;
  }

  async request(plan: Plan) {
    const ok = await this.confirmService.open({
      title: `Request ${plan.name}`,
      message: 'Your current plan stays active until payment for the new one is confirmed.',
      intent: 'info',
      confirmLabel: 'Send request',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    this.busy = true;
    this.settings.requestPlan(plan.id).subscribe({
      next: message => {
        this.busy = false;
        this.toastService.show(message, 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  async withdraw() {
    if (!this.pending) return;
    this.cancel(this.pending.id, 'Request withdrawn');
  }

  async stopRenewal() {
    if (!this.current) return;
    const ok = await this.confirmService.open({
      title: 'Turn off auto-renew',
      message: `Your plan keeps working until ${new Date(this.current.endDate).toLocaleDateString()}. After that, nobody can sign in until a plan is active again.`,
      intent: 'delete',
      confirmLabel: 'Turn off',
      cancelLabel: 'Keep renewing',
    });
    if (!ok) return;
    this.cancel(this.current.id);
  }

  private cancel(subscriptionId: number, successMessage?: string) {
    this.busy = true;
    this.settings.cancelSubscription(subscriptionId).subscribe({
      next: message => {
        this.busy = false;
        this.toastService.show(successMessage ?? message, 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }
}
