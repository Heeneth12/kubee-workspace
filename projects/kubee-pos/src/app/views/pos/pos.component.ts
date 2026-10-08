import { Component, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, Subject, catchError, concatMap, expand, forkJoin, reduce, tap } from 'rxjs';
import { ConfirmationModalService, ToastService } from 'kubee-ui';
import {
  LucideAngularModule, Search, Minus, Plus, Trash2, Package, Star, Pause, ListRestart, Percent, User, X, Pencil, CheckCircle2,
} from 'lucide-angular';
import { CatalogService } from '../catalog/catalog.service';
import { AddonGroup, Category, Item } from '../catalog/catalog.models';
import { OrdersService } from '../orders/orders.service';
import {
  DiscountType, OrderDetailsRequest, OrderLineRequest, OrderLineView, OrderSummaryView, OrderType, OrderView, PaymentMethod,
} from '../orders/orders.models';
import { ORDER_TYPES, label, newClientRef } from '../orders/order-utils';
import { BillingService } from '../billing/billing.service';
import { BillView } from '../billing/billing.models';
import { BillPanelComponent } from '../billing/bill-panel.component';
import { ItemOptionsComponent, itemAddonGroups } from './item-options.component';
import { readApiError } from '../catalog/catalog-errors';
import { AuthService } from '../../layouts/guards/auth.service';
import { PosPrivileges } from '../../layouts/guards/pos-permissions';

const CURRENT_ORDER_KEY = 'pos.currentOrderUuid';
const FAVOURITES = '__favourites__';

