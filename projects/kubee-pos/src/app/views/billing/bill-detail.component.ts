import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { BillingService } from './billing.service';
import { BillView } from './billing.models';
import { BillPanelComponent } from './bill-panel.component';
import { readApiError } from '../catalog/catalog-errors';

@Component({
  selector: 'app-bill-detail',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, BillPanelComponent],
  template: `
    <div class="p-6 max-w-2xl">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/bills" class="text-ez-secondary hover:text-ez-heading" title="Back to bills">
          <lucide-icon [img]="icons.back" class="w-5 h-5"></lucide-icon>
        </a>
        <h1 class="text-ez-2xl font-medium text-ez-heading">{{ bill?.billNumber ?? 'Bill' }}</h1>
        @if (bill) {
        <a [routerLink]="['/orders', bill.orderUuid]" class="ml-auto text-ez-sm text-ez-primary hover:underline">
          Order #{{ bill.orderNumber }}
        </a>
        }
      </div>

      @if (bill) {
      @if (bill.status === 'CANCELLED') {
      <p class="text-ez-sm text-ez-secondary mb-4">
        To issue a corrected bill, open <a [routerLink]="['/orders', bill.orderUuid]" class="text-ez-primary hover:underline">the order</a>.
      </p>
      }
      <app-bill-panel [bill]="bill" (billChange)="bill = $event"></app-bill-panel>
      } @else if (isLoading) {
      <p class="text-ez-sm text-ez-muted">Loading bill...</p>
      }
    </div>
  `
})
export class BillDetailComponent implements OnInit {
  private billingService = inject(BillingService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly icons = { back: ArrowLeft };
  bill: BillView | null = null;
  isLoading = false;

  ngOnInit() {
    this.isLoading = true;
    this.billingService.getBill(this.route.snapshot.paramMap.get('uuid')!).subscribe({
      next: bill => {
        this.bill = bill;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
        this.router.navigate(['/bills']);
      }
    });
  }
}
