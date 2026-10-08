import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, Printer, MessageCircle, Ban } from 'lucide-angular';
import { BillingService } from './billing.service';
import { BillView } from './billing.models';
import { BillReceiptComponent, printElement } from './bill-receipt.component';
import { readApiError } from '../catalog/catalog-errors';
import { AuthService } from '../../layouts/guards/auth.service';
import { PosPrivileges } from '../../layouts/guards/pos-permissions';

/** A bill with its actions: print, share on WhatsApp, cancel. Emits the updated bill after each action. */
@Component({
  selector: 'app-bill-panel',
  standalone: true,
  imports: [FormsModule, DatePipe, LucideAngularModule, BillReceiptComponent],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        @if (can.print) {
        <button type="button" (click)="print()" [disabled]="busy" class="ez-btn ez-btn-primary">
          <lucide-icon [img]="icons.print" class="w-4 h-4"></lucide-icon>
          {{ bill.printCount ? 'Reprint' : 'Print' }}
        </button>
        <button type="button" (click)="shareWhatsApp()" [disabled]="busy || bill.status === 'CANCELLED'" class="ez-btn ez-btn-secondary">
          <lucide-icon [img]="icons.share" class="w-4 h-4"></lucide-icon>
          WhatsApp
        </button>
        }
        @if (allowCancel && can.void && bill.status === 'ISSUED') {
        <button type="button" (click)="cancelOpen = !cancelOpen" [disabled]="busy" class="ez-btn ez-btn-secondary hover:!text-red-600">
          <lucide-icon [img]="icons.cancel" class="w-4 h-4"></lucide-icon>
          Cancel bill
        </button>
        }
        <span class="text-ez-xs text-ez-muted ml-auto">
          Printed {{ bill.printCount }}×{{ bill.sharedVia ? ' · sent via ' + bill.sharedVia.toLowerCase() : '' }}
        </span>
      </div>

      @if (cancelOpen) {
      <div class="border border-red-200 bg-red-50 p-3 space-y-2">
        <p class="text-ez-sm text-red-700">An issued bill never changes. Cancel it, then issue a new one (it gets the next number).</p>
        <div class="flex gap-2">
          <input type="text" [(ngModel)]="cancelReason" placeholder="Reason, e.g. B2B bill requested" class="ez-input ez-input--default flex-1">
          <button type="button" (click)="cancel()" [disabled]="busy || !cancelReason.trim()" class="ez-btn bg-red-600 text-white border-red-600">Confirm</button>
        </div>
      </div>
      }

      @if (bill.status === 'CANCELLED') {
      <p class="text-ez-sm text-red-600">
        Cancelled {{ bill.cancelledAt | date:'short' }}{{ bill.cancelReason ? ': ' + bill.cancelReason : '' }}
      </p>
      }

      <div #receipt class="border border-ez-border bg-white">
        <app-bill-receipt [bill]="bill"></app-bill-receipt>
      </div>
    </div>
  `
})
export class BillPanelComponent {
  private billingService = inject(BillingService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  readonly can = {
    print: this.authService.hasPermission(PosPrivileges.BILLS_PRINT),
    void: this.authService.hasPermission(PosPrivileges.BILLS_VOID),
  };

  @Input({ required: true }) bill!: BillView;
  @Input() allowCancel = true;
  @Output() billChange = new EventEmitter<BillView>();
  @ViewChild('receipt') receiptRef!: ElementRef<HTMLElement>;

  readonly icons = { print: Printer, share: MessageCircle, cancel: Ban };
  busy = false;
  cancelOpen = false;
  cancelReason = '';

  async print() {
    if (!this.can.print) return;
    const receipt = this.receiptRef.nativeElement.querySelector('.receipt') as HTMLElement;
    await printElement(receipt);
    this.run(this.billingService.markPrinted(this.bill.uuid));
  }

  shareWhatsApp() {
    if (!this.can.print) return;
    const b = this.bill;
    const lines = [
      `*${b.seller.name}*`,
      `Bill ${b.billNumber} · Token ${b.orderNumber}`,
      ...b.lines.map(l => `${l.itemName} x${l.quantity} = ₹${l.totalAmount.toFixed(2)}`),
      `*Total: ₹${b.grandTotal.toFixed(2)}*`,
      b.amountInWords,
    ];
    const phone = (b.buyer.phone ?? '').replace(/\D/g, '');
    const to = phone.length === 10 ? '91' + phone : phone;
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
    this.run(this.billingService.markShared(b.uuid, 'WHATSAPP'));
  }

  cancel() {
    if (!this.can.void) return;
    this.run(this.billingService.cancelBill(this.bill.uuid, this.cancelReason.trim()), 'Bill cancelled');
  }

  private run(request$: ReturnType<BillingService['markPrinted']>, successMessage?: string) {
    this.busy = true;
    request$.subscribe({
      next: bill => {
        this.busy = false;
        this.cancelOpen = false;
        this.cancelReason = '';
        this.bill = bill;
        this.billChange.emit(bill);
        if (successMessage) this.toastService.show(successMessage, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }
}