/** A change to the current order; gets the latest order when it runs (null = no sale yet). */
type OrderOp = (order: OrderView | null) => Observable<OrderView>;

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, DecimalPipe, LucideAngularModule, ItemOptionsComponent, BillPanelComponent],
  templateUrl: './pos.component.html',
})
export class PosComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private ordersService = inject(OrdersService);
  private billingService = inject(BillingService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmationModalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);

  readonly can = {
    discount: this.authService.hasPermission(PosPrivileges.BILLS_DISCOUNT),
    cancel: this.authService.hasPermission(PosPrivileges.ORDERS_CANCEL),
  };

  @ViewChild('searchBox') searchBox?: ElementRef<HTMLInputElement>;
  @ViewChild('tenderedBox') tenderedBox?: ElementRef<HTMLInputElement>;

  readonly icons = {
    search: Search, minus: Minus, plus: Plus, trash: Trash2, package: Package, star: Star, hold: Pause,
    held: ListRestart, discount: Percent, user: User, close: X, edit: Pencil, done: CheckCircle2,
  };
  readonly FAVOURITES = FAVOURITES;
  readonly orderTypes = ORDER_TYPES;
  readonly payMethods: PaymentMethod[] = ['CASH', 'UPI', 'CARD', 'WALLET'];
  readonly label = label;

  // ---------- catalog ----------
  items: Item[] = [];
  categories: Category[] = [];
  addonGroups = new Map<string, AddonGroup>();
  isLoading = false;
  searchQuery = '';
  selectedCategory = '';        // '' = all, FAVOURITES, or a top-level category uuid
  selectedSubCategory = '';

  // ---------- current sale ----------
  order: OrderView | null = null;
  busy = false;
  pendingOps = 0;
  private ops$ = new Subject<OrderOp>();

  details = { orderType: 'COUNTER' as OrderType, customerName: '', customerPhone: '', tableLabel: '' };
  detailsOpen = false;

  discountOpen = false;
  discountForm = { type: 'PERCENT' as DiscountType, value: null as number | null, reason: '' };

  editingLine: OrderLineView | null = null;
  lineForm = { quantity: 1, discountType: '' as DiscountType | '', discountValue: null as number | null, notes: '' };

  optionsItem: Item | null = null;
  optionsVariantUuid: string | null = null;

  // ---------- payment ----------
  payMethod: PaymentMethod = 'CASH';
  tendered: number | null = null;
  payAmount: number | null = null;
  referenceNo = '';

  // ---------- held orders ----------
  heldOpen = false;
  heldOrders: OrderSummaryView[] = [];
  heldCount = 0;

  // ---------- completed sale ----------
  bill: BillView | null = null;
  billError: string | null = null;
  issuingBill = false;

  ngOnInit() {
    // Run order changes one at a time, each on the latest order (fast taps never create two orders)
    this.ops$.pipe(
      concatMap(op => op(this.order).pipe(
        tap(order => this.setOrder(order)),
        catchError((err: HttpErrorResponse) => {
          this.onOrderError(err);
          return EMPTY;
        }),
        tap({ finalize: () => { this.pendingOps--; this.busy = this.pendingOps > 0; } }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.loadCatalog();
    this.refreshHeldCount();
    this.restoreOrder();
  }

  // ======================= catalog =======================

  private loadCatalog() {
    this.isLoading = true;
    forkJoin({
      categories: this.catalogService.listCategories(true),
      addonGroups: this.catalogService.listAddonGroups(true),
      items: this.loadAllActiveItems(),
    }).subscribe({
      next: ({ categories, addonGroups, items }) => {
        this.categories = categories;
        this.addonGroups = new Map(addonGroups.map(g => [g.uuid, g]));
        this.items = items;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  /** Active items, paging through when there are more than 500. */
  private loadAllActiveItems(): Observable<Item[]> {
    const size = 500;
    return this.catalogService.searchItems({ active: true, size, page: 0 }).pipe(
      expand(res => res.page + 1 < res.totalPages
        ? this.catalogService.searchItems({ active: true, size, page: res.page + 1 })
        : EMPTY),
      reduce((all, res) => [...all, ...res.content], [] as Item[]),
    );
  }

  get topCategories(): Category[] {
    return this.categories.filter(c => !c.parentUuid);
  }

  get subCategories(): Category[] {
    return this.selectedCategory && this.selectedCategory !== FAVOURITES
      ? this.categories.filter(c => c.parentUuid === this.selectedCategory)
      : [];
  }

  selectCategory(uuid: string) {
    this.selectedCategory = uuid;
    this.selectedSubCategory = '';
  }

  get filteredItems(): Item[] {
    const q = this.searchQuery.trim().toLowerCase();
    let allowed: Set<string> | null = null;
    if (this.selectedSubCategory) {
      allowed = new Set([this.selectedSubCategory]);
    } else if (this.selectedCategory && this.selectedCategory !== FAVOURITES) {
      allowed = new Set([this.selectedCategory, ...this.subCategories.map(c => c.uuid)]);
    }
    return this.items.filter(i =>
      (this.selectedCategory !== FAVOURITES || i.favourite) &&
      (!allowed || (i.categoryUuid !== null && allowed.has(i.categoryUuid))) &&
      (!q || i.name.toLowerCase().includes(q) || i.itemCode?.toLowerCase() === q || i.barcode === q
        || i.variants.some(v => v.itemCode?.toLowerCase() === q || v.barcode === q))
    );
  }

  /** Scanner / Enter in the search box: look the code up on the server and add it. */
  onSearchEnter() {
    const code = this.searchQuery.trim();
    if (!code) return;
    this.catalogService.lookupItem(code).subscribe({
      next: ({ item, matchedVariantUuid }) => {
        this.searchQuery = '';
        this.pickItem(item, matchedVariantUuid);
      },
      error: () => {
        // Not a code: if the name search has exactly one hit, add that
        const matches = this.filteredItems;
        if (matches.length === 1) {
          this.searchQuery = '';
          this.pickItem(matches[0], null);
        } else {
          this.toastService.show(`No available item with code "${code}"`, 'warning');
        }
      }
    });
  }

  pickItem(item: Item, variantUuid: string | null) {
    if (this.order && this.order.status !== 'OPEN') return;
    const needsChoice = item.openPrice
      || (item.hasVariants && !variantUuid)
      || itemAddonGroups(item, this.addonGroups).length > 0;
    if (needsChoice) {
      this.optionsItem = item;
      this.optionsVariantUuid = variantUuid;
    } else {
      this.addLine({ itemUuid: item.uuid, variantUuid: variantUuid ?? undefined });
    }
  }

  onOptionsConfirm(line: OrderLineRequest) {
    this.optionsItem = null;
    this.addLine(line);
  }

  foodDot(item: Item): string {
    return item.foodType === 'VEG' ? 'bg-green-600' : item.foodType === 'EGG' ? 'bg-amber-500' : 'bg-red-600';
  }

  // ======================= order =======================

  private enqueue(op: OrderOp) {
    this.pendingOps++;
    this.busy = true;
    this.ops$.next(op);
  }

  private setOrder(order: OrderView) {
    this.order = order;
    localStorage.setItem(CURRENT_ORDER_KEY, order.uuid);
    this.details = {
      orderType: order.orderType,
      customerName: order.customerName ?? '',
      customerPhone: order.customerPhone ?? '',
      tableLabel: order.tableLabel ?? '',
    };
    if (this.payAmount === null || this.payAmount > order.dueAmount) this.payAmount = order.dueAmount || null;
    if (order.status === 'COMPLETED' && !this.bill && !this.issuingBill) this.issueBill();
  }

  private onOrderError(err: HttpErrorResponse) {
    const apiError = readApiError(err);
    this.toastService.show(apiError.message, err.status === 422 ? 'warning' : 'error');
    if (!this.order) return;
    if (err.status === 409) {
      this.reloadOrder();      // changed on another device: show the latest version
    } else if (err.status === 404) {
      this.resetSale();
    }
  }

  private reloadOrder() {
    if (!this.order) return;
    this.ordersService.getOrder(this.order.uuid).subscribe({ next: o => this.setOrder(o), error: () => this.resetSale() });
  }

  /** Resume the order passed as ?order= (from Orders) or the one this terminal was working on. */
  private restoreOrder() {
    const fromQuery = this.route.snapshot.queryParamMap.get('order');
    const uuid = fromQuery ?? localStorage.getItem(CURRENT_ORDER_KEY);
    if (!uuid) return;
    if (fromQuery) this.router.navigate([], { queryParams: {}, replaceUrl: true });

    this.ordersService.getOrder(uuid).subscribe({
      next: order => {
        if (order.status === 'HELD') {
          this.enqueue(() => this.ordersService.recall(order.uuid));
        } else if (order.status === 'OPEN' || (fromQuery && order.status === 'COMPLETED')) {
          this.setOrder(order);
        } else {
          localStorage.removeItem(CURRENT_ORDER_KEY);
        }
      },
      error: () => localStorage.removeItem(CURRENT_ORDER_KEY),
    });
  }

  private detailsRequest(): OrderDetailsRequest {
    const d = this.details;
    return {
      orderType: d.orderType,
      customerName: d.customerName.trim() || undefined,
      customerPhone: d.customerPhone.replace(/\D/g, '') || undefined,
      tableLabel: d.tableLabel.trim() || undefined,
    };
  }

  addLine(line: OrderLineRequest) {
    this.enqueue(order => order && order.status === 'OPEN'
      ? this.ordersService.addLine(order.uuid, line)
      : this.ordersService.createOrder({ clientRef: newClientRef(), ...this.detailsRequest(), lines: [line] }));
  }

  changeQty(line: OrderLineView, delta: number) {
    const quantity = +(line.quantity + delta).toFixed(3);
    if (quantity <= 0) {
      this.removeLine(line);
      return;
    }
    // PATCH is a full replace: keep the line's discount and note
    this.enqueue(order => this.ordersService.changeLine(order!.uuid, line.uuid, {
      quantity,
      discountType: line.discountType ?? undefined,
      discountValue: line.discountValue ?? undefined,
      notes: line.notes ?? undefined,
    }));
  }

  removeLine(line: OrderLineView) {
    this.enqueue(order => this.ordersService.removeLine(order!.uuid, line.uuid));
  }

  openLineEditor(line: OrderLineView) {
    if (this.order?.status !== 'OPEN') return;
    this.editingLine = line;
    this.lineForm = {
      quantity: line.quantity,
      discountType: line.discountType ?? '',
      discountValue: line.discountValue,
      notes: line.notes ?? '',
    };
  }

  saveLine() {
    const line = this.editingLine!;
    const f = this.lineForm;
    const hasDiscount = !!f.discountType && f.discountValue !== null && Number(f.discountValue) > 0;
    this.editingLine = null;
    this.enqueue(order => this.ordersService.changeLine(order!.uuid, line.uuid, {
      quantity: Number(f.quantity),
      discountType: hasDiscount ? f.discountType as DiscountType : undefined,
      discountValue: hasDiscount ? Number(f.discountValue) : undefined,
      notes: f.notes.trim() || undefined,
    }));
  }

  addonText(line: OrderLineView): string {
    return line.addons.map(a => a.quantity > 1 ? `${a.name} ×${a.quantity}` : a.name).join(', ');
  }

  saveDetails() {
    if (this.order && this.order.status !== 'CANCELLED') {
      this.enqueue(order => this.ordersService.updateDetails(order!.uuid, this.detailsRequest()));
    }
  }

  setOrderType(type: OrderType) {
    this.details.orderType = type;
    this.saveDetails();
  }

  // ---------- bill discount ----------

  openDiscount() {
    if (!this.can.discount) return;
    this.discountForm = {
      type: this.order?.discountType ?? 'PERCENT',
      value: this.order?.discountValue ?? null,
      reason: this.order?.discountReason ?? '',
    };
    this.discountOpen = true;
  }

  applyDiscount() {
    if (!this.can.discount) return;
    const f = this.discountForm;
    if (f.value === null || Number(f.value) <= 0) return;
    this.discountOpen = false;
    this.enqueue(order => this.ordersService.setDiscount(order!.uuid, {
      type: f.type, value: Number(f.value), reason: f.reason.trim() || undefined,
    }));
  }

  removeDiscount() {
    if (!this.can.discount) return;
    this.discountOpen = false;
    this.enqueue(order => this.ordersService.removeDiscount(order!.uuid));
  }

  // ---------- payment ----------

  selectPayMethod(method: PaymentMethod) {
    this.payMethod = method;
    this.payAmount = this.order?.dueAmount ?? null;
    this.referenceNo = '';
    if (method === 'CASH') setTimeout(() => this.tenderedBox?.nativeElement.focus());
  }

  /** Quick cash buttons: exact due, then the next round notes. */
  get cashSuggestions(): number[] {
    const due = this.order?.dueAmount ?? 0;
    if (!due) return [];
    const values = [due, ...[50, 100, 200, 500, 2000].map(n => Math.ceil(due / n) * n)];
    return [...new Set(values)].filter(v => v >= due).slice(0, 4);
  }

  /** Preview only; the server returns the real change. */
  get changePreview(): number {
    return Math.max(0, (this.tendered ?? 0) - (this.order?.dueAmount ?? 0));
  }

  get canPay(): boolean {
    if (!this.order || this.order.status !== 'OPEN' || !this.order.lines.length || this.order.dueAmount <= 0) return false;
    return this.payMethod === 'CASH'
      ? (this.tendered ?? 0) > 0
      : (this.payAmount ?? 0) > 0 && (this.payAmount ?? 0) <= this.order.dueAmount;
  }

  pay() {
    if (!this.canPay) return;
    const clientRef = newClientRef(); // one per tap: a retry never charges twice
    const body = this.payMethod === 'CASH'
      ? { clientRef, method: this.payMethod, tenderedAmount: Number(this.tendered) }
      : { clientRef, method: this.payMethod, amount: Number(this.payAmount), referenceNo: this.referenceNo.trim() || undefined };
    this.tendered = null;
    this.referenceNo = '';
    this.enqueue(order => this.ordersService.addPayment(order!.uuid, body));
  }

  /** Orders whose total is 0 don't complete themselves. */
  completeZero() {
    this.enqueue(order => this.ordersService.complete(order!.uuid));
  }

  /** Cash change from the payment that completed the sale. */
  get lastChange(): number {
    const cash = [...(this.order?.payments ?? [])].reverse().find(p => p.type === 'PAYMENT' && p.changeAmount);
    return cash?.changeAmount ?? 0;
  }

  // ---------- bill ----------

  issueBill() {
    if (!this.order) return;
    this.issuingBill = true;
    this.billError = null;
    this.billingService.issueBill({ orderUuid: this.order.uuid }).subscribe({
      next: bill => {
        this.issuingBill = false;
        this.bill = bill;
      },
      error: (err: HttpErrorResponse) => {
        this.issuingBill = false;
        this.billError = readApiError(err).message;
      }
    });
  }

  // ---------- hold / recall / cancel ----------

  hold() {
    if (!this.order?.lines.length) return;
    const number = this.order.orderNumber;
    this.enqueue(order => this.ordersService.hold(order!.uuid).pipe(tap(() => {
      this.toastService.show(`Order #${number} held`, 'info');
      // Defer so setOrder() runs first, then clear the screen
      setTimeout(() => { this.resetSale(); this.refreshHeldCount(); });
    })));
  }

  refreshHeldCount() {
    this.ordersService.searchOrders({ status: 'HELD', size: 1 }).subscribe({
      next: res => this.heldCount = res.totalElements,
      error: () => { /* badge only */ }
    });
  }

  openHeld() {
    this.heldOpen = true;
    this.ordersService.searchOrders({ status: 'HELD', size: 100 }).subscribe({
      next: res => {
        this.heldOrders = res.content;
        this.heldCount = res.totalElements;
      },
      error: (err: HttpErrorResponse) => this.toastService.show(readApiError(err).message, 'error')
    });
  }

  recall(held: OrderSummaryView) {
    this.heldOpen = false;
    const current = this.order;
    // Park the current sale first so nothing is lost
    if (current && current.status === 'OPEN' && current.lines.length) {
      this.enqueue(order => this.ordersService.hold(order!.uuid));
    }
    this.enqueue(() => this.ordersService.recall(held.uuid).pipe(tap(() => this.resetPayment())));
    setTimeout(() => this.refreshHeldCount(), 500);
  }

  async cancelSale() {
    if (!this.can.cancel) return;
    if (!this.order) return;
    if (this.order.paidAmount > 0) {
      this.toastService.show('Money has been taken on this order. Refund it from Orders before cancelling.', 'warning');
      return;
    }
    const confirmed = await this.confirmService.open({
      title: 'Cancel sale',
      message: `Cancel order #${this.order.orderNumber}? It stays in Orders as cancelled.`,
      intent: 'delete',
      confirmLabel: 'Cancel sale',
      cancelLabel: 'Keep',
    });
    if (!confirmed) return;
    this.enqueue(order => this.ordersService.cancel(order!.uuid, 'Cancelled at terminal').pipe(
      tap(() => setTimeout(() => this.resetSale()))
    ));
  }

  /** Clears the screen for the next customer. */
  resetSale() {
    this.order = null;
    this.bill = null;
    this.billError = null;
    this.issuingBill = false;
    this.discountOpen = false;
    this.detailsOpen = false;
    this.editingLine = null;
    this.details = { orderType: 'COUNTER', customerName: '', customerPhone: '', tableLabel: '' };
    this.resetPayment();
    localStorage.removeItem(CURRENT_ORDER_KEY);
    setTimeout(() => this.searchBox?.nativeElement.focus());
  }

  private resetPayment() {
    this.payMethod = 'CASH';
    this.tendered = null;
    this.payAmount = null;
    this.referenceNo = '';
  }

  // ---------- keyboard ----------

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent) {
    if (event.key === 'F2' || event.key === 'F3') {
      event.preventDefault();
      if (this.order?.status === 'OPEN') this.selectPayMethod(event.key === 'F2' ? 'CASH' : 'UPI');
    } else if (event.key === 'Escape') {
      this.optionsItem = null;
      this.editingLine = null;
      this.heldOpen = false;
      this.discountOpen = false;
    }
  }
}
