import { Component, Input } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ShiftView } from './shifts.models';
import { label } from '../orders/order-utils';

/**
 * The cash tally of a shift: opening + cash sales + cash in − cash out = expected; counted − expected = difference.
 * `showExpected` is off during the count, so the cashier counts blind.
 */
@Component({
  selector: 'app-shift-summary',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-5">
      <div class="text-ez-sm text-ez-secondary">
        Opened {{ shift.openedAt | date:'EEE d MMM, h:mm a' }} by {{ who(shift.openedBy) }}
        @if (shift.closedAt) { · closed {{ shift.closedAt | date:'h:mm a' }} by {{ who(shift.closedBy) }} }
        @if (shift.openingNotes) { <p class="text-ez-xs text-ez-muted italic">"{{ shift.openingNotes }}"</p> }
      </div>

      <!-- Cash tally -->
      <section class="ez-surface p-4 space-y-1.5 text-ez-sm tabular-nums">
        <h3 class="ez-micro-label mb-2">Cash drawer</h3>
        <div class="flex justify-between text-ez-secondary"><span>Opening cash</span><span>{{ shift.openingCash | currency:'INR' }}</span></div>
        <div class="flex justify-between text-ez-secondary"><span>+ Cash sales <span class="text-ez-xs">(less cash refunds)</span></span><span>{{ shift.cashSales | currency:'INR' }}</span></div>
        <div class="flex justify-between text-ez-secondary"><span>+ Cash in</span><span>{{ shift.cashIn | currency:'INR' }}</span></div>
        <div class="flex justify-between text-ez-secondary"><span>− Cash out</span><span>{{ shift.cashOut | currency:'INR' }}</span></div>
        @if (showExpected) {
        <div class="flex justify-between font-medium text-ez-heading pt-2 border-t border-ez-border">
          <span>Expected in drawer</span><span>{{ shift.expectedCash | currency:'INR' }}</span>
        </div>
        }
        @if (shift.countedCash !== null) {
        <div class="flex justify-between font-medium text-ez-heading"><span>Counted</span><span>{{ shift.countedCash | currency:'INR' }}</span></div>
        <div class="flex justify-between font-medium text-ez-md pt-1" [class]="differenceClass(shift.cashDifference)">
          <span>{{ differenceLabel(shift.cashDifference) }}</span>
          <span>{{ (shift.cashDifference ?? 0) > 0 ? '+' : '' }}{{ shift.cashDifference | currency:'INR' }}</span>
        </div>
        }
        @if (shift.closingNotes) { <p class="text-ez-xs text-ez-muted italic pt-1">"{{ shift.closingNotes }}"</p> }
      </section>

      <!-- Sales during the shift -->
      <section>
        <div class="flex justify-between items-baseline mb-2">
          <h3 class="ez-micro-label">Sales during the shift</h3>
          <span class="text-ez-sm text-ez-secondary">{{ shift.completedOrders }} orders · <span class="font-medium text-ez-heading">{{ shift.netSales | currency:'INR' }}</span></span>
        </div>
        @if (shift.payments.length) {
        <table class="w-full text-ez-sm tabular-nums">
          <thead class="text-left">
            <tr class="border-b border-ez-border">
              <th class="py-1.5 ez-micro-label">Mode</th>
              <th class="py-1.5 ez-micro-label text-right">Received</th>
              <th class="py-1.5 ez-micro-label text-right">Refunded</th>
              <th class="py-1.5 ez-micro-label text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            @for (p of shift.payments; track p.method) {
            <tr class="border-b border-ez-border last:border-b-0">
              <td class="py-1.5 text-ez-heading">{{ label(p.method) }} <span class="text-ez-xs text-ez-muted">×{{ p.paymentCount }}</span></td>
              <td class="py-1.5 text-right text-ez-secondary">{{ p.paymentAmount | currency:'INR' }}</td>
              <td class="py-1.5 text-right text-ez-secondary">{{ p.refundAmount ? '-' : '' }}{{ p.refundAmount | currency:'INR' }}</td>
              <td class="py-1.5 text-right font-medium text-ez-heading">{{ p.netAmount | currency:'INR' }}</td>
            </tr>
            }
          </tbody>
        </table>
        } @else {
        <p class="text-ez-sm text-ez-muted">No payments yet.</p>
        }
      </section>

      <!-- Cash in / out -->
      <section>
        <h3 class="ez-micro-label mb-2">Cash in / out</h3>
        @for (m of shift.movements; track m.uuid) {
        <div class="flex items-center gap-3 py-1.5 border-b border-ez-border last:border-b-0 text-ez-sm">
          <span class="w-10 text-ez-xs font-medium" [class]="m.type === 'IN' ? 'text-green-700' : 'text-red-600'">{{ m.type }}</span>
          <span class="flex-1 min-w-0 truncate text-ez-heading">{{ m.reason }}</span>
          <span class="text-ez-xs text-ez-muted">{{ m.movedAt | date:'h:mm a' }} · {{ who(m.createdBy) }}</span>
          <span class="w-20 text-right tabular-nums font-medium" [class]="m.type === 'IN' ? 'text-ez-heading' : 'text-red-600'">
            {{ m.type === 'OUT' ? '-' : '' }}{{ m.amount | currency:'INR' }}
          </span>
        </div>
        } @empty {
        <p class="text-ez-sm text-ez-muted">None.</p>
        }
      </section>
    </div>
  `
})
export class ShiftSummaryComponent {
  @Input({ required: true }) shift!: ShiftView;
  @Input() showExpected = true;
  readonly label = label;

  who(userUuid: string | null): string {
    if (!userUuid) return '-';
    return userUuid === sessionStorage.getItem('currentUserUuid') ? 'you' : userUuid.slice(0, 8);
  }

  differenceLabel(diff: number | null): string {
    if (!diff) return 'Tallied';
    return diff < 0 ? 'Short' : 'Excess';
  }

  differenceClass(diff: number | null): string {
    if (!diff) return 'text-green-700';
    return diff < 0 ? 'text-red-600' : 'text-amber-700';
  }
}
