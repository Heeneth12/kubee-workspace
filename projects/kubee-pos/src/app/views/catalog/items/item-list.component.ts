import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmationModalService, ToastService } from 'kubee-ui';
import { LucideAngularModule, Search, Plus, Pencil, Trash2, Star, Package, ChevronLeft, ChevronRight } from 'lucide-angular';
import { CatalogService } from '../catalog.service';
import { Category, FoodType, Item, ItemSearchParams } from '../catalog.models';
import { readApiError } from '../catalog-errors';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, RouterModule, LucideAngularModule],
  templateUrl: './item-list.component.html',
})
export class ItemListComponent implements OnInit {
  private catalogService = inject(CatalogService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmationModalService);
  private destroyRef = inject(DestroyRef);

  readonly icons = { search: Search, plus: Plus, edit: Pencil, trash: Trash2, star: Star, package: Package, prev: ChevronLeft, next: ChevronRight };
  readonly foodTypes: FoodType[] = ['VEG', 'NON_VEG', 'EGG'];
  readonly pageSize = 50;

  items: Item[] = [];
  categories: Category[] = [];
  isLoading = false;
  busyUuid: string | null = null;

  // Filters
  search = '';
  categoryUuid = '';
  active = '';        // '' | 'true' | 'false'
  foodType: FoodType | '' = '';
  favouriteOnly = false;

  page = 0;
  totalPages = 0;
  totalElements = 0;

  private search$ = new Subject<string>();

  ngOnInit() {
    this.search$.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
    this.catalogService.listCategories().subscribe({
      next: categories => this.categories = categories,
      error: () => { /* filter just stays empty */ }
    });
    this.loadItems();
  }

  onSearchChange(value: string) {
    this.search$.next(value.trim());
  }

  applyFilters() {
    this.page = 0;
    this.loadItems();
  }

  loadItems() {
    const params: ItemSearchParams = {
      search: this.search.trim() || undefined,
      categoryUuid: this.categoryUuid || undefined,
      active: this.active === '' ? undefined : this.active === 'true',
      foodType: this.foodType || undefined,
      favourite: this.favouriteOnly || undefined,
      page: this.page,
      size: this.pageSize,
    };
    this.isLoading = true;
    this.catalogService.searchItems(params).subscribe({
      next: result => {
        this.items = result.content;
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

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.page = page;
    this.loadItems();
  }

  /** Display name for a category in the filter: "Parent / Child" for sub-categories. */
  categoryLabel(category: Category): string {
    const parent = category.parentUuid ? this.categories.find(c => c.uuid === category.parentUuid) : null;
    return parent ? `${parent.name} / ${category.name}` : category.name;
  }

  toggleActive(item: Item) {
    this.busyUuid = item.uuid;
    this.catalogService.setItemActive(item.uuid, !item.active).subscribe({
      next: updated => this.replace(updated),
      error: (err: HttpErrorResponse) => this.onRowError(err)
    });
  }

  toggleFavourite(item: Item) {
    this.busyUuid = item.uuid;
    this.catalogService.setItemFavourite(item.uuid, !item.favourite).subscribe({
      next: updated => this.replace(updated),
      error: (err: HttpErrorResponse) => this.onRowError(err)
    });
  }

  async deleteItem(item: Item) {
    const confirmed = await this.confirmService.open({
      title: 'Delete item',
      message: `Delete "${item.name}"? It will no longer be available for billing.`,
      intent: 'delete',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    this.busyUuid = item.uuid;
    this.catalogService.deleteItem(item.uuid).subscribe({
      next: () => {
        this.busyUuid = null;
        this.toastService.show(`${item.name} deleted`, 'success');
        // Reload so paging totals stay correct (and step back if the page is now empty)
        if (this.items.length === 1 && this.page > 0) this.page--;
        this.loadItems();
      },
      error: (err: HttpErrorResponse) => this.onRowError(err)
    });
  }

  private replace(updated: Item) {
    this.busyUuid = null;
    this.items = this.items.map(i => i.uuid === updated.uuid ? updated : i);
  }

  private onRowError(err: HttpErrorResponse) {
    this.busyUuid = null;
    this.toastService.show(readApiError(err).message, 'error');
    if (err.status === 404) this.loadItems();
  }
}
