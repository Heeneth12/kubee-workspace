import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, Search, ChevronLeft, ChevronRight, ReceiptText } from 'lucide-angular';
import { OrdersService } from './orders.service';
import { OrderStatus, OrderSummaryView, OrderType, PaymentStatus } from './orders.models';
import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_STATUSES, isoDate, label, orderStatusClass, paymentStatusClass } from './order-utils';
import { readApiError } from '../catalog/catalog-errors';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DatePipe, RouterModule, LucideAngularModule],
  templateUrl: './orders.component.html',
})
export class OrdersComponent implements OnInit {
  private ordersService = inject(OrdersService);
  private toastService = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  readonly icons = { search: Search, prev: ChevronLeft, next: ChevronRight, empty: ReceiptText };
  readonly statuses = ORDER_STATUSES;
  readonly paymentStatuses = PAYMENT_STATUSES;
  readonly orderTypes = ORDER_TYPES;
  readonly label = label;
  readonly orderStatusClass = orderStatusClass;
  readonly paymentStatusClass = paymentStatusClass;
  readonly pageSize = 50;

  orders: OrderSummaryView[] = [];
  isLoading = false;

  search = '';
  status: OrderStatus | '' = '';
  paymentStatus: PaymentStatus | '' = '';
  orderType: OrderType | '' = '';
  from = isoDate();
  to = isoDate();

  page = 0;
  totalPages = 0;
  totalElements = 0;
  search$ = new Subject<string>();

  ngOnInit() {
    // Starting filters can come from a link, e.g. the GST report's "orders without a bill"
    const q = this.route.snapshot.queryParamMap;
    this.status = (q.get('status') as OrderStatus) ?? this.status;
    this.from = q.get('from') ?? this.from;
    this.to = q.get('to') ?? this.to;

    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
    this.loadOrders();
  }

  applyFilters() {
    this.page = 0;
    this.loadOrders();
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.page = page;
    this.loadOrders();
  }

  loadOrders() {
    this.isLoading = true;
    this.ordersService.searchOrders({
      search: this.search.trim() || undefined,
      status: this.status || undefined,
      paymentStatus: this.paymentStatus || undefined,
      orderType: this.orderType || undefined,
      from: this.from || undefined,
      to: this.to || undefined,
      page: this.page,
      size: this.pageSize,
    }).subscribe({
      next: result => {
        this.orders = result.content;
        this.totalPages = result.totalPages;
        this.totalElements = result.totalElements;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }
}
