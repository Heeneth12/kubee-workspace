import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { EMPTY, expand, reduce } from 'rxjs';
import { ToastService } from 'kubee-ui';
import { OrdersService } from '../orders/orders.service';
import { OrderSummaryView } from '../orders/orders.models';
import { isoDate, label, orderStatusClass } from '../orders/order-utils';
import { readApiError } from '../catalog/catalog-errors';

interface DayStats {
  revenue: number;      // money kept: payments − refunds
  completed: number;
  avgTicket: number;
  open: number;         // open + held, still to be paid
  cancelled: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private toastService = inject(ToastService);

  readonly label = label;
  readonly orderStatusClass = orderStatusClass;

  stats: DayStats | null = null;
  recent: OrderSummaryView[] = [];

  ngOnInit() {
    const today = isoDate();
    const size = 200;
    this.ordersService.searchOrders({ from: today, to: today, size, page: 0 }).pipe(
      expand(res => res.page + 1 < res.totalPages
        ? this.ordersService.searchOrders({ from: today, to: today, size, page: res.page + 1 })
        : EMPTY),
      reduce((all, res) => [...all, ...res.content], [] as OrderSummaryView[]),
    ).subscribe({
      next: orders => {
        const completed = orders.filter(o => o.status === 'COMPLETED');
        const revenue = orders.reduce((sum, o) => sum + o.paidAmount, 0);
        this.stats = {
          revenue,
          completed: completed.length,
          avgTicket: completed.length ? completed.reduce((s, o) => s + o.grandTotal, 0) / completed.length : 0,
          open: orders.filter(o => o.status === 'OPEN' || o.status === 'HELD').length,
          cancelled: orders.filter(o => o.status === 'CANCELLED').length,
        };
        this.recent = orders.slice(0, 10);
      },
      error: (err: HttpErrorResponse) => this.toastService.show(readApiError(err).message, 'error')
    });
  }
}
