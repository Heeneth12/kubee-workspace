import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, ArrowLeft, ShoppingCart, Ban, Undo2, Save, FileText } from 'lucide-angular';
import { OrdersService } from './orders.service';
import { OrderType, OrderView, PaymentMethod, PaymentView } from './orders.models';
import { ORDER_TYPES, PAYMENT_METHODS, label, newClientRef, orderStatusClass, paymentStatusClass } from './order-utils';
import { BillingService } from '../billing/billing.service';
import { BillView } from '../billing/billing.models';
import { BillPanelComponent } from '../billing/bill-panel.component';
import { blankToNull, readApiError } from '../catalog/catalog-errors';

interface RefundForm {
  payment: PaymentView;
  amount: number | null;
  method: PaymentMethod;
  reason: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, DecimalPipe, RouterModule, LucideAngularModule, BillPanelComponent],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private billingService = inject(BillingService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly icons = { back: ArrowLeft, terminal: ShoppingCart, cancel: Ban, refund: Undo2, save: Save, bill: FileText };
  readonly orderTypes = ORDER_TYPES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly label = label;
  readonly orderStatusClass = orderStatusClass;
  readonly paymentStatusClass = paymentStatusClass;

  order: OrderView | null = null;
  isLoading = false;
  busy = false;
  error: string | null = null;

  // Details (full replace on save)
  details = { orderType: 'COUNTER' as OrderType, customerName: '', customerPhone: '', tableLabel: '', notes: '' };

  // Cancel order
  cancelOpen = false;
  cancelReason = '';

  // Refund
  refundForm: RefundForm | null = null;

  // Bill
  bill: BillView | null = null;
  billLoaded = false;
  issueOpen = false;
  issue = { customerName: '', customerPhone: '', customerGstin: '', placeOfSupply: '', series: '' };

  ngOnInit() {
    this.load();
  }

  load() {
    this.isLoading = true;
    this.ordersService.getOrder(this.route.snapshot.paramMap.get('uuid')!).subscribe({
      next: order => {
        this.isLoading = false;
        this.setOrder(order);
        this.loadBill();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
        this.router.navigate(['/orders']);
      }
    });
  }

  private setOrder(order: OrderView) {
    this.order = order;
    this.details = {
      orderType: order.orderType,
      customerName: order.customerName ?? '',
      customerPhone: order.customerPhone ?? '',
      tableLabel: order.tableLabel ?? '',
      notes: order.notes ?? '',
    };
  }

  private loadBill() {
    if (!this.order || this.order.status !== 'COMPLETED') {
      this.billLoaded = true;
      return;
    }
    this.billingService.getOrderBill(this.order.uuid).subscribe({
      next: bill => {
        this.bill = bill;
        this.billLoaded = true;
      },
      error: () => {
        // 404 = no issued bill yet
        this.bill = null;
        this.billLoaded = true;
        this.resetIssueForm();
      }
    });
  }

  get canCancel(): boolean {
    return !!this.order && this.order.status !== 'CANCELLED' && this.order.paidAmount === 0;
  }

  get canResume(): boolean {
    return !!this.order && (this.order.status === 'OPEN' || this.order.status === 'HELD');
  }

  /** A cancelled (or missing) bill on a completed order can be (re)issued. */
  get canIssueBill(): boolean {
    return !!this.order && this.order.status === 'COMPLETED' && this.order.paymentStatus !== 'REFUNDED'
      && (!this.bill || this.bill.status === 'CANCELLED');
  }

  addonText(addons: { name: string; quantity: number }[]): string {
    return addons.map(a => a.quantity > 1 ? `${a.name} ×${a.quantity}` : a.name).join(', ');
  }

  // ---------- actions ----------

  saveDetails() {
    const d = this.details;
    this.run(this.ordersService.updateDetails(this.order!.uuid, {
      orderType: d.orderType,
      customerName: blankToNull(d.customerName) ?? undefined,
      customerPhone: blankToNull(d.customerPhone) ?? undefined,
      tableLabel: blankToNull(d.tableLabel) ?? undefined,
      notes: blankToNull(d.notes) ?? undefined,
    }), 'Details saved');
  }

  cancelOrder() {
    this.run(this.ordersService.cancel(this.order!.uuid, this.cancelReason.trim()), 'Order cancelled', () => {
      this.cancelOpen = false;
      this.cancelReason = '';
    });
  }

  resumeInTerminal() {
    this.router.navigate(['/pos'], { queryParams: { order: this.order!.uuid } });
  }

  openRefund(payment: PaymentView) {
    this.refundForm = { payment, amount: payment.refundableAmount, method: payment.method, reason: '' };
  }

  submitRefund() {
    const f = this.refundForm!;
    this.run(this.ordersService.refund(this.order!.uuid, f.payment.uuid, {
      clientRef: newClientRef(),
      amount: Number(f.amount),
      method: f.method,
      reason: f.reason.trim(),
    }), 'Refund recorded', () => this.refundForm = null);
  }

  private resetIssueForm() {
    this.issue = {
      customerName: this.order?.customerName ?? '',
      customerPhone: this.order?.customerPhone ?? '',
      customerGstin: '',
      placeOfSupply: '',
      series: '',
    };
  }

  openIssue() {
    this.resetIssueForm();
    this.issueOpen = true;
  }

  issueBill() {
    const i = this.issue;
    this.busy = true;
    this.error = null;
    this.billingService.issueBill({
      orderUuid: this.order!.uuid,
      customerName: blankToNull(i.customerName) ?? undefined,
      customerPhone: blankToNull(i.customerPhone) ?? undefined,
      customerGstin: blankToNull(i.customerGstin)?.toUpperCase() ?? undefined,
      placeOfSupply: blankToNull(i.placeOfSupply) ?? undefined,
      series: blankToNull(i.series)?.toUpperCase() ?? undefined,
    }).subscribe({
      next: bill => {
        this.busy = false;
        this.bill = bill;
        this.issueOpen = false;
        this.toastService.show(`Bill ${bill.billNumber} issued`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.error = readApiError(err).message;
      }
    });
  }

  private run(request$: Observable<OrderView>, successMessage: string, after?: () => void) {
    this.busy = true;
    this.error = null;
    request$.subscribe({
      next: order => {
        this.busy = false;
        this.setOrder(order);
        after?.();
        this.toastService.show(successMessage, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.error = readApiError(err).message;
        // Changed on another device: show the latest version
        if (err.status === 409 || err.status === 404) this.load();
      }
    });
  }
}
