import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, Search, Minus, Plus, Trash2, Package } from 'lucide-angular';
import { PosService } from './pos.service';
import { CartLine, PaymentMethod, PosItem, PosOrder } from './pos.model';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, LucideAngularModule],
  templateUrl: './pos.component.html',
})
export class PosComponent implements OnInit {
  readonly icons = { search: Search, minus: Minus, plus: Plus, trash: Trash2, package: Package };
  readonly paymentMethods: PaymentMethod[] = ['CASH', 'CARD', 'UPI'];

  items: PosItem[] = [];
  isLoading = false;
  searchQuery = '';
  selectedCategory = 'All';

  cart: CartLine[] = [];
  discount = 0;
  paymentMethod: PaymentMethod = 'CASH';

  constructor(private posService: PosService, private toastService: ToastService) { }

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.isLoading = true;
    this.posService.getItems(0, 200, { active: true },
      (res: any) => {
        this.items = res?.data?.content ?? [];
        this.isLoading = false;
      },
      (err: any) => {
        this.isLoading = false;
        this.toastService.show(err?.error?.message ?? 'Failed to load items', 'error');
      }
    );
  }

  // Catalogue

  get categories(): string[] {
    return ['All', ...new Set(this.items.map(i => i.category).filter(Boolean))];
  }

  get filteredItems(): PosItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    return this.items.filter(i =>
      (this.selectedCategory === 'All' || i.category === this.selectedCategory) &&
      (!q || i.name.toLowerCase().includes(q) || i.itemCode?.toLowerCase().includes(q) || i.barcode === q)
    );
  }

  // Scanner / enter in search box: add exact barcode or item-code match directly
  onSearchEnter() {
    const q = this.searchQuery.trim().toLowerCase();
    const match = this.items.find(i => i.barcode?.toLowerCase() === q || i.itemCode?.toLowerCase() === q);
    if (match) {
      this.addToCart(match);
      this.searchQuery = '';
    }
  }

  // Cart

  addToCart(item: PosItem) {
    const line = this.cart.find(l => l.item.id === item.id);
    if (line) {
      line.quantity++;
    } else {
      this.cart.push({ item, quantity: 1 });
    }
  }

  changeQty(line: CartLine, delta: number) {
    line.quantity += delta;
    if (line.quantity <= 0) this.removeLine(line);
  }

  removeLine(line: CartLine) {
    this.cart = this.cart.filter(l => l !== line);
  }

  clearCart() {
    this.cart = [];
    this.discount = 0;
  }

  lineTotal(line: CartLine): number {
    return line.item.sellingPrice * line.quantity;
  }

  get subTotal(): number {
    return this.cart.reduce((sum, l) => sum + this.lineTotal(l), 0);
  }

  get taxTotal(): number {
    return this.cart.reduce((sum, l) => sum + this.lineTotal(l) * (l.item.taxPercentage ?? 0) / 100, 0);
  }

  get grandTotal(): number {
    return Math.max(0, this.subTotal + this.taxTotal - (this.discount || 0));
  }

  get itemCount(): number {
    return this.cart.reduce((sum, l) => sum + l.quantity, 0);
  }

  checkout() {
    if (!this.cart.length) return;
    const order: PosOrder = {
      orderNumber: 'POS-' + Date.now().toString().slice(-8),
      createdAt: new Date(),
      lines: this.cart.map(l => ({ ...l })),
      subTotal: this.subTotal,
      taxTotal: this.taxTotal,
      discount: this.discount || 0,
      grandTotal: this.grandTotal,
      paymentMethod: this.paymentMethod,
    };
    this.posService.saveOrder(order);
    this.toastService.show(`Order ${order.orderNumber} completed`, 'success');
    this.clearCart();
  }
}
