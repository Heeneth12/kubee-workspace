import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ToastService } from 'kubee-ui';
import { LucideAngularModule, ArrowLeft, Plus, Save, Trash2 } from 'lucide-angular';
import { CatalogService } from '../catalog.service';
import { AddonGroup, Category, FoodType, Item, ItemRequest, ItemType, ItemVariant, VariantRequest } from '../catalog.models';
import { applyServerErrors, blankToNull, controlError, numOrNull, readApiError } from '../catalog-errors';
import { AuthService } from '../../../layouts/guards/auth.service';
import { PosPrivileges } from '../../../layouts/guards/pos-permissions';

/** A tax group as seen on existing items. The catalog API has no tax-group list endpoint yet. */
interface TaxGroupOption {
  uuid: string;
  label: string;
}

/** Raw value of one variant row in the form. */
interface VariantRow {
  uuid: string | null;
  name: string;
  itemCode: string;
  barcode: string;
  sellingPrice: number | null;
  mrp: number | null;
  isDefault: boolean;
  active: boolean;
}

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, LucideAngularModule],
  templateUrl: './item-form.component.html',
})
export class ItemFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalogService = inject(CatalogService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private readonly canEditPricing = this.authService.hasPermission(PosPrivileges.CATALOG_PRICING);

  readonly icons = { back: ArrowLeft, plus: Plus, save: Save, trash: Trash2 };
  readonly itemTypes: ItemType[] = ['GOODS', 'SERVICE'];
  readonly foodTypes: FoodType[] = ['VEG', 'NON_VEG', 'EGG'];
  readonly units = ['PCS', 'PLATE', 'CUP', 'GLASS', 'BOWL', 'KG', 'GM', 'LTR', 'ML', 'BOX', 'PACK'];
  readonly controlError = controlError;

  itemUuid: string | null = null;
  isLoading = false;
  isSaving = false;
  formError: string | null = null;

  categories: Category[] = [];
  addonGroups: AddonGroup[] = [];
  taxGroups: TaxGroupOption[] = [];
  /** Selected add-on groups; order = display order on the billing screen. */
  selectedAddonGroupUuids: string[] = [];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    shortName: ['', Validators.maxLength(50)],
    itemCode: ['', Validators.maxLength(50)],
    barcode: ['', Validators.maxLength(100)],
    categoryUuid: [''],
    itemType: ['GOODS' as ItemType],
    foodType: [''],
    unitOfMeasure: ['PCS', Validators.maxLength(20)],
    hsnSacCode: ['', Validators.pattern(/^\d{4,8}$/)],
    imageUrl: ['', Validators.maxLength(500)],
    description: [''],
    sortOrder: [0],
    sellingPrice: [null as number | null, Validators.min(0)],
    mrp: [null as number | null, Validators.min(0)],
    priceIncludesTax: [true],
    taxGroupUuid: [''],
    openPrice: [false],
    favourite: [false],
    active: [true],
    variants: this.fb.array<FormGroup>([]),
  });

  get variants(): FormArray<FormGroup> {
    return this.form.get('variants') as FormArray<FormGroup>;
  }

  get isEdit(): boolean {
    return !!this.itemUuid;
  }

  /** Prices of existing items need the pricing privilege; new items always get a price. */
  get lockPricing(): boolean {
    return this.isEdit && !this.canEditPricing;
  }

  get isOpenPrice(): boolean {
    return !!this.form.get('openPrice')?.value;
  }

  ngOnInit() {
    this.itemUuid = this.route.snapshot.paramMap.get('uuid');
    this.form.get('openPrice')!.valueChanges.subscribe(() => this.updatePriceValidators());
    this.updatePriceValidators();
    this.loadData();
  }

  private loadData() {
    this.isLoading = true;
    forkJoin({
      categories: this.catalogService.listCategories(),
      addonGroups: this.catalogService.listAddonGroups(),
      // Used only to collect tax groups in use (no tax-group endpoint in the catalog API yet)
      items: this.catalogService.searchItems({ size: 500 }),
    }).subscribe({
      next: ({ categories, addonGroups, items }) => {
        this.categories = categories;
        this.addonGroups = addonGroups;
        items.content.forEach(i => this.addTaxGroup(i));
        if (this.itemUuid) {
          this.loadItem(this.itemUuid);
        } else {
          this.isLoading = false;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  private loadItem(uuid: string) {
    this.catalogService.getItem(uuid).subscribe({
      next: item => {
        this.patchItem(item);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
        if (err.status === 404) this.goBack();
      }
    });
  }

  private patchItem(item: Item) {
    this.addTaxGroup(item);
    this.form.patchValue({
      name: item.name,
      shortName: item.shortName ?? '',
      itemCode: item.itemCode ?? '',
      barcode: item.barcode ?? '',
      categoryUuid: item.categoryUuid ?? '',
      itemType: item.itemType,
      foodType: item.foodType ?? '',
      unitOfMeasure: item.unitOfMeasure,
      hsnSacCode: item.hsnSacCode ?? '',
      imageUrl: item.imageUrl ?? '',
      description: item.description ?? '',
      sortOrder: item.sortOrder,
      sellingPrice: item.sellingPrice,
      mrp: item.mrp,
      priceIncludesTax: item.priceIncludesTax,
      taxGroupUuid: item.taxGroupUuid ?? '',
      openPrice: item.openPrice,
      favourite: item.favourite,
      active: item.active,
    });
    this.variants.clear();
    item.variants.forEach(v => this.variants.push(this.variantGroup(v)));
    this.selectedAddonGroupUuids = [...item.addonGroupUuids];
    this.updatePriceValidators();
    this.form.markAsPristine();
  }

  private addTaxGroup(item: Item) {
    if (!item.taxGroupUuid || this.taxGroups.some(t => t.uuid === item.taxGroupUuid)) return;
    const name = item.taxGroupName ?? item.taxGroupUuid;
    this.taxGroups.push({ uuid: item.taxGroupUuid, label: item.taxRate !== null ? `${name} (${item.taxRate}%)` : name });
  }

  // ---------- variants ----------

  private variantGroup(v?: ItemVariant): FormGroup {
    return this.fb.group({
      uuid: [v?.uuid ?? null],   // kept so PUT updates instead of delete + recreate
      name: [v?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      itemCode: [v?.itemCode ?? '', Validators.maxLength(50)],
      barcode: [v?.barcode ?? '', Validators.maxLength(100)],
      sellingPrice: [v?.sellingPrice ?? null, [Validators.required, Validators.min(0)]],
      mrp: [v?.mrp ?? null, Validators.min(0)],
      isDefault: [v?.isDefault ?? false],
      active: [v?.active ?? true],
    });
  }

  addVariant() {
    const group = this.variantGroup();
    // First variant becomes the default
    if (!this.variants.length) group.patchValue({ isDefault: true });
    this.variants.push(group);
    this.updatePriceValidators();
  }

  removeVariant(index: number) {
    const wasDefault = this.variants.at(index).value.isDefault;
    this.variants.removeAt(index);
    if (wasDefault && this.variants.length) this.variants.at(0).patchValue({ isDefault: true });
    this.updatePriceValidators();
  }

  setDefaultVariant(index: number) {
    this.variants.controls.forEach((g, i) => g.patchValue({ isDefault: i === index }));
    // The default variant must be active
    this.variants.at(index).patchValue({ active: true });
  }

  /** Item-level price is required only for a plain item (no variants, not open price). */
  private updatePriceValidators() {
    const price = this.form.get('sellingPrice')!;
    const needsPrice = !this.isOpenPrice && !this.variants.length;
    price.setValidators(needsPrice ? [Validators.required, Validators.min(0)] : [Validators.min(0)]);
    price.updateValueAndValidity({ emitEvent: false });
  }

  // ---------- add-on groups ----------

  isAddonGroupSelected(uuid: string): boolean {
    return this.selectedAddonGroupUuids.includes(uuid);
  }

  toggleAddonGroup(uuid: string) {
    this.selectedAddonGroupUuids = this.isAddonGroupSelected(uuid)
      ? this.selectedAddonGroupUuids.filter(u => u !== uuid)
      : [...this.selectedAddonGroupUuids, uuid];
    this.form.markAsDirty();
  }

  addonGroupSummary(group: AddonGroup): string {
    const active = group.addons.filter(a => a.active).length;
    const max = group.maxSelect === null ? 'any' : group.maxSelect;
    return `${active} add-ons · pick ${group.minSelect}–${max}`;
  }

  categoryLabel(category: Category): string {
    const parent = category.parentUuid ? this.categories.find(c => c.uuid === category.parentUuid) : null;
    return parent ? `${parent.name} / ${category.name}` : category.name;
  }

  ctrl(path: (string | number)[]): AbstractControl | null {
    return this.form.get(path);
  }

  // ---------- save ----------

  save() {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError = 'Please fix the highlighted fields.';
      return;
    }

    const body = this.buildRequest();
    const request$ = this.itemUuid
      ? this.catalogService.updateItem(this.itemUuid, body)
      : this.catalogService.createItem(body);

    this.isSaving = true;
    request$.subscribe({
      next: item => {
        this.isSaving = false;
        this.toastService.show(`${item.name} ${this.isEdit ? 'updated' : 'created'}`, 'success');
        this.form.markAsPristine();
        this.goBack();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        const apiError = readApiError(err);
        if (err.status === 400 && Object.keys(apiError.fields).length) {
          const unmatched = applyServerErrors(this.form, apiError.fields);
          this.formError = unmatched.length ? unmatched.join(' · ') : 'Please fix the highlighted fields.';
        } else {
          this.formError = apiError.message;
        }
        this.toastService.show(apiError.message, 'error');
      }
    });
  }

  private buildRequest(): ItemRequest {
    const v = this.form.getRawValue();
    const hasVariants = this.variants.length > 0;
    const variants: VariantRequest[] = (this.variants.getRawValue() as VariantRow[]).map((row, index) => ({
      uuid: row.uuid ?? null,
      name: row.name.trim(),
      itemCode: blankToNull(row.itemCode),
      barcode: blankToNull(row.barcode),
      sellingPrice: Number(row.sellingPrice),
      mrp: numOrNull(row.mrp),
      isDefault: !!row.isDefault,
      sortOrder: index + 1,
      active: !!row.active,
    }));

    return {
      name: v.name.trim(),
      shortName: blankToNull(v.shortName),
      itemCode: blankToNull(v.itemCode),
      barcode: blankToNull(v.barcode),
      categoryUuid: v.categoryUuid || null,
      itemType: v.itemType,
      foodType: v.foodType || null,
      unitOfMeasure: blankToNull(v.unitOfMeasure),
      hsnSacCode: blankToNull(v.hsnSacCode),
      imageUrl: blankToNull(v.imageUrl),
      description: blankToNull(v.description),
      sortOrder: numOrNull(v.sortOrder) ?? 0,
      // Ignored by the backend when variants are sent; not needed for open-price items
      sellingPrice: hasVariants || v.openPrice ? null : numOrNull(v.sellingPrice),
      mrp: hasVariants ? null : numOrNull(v.mrp),
      priceIncludesTax: !!v.priceIncludesTax,
      taxGroupUuid: v.taxGroupUuid || null,
      openPrice: !!v.openPrice,
      favourite: !!v.favourite,
      active: !!v.active,
      variants,
      addonGroupUuids: this.selectedAddonGroupUuids,
    };
  }

  goBack() {
    this.router.navigate(['/catalog/items']);
  }
}
