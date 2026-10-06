import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, ArrowLeft } from 'lucide-angular';
import { ShiftService } from './shift.service';
import { ShiftView } from './shifts.models';
import { ShiftSummaryComponent } from './shift-summary.component';
import { readApiError } from '../catalog/catalog-errors';

@Component({
  selector: 'app-shift-detail',
  standalone: true,
  imports: [DatePipe, RouterModule, LucideAngularModule, ShiftSummaryComponent],
  template: `
    <div class="p-6 max-w-2xl">
      <div class="flex items-center gap-3 mb-6">
        <a routerLink="/reports/shifts" class="text-ez-secondary hover:text-ez-heading" title="Back to shift history">
          <lucide-icon [img]="icons.back" class="w-5 h-5"></lucide-icon>
        </a>
        <h1 class="text-ez-2xl font-medium text-ez-heading">Shift {{ shift ? (shift.openedAt | date:'d MMM y') : '' }}</h1>
        @if (shift) {
        <span class="px-2 py-0.5 text-ez-xs font-medium"
          [class]="shift.status === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-ez-ash text-ez-secondary'">{{ shift.status }}</span>
        }
      </div>
      @if (shift) {
      <app-shift-summary [shift]="shift" [showExpected]="shift.status === 'CLOSED'"></app-shift-summary>
      } @else {
      <p class="text-ez-sm text-ez-muted">Loading shift...</p>
      }
    </div>
  `
})
export class ShiftDetailComponent implements OnInit {
  private shiftService = inject(ShiftService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly icons = { back: ArrowLeft };
  shift: ShiftView | null = null;

  ngOnInit() {
    this.shiftService.getShift(this.route.snapshot.paramMap.get('uuid')!).subscribe({
      next: shift => this.shift = shift,
      error: (err: HttpErrorResponse) => {
        this.toastService.show(readApiError(err).message, 'error');
        this.router.navigate(['/reports/shifts']);
      }
    });
  }
}
