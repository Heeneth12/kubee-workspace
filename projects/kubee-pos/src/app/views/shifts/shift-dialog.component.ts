import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, X, ArrowDownToLine, ArrowUpFromLine, Lock, Wallet } from 'lucide-angular';
import { ShiftService } from './shift.service';
import { CashMovementType, ShiftView } from './shifts.models';
import { ShiftSummaryComponent } from './shift-summary.component';
import { readApiError } from '../catalog/catalog-errors';

type Step = 'view' | 'movement' | 'count';

/** Open / cash in-out / close the shop's cash-drawer shift. Shown from the header; opened via ShiftService. */
@Component({
  selector: 'app-shift-dialog',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterModule, LucideAngularModule, ShiftSummaryComponent],
  template: `
    @if (isOpen) {
    <div class="fixed inset-0 z-40 bg-ez-carbon/60 flex items-center justify-center p-4 sm:p-6" (click)="dismiss()">
      <div class="bg-ez-white w-full max-w-lg max-h-[92vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="h-14 px-5 flex items-center justify-between border-b border-ez-border shrink-0">
          <h2 class="text-ez-lg font-medium text-ez-heading flex items-center gap-2">
            <lucide-icon [img]="icons.wallet" class="w-5 h-5 text-ez-muted"></lucide-icon>
            {{ title }}
          </h2>
          <button (click)="dismiss()" class="text-ez-secondary hover:text-ez-heading outline-none">
            <lucide-icon [img]="icons.close" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          @if (error) {
          <div class="border border-red-200 bg-red-50 text-red-700 text-ez-sm px-4 py-3">{{ error }}</div>
          }

          <!-- Just closed: the result -->
          @if (closed) {
          <app-shift-summary [shift]="closed"></app-shift-summary>
          }

          <!-- No shift: open one -->
          @else if (shift === null) {
          <p class="text-ez-sm text-ez-secondary">Count the cash in the drawer before the first sale. Billing works without a shift, but then there's no cash tally at day end.</p>
          <div>
            <label class="ez-label">Opening cash in drawer <span class="text-red-500">*</span></label>
            <div class="flex bg-white border border-ez-border focus-within:border-ez-primary">
              <span class="flex items-center pl-3 text-ez-muted">₹</span>
              <input type="number" min="0" step="1" [(ngModel)]="openingCash" (keydown.enter)="open()" autofocus
                class="flex-1 min-w-0 px-3 py-2 bg-transparent text-ez-lg text-ez-heading outline-none">
            </div>
          </div>
          <div>
            <label class="ez-label">Note</label>
            <input type="text" [(ngModel)]="notes" placeholder="e.g. morning shift" class="ez-input ez-input--default w-full">
          </div>
          }

          <!-- Open shift -->
          @else if (shift) {
          @switch (step) {
          @case ('movement') {
          <div class="flex border border-ez-border">
            @for (type of movementTypes; track type) {
            <button (click)="movementType = type" class="flex-1 py-2 text-ez-sm font-medium transition-colors duration-ez flex items-center justify-center gap-2"
              [class]="movementType === type ? 'bg-ez-carbon text-white' : 'bg-ez-white text-ez-body hover:text-ez-heading'">
              <lucide-icon [img]="type === 'IN' ? icons.cashIn : icons.cashOut" class="w-4 h-4"></lucide-icon>
              {{ type === 'IN' ? 'Cash in' : 'Cash out' }}
            </button>
            }
          </div>
          <p class="text-ez-xs text-ez-muted">
            {{ movementType === 'IN' ? 'Float or change added to the drawer.' : 'Cash paid out of the drawer, e.g. to a supplier.' }}
          </p>
          <div>
            <label class="ez-label">Amount <span class="text-red-500">*</span></label>
            <div class="flex bg-white border border-ez-border focus-within:border-ez-primary">
              <span class="flex items-center pl-3 text-ez-muted">₹</span>
              <input type="number" min="1" step="1" [(ngModel)]="movementAmount" autofocus
                class="flex-1 min-w-0 px-3 py-2 bg-transparent text-ez-lg text-ez-heading outline-none">
            </div>
          </div>
          <div>
            <label class="ez-label">Reason <span class="text-red-500">*</span></label>
            <input type="text" [(ngModel)]="movementReason" (keydown.enter)="addMovement()"
              [placeholder]="movementType === 'IN' ? 'e.g. Change from bank' : 'e.g. Milk supplier'" class="ez-input ez-input--default w-full">
          </div>
          }
          @case ('count') {
          <p class="text-ez-sm text-ez-secondary">Count all the cash in the drawer and enter the total. The expected amount is shown after you close.</p>
          <div>
            <label class="ez-label">Counted cash <span class="text-red-500">*</span></label>
            <div class="flex bg-white border border-ez-border focus-within:border-ez-primary">
              <span class="flex items-center pl-3 text-ez-muted">₹</span>
              <input type="number" min="0" step="1" [(ngModel)]="countedCash" autofocus
                class="flex-1 min-w-0 px-3 py-2 bg-transparent text-ez-lg text-ez-heading outline-none">
            </div>
          </div>
          <div>
            <label class="ez-label">Note</label>
            <input type="text" [(ngModel)]="notes" placeholder="e.g. 50 short, gave extra change" class="ez-input ez-input--default w-full">
          </div>
          <p class="text-ez-xs text-amber-700">A closed shift can't be reopened or changed.</p>
          }
          @default {
          <app-shift-summary [shift]="shift" [showExpected]="false"></app-shift-summary>
          }
          }
          } @else {
          <p class="text-ez-sm text-ez-muted">Checking the cash drawer...</p>
          }
        </div>

        <!-- Footer actions -->
        <div class="border-t border-ez-border p-4 flex flex-wrap gap-2 shrink-0">
          @if (closed) {
          <a [routerLink]="['/shifts', closed.uuid]" (click)="finish()" class="ez-btn ez-btn-secondary">Details</a>
          <button (click)="finish()" class="ez-btn ez-btn-primary flex-1">Done</button>
          } @else if (shift === null) {
          <button (click)="dismiss()" class="ez-btn ez-btn-secondary">Not now</button>
          <button (click)="open()" [disabled]="busy || openingCash === null || openingCash < 0" class="ez-btn ez-btn-primary flex-1">Open shift</button>
          } @else if (shift) {
          @switch (step) {
          @case ('movement') {
          <button (click)="step = 'view'" class="ez-btn ez-btn-secondary">Back</button>
          <button (click)="addMovement()" [disabled]="busy || !movementAmount || movementAmount <= 0 || !movementReason.trim()" class="ez-btn ez-btn-primary flex-1">
            Record {{ movementType === 'IN' ? 'cash in' : 'cash out' }}{{ movementAmount ? ' · ' + (movementAmount | currency:'INR') : '' }}
          </button>
          }
          @case ('count') {
          <button (click)="step = 'view'" class="ez-btn ez-btn-secondary">Back</button>
          <button (click)="close()" [disabled]="busy || countedCash === null || countedCash < 0" class="ez-btn ez-btn-primary flex-1">
            <lucide-icon [img]="icons.lock" class="w-4 h-4"></lucide-icon> Close shift
          </button>
          }
          @default {
          <button (click)="startMovement('IN')" class="ez-btn ez-btn-secondary">
            <lucide-icon [img]="icons.cashIn" class="w-4 h-4"></lucide-icon> Cash in
          </button>
          <button (click)="startMovement('OUT')" class="ez-btn ez-btn-secondary">
            <lucide-icon [img]="icons.cashOut" class="w-4 h-4"></lucide-icon> Cash out
          </button>
          <button (click)="startCount()" class="ez-btn ez-btn-primary flex-1">
            <lucide-icon [img]="icons.lock" class="w-4 h-4"></lucide-icon> Close shift
          </button>
          }
          }
          }
        </div>
      </div>
    </div>
    }
  `
})
export class ShiftDialogComponent implements OnInit {
  private shiftService = inject(ShiftService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly icons = { close: X, cashIn: ArrowDownToLine, cashOut: ArrowUpFromLine, lock: Lock, wallet: Wallet };
  readonly movementTypes: CashMovementType[] = ['IN', 'OUT'];

  isOpen = false;
  shift: ShiftView | null | undefined = undefined;
  closed: ShiftView | null = null;
  step: Step = 'view';
  busy = false;
  error: string | null = null;

  openingCash: number | null = null;
  notes = '';
  movementType: CashMovementType = 'OUT';
  movementAmount: number | null = null;
  movementReason = '';
  countedCash: number | null = null;

  ngOnInit() {
    this.shiftService.current$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(shift => this.shift = shift);
    this.shiftService.dialogOpen$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(open => {
      const opening = open && !this.isOpen;
      this.isOpen = open;
      if (opening) this.onShow();
    });
  }

  get title(): string {
    if (this.closed) return 'Shift closed';
    if (this.shift === null) return 'Open shift';
    if (this.step === 'movement') return 'Cash in / out';
    if (this.step === 'count') return 'Close shift: count cash';
    return 'Current shift';
  }

  /** Fresh live figures every time the dialog opens. */
  private onShow() {
    this.step = 'view';
    this.closed = null;
    this.error = null;
    this.notes = '';
    this.openingCash = null;
    this.shiftService.refreshCurrent().subscribe({
      error: (err: HttpErrorResponse) => this.error = readApiError(err).message,
    });
  }

  dismiss() {
    if (this.closed) {
      this.finish();
      return;
    }
    if (this.shift === null) sessionStorage.setItem(SHIFT_PROMPT_DISMISSED, '1');
    this.shiftService.closeDialog();
  }

  finish() {
    this.closed = null;
    this.shiftService.closeDialog();
  }

  open() {
    if (this.openingCash === null || this.openingCash < 0) return;
    this.run(this.shiftService.openShift({ openingCash: Number(this.openingCash), notes: this.notes.trim() || undefined }), shift => {
      this.toastService.show(`Shift opened with ${formatInr(shift.openingCash)}`, 'success');
      this.shiftService.closeDialog();
    }, true);
  }

  startMovement(type: CashMovementType) {
    this.movementType = type;
    this.movementAmount = null;
    this.movementReason = '';
    this.error = null;
    this.step = 'movement';
  }

  addMovement() {
    if (!this.shift || !this.movementAmount || this.movementAmount <= 0 || !this.movementReason.trim()) return;
    const type = this.movementType;
    const amount = Number(this.movementAmount);
    this.run(this.shiftService.addCashMovement(this.shift.uuid, { type, amount, reason: this.movementReason.trim() }), () => {
      this.toastService.show(`Cash ${type === 'IN' ? 'in' : 'out'} of ${formatInr(amount)} recorded`, 'success');
      this.step = 'view';
    });
  }

  startCount() {
    this.countedCash = null;
    this.notes = '';
    this.error = null;
    this.step = 'count';
  }

  close() {
    if (!this.shift || this.countedCash === null || this.countedCash < 0) return;
    this.run(this.shiftService.closeShift(this.shift.uuid, {
      countedCash: Number(this.countedCash),
      notes: this.notes.trim() || undefined,
    }), shift => {
      this.closed = shift;
      this.step = 'view';
    });
  }

  private run(request$: Observable<ShiftView>, done: (shift: ShiftView) => void, refreshOnConflict = false) {
    this.busy = true;
    this.error = null;
    request$.subscribe({
      next: shift => {
        this.busy = false;
        done(shift);
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.error = readApiError(err).message;
        // 409 on open: someone else opened the drawer meanwhile; 422 on a movement: it was closed. Show the latest.
        if ((refreshOnConflict && err.status === 409) || err.status === 422) {
          this.shiftService.refreshCurrent().subscribe({ error: () => { } });
        }
      }
    });
  }
}

/** sessionStorage flag: the cashier chose "Not now" on the open-shift prompt this session. */
export const SHIFT_PROMPT_DISMISSED = 'pos.shiftPromptDismissed';

function formatInr(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}
