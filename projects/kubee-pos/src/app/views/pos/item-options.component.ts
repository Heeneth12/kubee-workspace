import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Minus, Plus } from 'lucide-angular';
import { Addon, AddonGroup, Item, ItemVariant } from '../catalog/catalog.models';
import { OrderLineRequest } from '../orders/orders.models';

/**
 * Dialog shown before adding an item that needs choices: variant, add-ons (min/max per group),
 * open price. Emits the OrderLineRequest; the server re-checks everything.
 */
@Component({
  selector: 'app-item-options',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-40 bg-ez-carbon/60 flex items-end sm:items-center justify-center p-0 sm:p-6" (click)="cancel.emit()">
      <div class="bg-ez-white w-full sm:max-w-lg max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
        <div class="h-14 px-5 flex items-center justify-between border-b border-ez-border shrink-0">
          <h2 class="text-ez-lg font-medium text-ez-heading truncate">{{ item.name }}</h2>
          <button (click)="cancel.emit()" class="text-ez-secondary hover:text-ez-heading outline-none">
            <lucide-icon [img]="icons.close" class="w-5 h-5"></lucide-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-5">
          <!-- Variant -->
          @if (variants.length) {
          <div>
            <p class="ez-micro-label mb-2">Choose one <span class="text-red-500">*</span></p>
            <div class="grid grid-cols-2 gap-2">
              @for (v of variants; track v.uuid) {
              <button type="button" (click)="variantUuid = v.uuid"
                class="text-left p-3 border transition-colors duration-ez outline-none"
                [class]="variantUuid === v.uuid ? 'border-ez-primary bg-ez-primary-tint' : 'border-ez-border hover:border-ez-subtle'">
                <span class="block text-ez-base font-medium text-ez-heading">{{ v.name }}</span>
                <span class="block text-ez-sm text-ez-primary">{{ v.sellingPrice | currency:'INR' }}</span>
              </button>
              }
            </div>
          </div>
          }

          <!-- Open price -->
          @if (item.openPrice) {
          <div>
            <label class="ez-label">Price <span class="text-red-500">*</span></label>
            <div class="flex bg-white border border-ez-border focus-within:border-ez-primary">
              <span class="flex items-center pl-3 text-ez-muted">₹</span>
              <input type="number" min="0" step="0.01" [(ngModel)]="unitPrice" autofocus
                class="flex-1 min-w-0 px-3 py-2 bg-transparent text-ez-base text-ez-heading outline-none">
            </div>
          </div>
          }

          <!-- Add-on groups -->
          @for (group of groups; track group.uuid) {
          <div>
            <p class="ez-micro-label mb-2">
              {{ group.name }}
              <span class="normal-case tracking-normal font-normal" [class]="groupError(group) ? 'text-red-500' : 'text-ez-muted'">
                · {{ rule(group) }}
              </span>
            </p>
            <div class="space-y-1">
              @for (addon of group.addons; track addon.uuid) {
              <label class="flex items-center gap-3 px-3 py-2 border cursor-pointer transition-colors duration-ez"
                [class]="isSelected(group, addon) ? 'border-ez-primary bg-ez-primary-tint' : 'border-ez-border hover:border-ez-subtle'">
                <input [type]="group.maxSelect === 1 ? 'radio' : 'checkbox'" [name]="group.uuid"
                  [checked]="isSelected(group, addon)" (change)="toggle(group, addon)"
                  style="accent-color: var(--ez-color-primary);" class="w-4 h-4">
                <span class="flex-1 text-ez-base text-ez-heading">{{ addon.name }}</span>
                @if (addon.price) { <span class="text-ez-sm text-ez-secondary">+{{ addon.price | currency:'INR' }}</span> }
              </label>
              }
            </div>
          </div>
          }

          <div>
            <label class="ez-label">Note</label>
            <input type="text" [(ngModel)]="notes" placeholder="e.g. less spicy" class="ez-input ez-input--default w-full">
          </div>
        </div>

        <div class="border-t border-ez-border p-4 flex items-center gap-3 shrink-0">
          <div class="flex items-center border border-ez-border">
            <button type="button" (click)="quantity = quantity > 1 ? quantity - 1 : 1" class="p-2 text-ez-secondary hover:text-ez-heading">
              <lucide-icon [img]="icons.minus" class="w-4 h-4"></lucide-icon>
            </button>
            <span class="w-10 text-center text-ez-base font-medium">{{ quantity }}</span>
            <button type="button" (click)="quantity = quantity + 1" class="p-2 text-ez-secondary hover:text-ez-heading">
              <lucide-icon [img]="icons.plus" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
          <button type="button" (click)="submit()" [disabled]="!valid" class="ez-btn ez-btn-primary flex-1">
            Add · {{ previewTotal | currency:'INR' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ItemOptionsComponent implements OnInit {
  @Input({ required: true }) item!: Item;
  /** All add-on groups by uuid; only this item's active groups/add-ons are shown. */
  @Input({ required: true }) addonGroups!: Map<string, AddonGroup>;
  @Input() preselectVariantUuid: string | null = null;
  @Output() confirm = new EventEmitter<OrderLineRequest>();
  @Output() cancel = new EventEmitter<void>();

  readonly icons = { close: X, minus: Minus, plus: Plus };

  variants: ItemVariant[] = [];
  groups: AddonGroup[] = [];
  variantUuid: string | null = null;
  unitPrice: number | null = null;
  quantity = 1;
  notes = '';
  private selected = new Map<string, Set<string>>(); // group uuid -> addon uuids

  ngOnInit() {
    this.variants = this.item.variants.filter(v => v.active);
    this.variantUuid = this.preselectVariantUuid
      ?? this.variants.find(v => v.isDefault)?.uuid
      ?? this.variants[0]?.uuid
      ?? null;
    this.groups = itemAddonGroups(this.item, this.addonGroups);
    this.groups.forEach(g => this.selected.set(g.uuid, new Set()));
  }

  rule(group: AddonGroup): string {
    const { minSelect: min, maxSelect: max } = group;
    if (max === null) return min ? `pick at least ${min}` : 'optional';
    if (min === max) return `pick ${min}`;
    return min ? `pick ${min}–${max}` : `up to ${max}`;
  }

  isSelected(group: AddonGroup, addon: Addon): boolean {
    return this.selected.get(group.uuid)!.has(addon.uuid);
  }

  toggle(group: AddonGroup, addon: Addon) {
    const set = this.selected.get(group.uuid)!;
    if (set.has(addon.uuid)) {
      set.delete(addon.uuid);
    } else if (group.maxSelect === 1) {
      set.clear();
      set.add(addon.uuid);
    } else if (group.maxSelect === null || set.size < group.maxSelect) {
      set.add(addon.uuid);
    }
  }

  groupError(group: AddonGroup): boolean {
    const count = this.selected.get(group.uuid)!.size;
    return count < group.minSelect || (group.maxSelect !== null && count > group.maxSelect);
  }

  get valid(): boolean {
    if (this.variants.length && !this.variantUuid) return false;
    if (this.item.openPrice && (this.unitPrice === null || this.unitPrice < 0)) return false;
    return !this.groups.some(g => this.groupError(g));
  }

  /** Preview only; the order total always comes from the server. */
  get previewTotal(): number {
    const variant = this.variants.find(v => v.uuid === this.variantUuid);
    const base = this.item.openPrice ? Number(this.unitPrice ?? 0) : variant?.sellingPrice ?? this.item.sellingPrice;
    const addons = this.groups.reduce((sum, g) =>
      sum + g.addons.filter(a => this.isSelected(g, a)).reduce((s, a) => s + a.price, 0), 0);
    return (base + addons) * this.quantity;
  }

  submit() {
    if (!this.valid) return;
    const addons = this.groups.flatMap(g => [...this.selected.get(g.uuid)!].map(addonUuid => ({ addonUuid })));
    this.confirm.emit({
      itemUuid: this.item.uuid,
      variantUuid: this.variantUuid ?? undefined,
      quantity: this.quantity,
      unitPrice: this.item.openPrice ? Number(this.unitPrice) : undefined,
      addons: addons.length ? addons : undefined,
      notes: this.notes.trim() || undefined,
    });
  }
}

/** The item's active add-on groups (in the item's order) with only their active add-ons. */
export function itemAddonGroups(item: Item, groups: Map<string, AddonGroup>): AddonGroup[] {
  return item.addonGroupUuids
    .map(uuid => groups.get(uuid))
    .filter((g): g is AddonGroup => !!g && g.active)
    .map(g => ({ ...g, addons: g.addons.filter(a => a.active).sort((a, b) => a.sortOrder - b.sortOrder) }))
    .filter(g => g.addons.length > 0);
}
