import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationModalService, ToastService } from 'kubee-ui';
import { PlanRequest, PlanRequestsService, PlanSummary } from './plan-requests.service';

@Component({
  selector: 'app-plan-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plan-requests.component.html'
})
export class PlanRequestsComponent implements OnInit {
  requests: PlanRequest[] = [];
  isLoading = false;
  busyId: number | null = null;

  constructor(
    private service: PlanRequestsService,
    private toast: ToastService,
    private confirm: ConfirmationModalService
  ) { }

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.service.getOpenRequests(
      (res: any) => {
        this.requests = res.data ?? [];
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.toast.show(err?.error?.message || 'Failed to load plan requests', 'error');
      }
    );
  }

  period(plan: PlanSummary): string {
    if (plan.type === 'YEARLY') return 'year';
    if (plan.type === 'MONTHLY') return 'month';
    return `${plan.durationDays} days`;
  }

  async activate(request: PlanRequest) {
    const ok = await this.confirm.open({
      title: `Activate ${request.requestedPlan.name}`,
      message: `${request.tenantName} moves to ${request.requestedPlan.name} now`
        + (request.currentPlan ? `, ending ${request.currentPlan.name}.` : '.')
        + ' Only do this once payment is confirmed.',
      intent: 'info',
      confirmLabel: 'Activate',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    this.busyId = request.subscriptionId;
    this.service.activate(request,
      () => {
        this.busyId = null;
        this.toast.show(`${request.tenantName} is now on ${request.requestedPlan.name}`, 'success');
        this.load();
      },
      (err: any) => {
        this.busyId = null;
        this.toast.show(err?.error?.message || 'Failed to activate plan', 'error');
      }
    );
  }

  async reject(request: PlanRequest) {
    const ok = await this.confirm.open({
      title: 'Reject request',
      message: `Reject ${request.tenantName}'s request for ${request.requestedPlan.name}? Their current plan is not affected.`,
      intent: 'delete',
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    this.busyId = request.subscriptionId;
    this.service.reject(request,
      () => {
        this.busyId = null;
        this.toast.show('Request rejected', 'success');
        this.load();
      },
      (err: any) => {
        this.busyId = null;
        this.toast.show(err?.error?.message || 'Failed to reject request', 'error');
      }
    );
  }
}
