import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationModalService, ToastService } from 'kubee-ui';
import { LucideAngularModule, Plus, Pencil, Trash2, ListPlus, X } from 'lucide-angular';
import { CatalogService } from '../catalog.service';
import { Addon, AddonGroup, AddonGroupRequest, FoodType } from '../catalog.models';
import { applyServerErrors, blankToNull, controlError, numOrNull, readApiError } from '../catalog-errors';

/** Raw value of one add-on row in the form. */
interface AddonRow {
  uuid: string | null;
  name: string;
  price: number | null;
  foodType: FoodType | '';
  active: boolean;
}

@Component({
  selector: 'app-addon-groups',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, LucideAngularModule],
  templateUrl: './addon-groups.component.html',
})
export class AddonGroupsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalogService = inject(CatalogService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmationModalService);

  readonly icons = { plus: Plus, edit: Pencil, trash: Trash2, list: ListPlus, close: X };
  readonly foodTypes: FoodType[] = ['VEG', 'NON_VEG', 'EGG'];
  readonly controlError = controlError;

  groups: AddonGroup[] = [];
  isLoading = false;

  /** null = editor closed, 'new' = creating, otherwise the group being edited. */
  editing: AddonGroup | 'new' | null = null;
  isSaving = false;
  formError: string | null = null;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    minSelect: [0 as number | null, Validators.min(0)],
    maxSelect: [null as number | null, Validators.min(1)],
    active: [true],
    addons: this.fb.array<FormGroup>([]),
  });

  get addons(): FormArray<FormGroup> {
    return this.form.get('addons') as FormArray<FormGroup>;
  }

  get editingGroup(): AddonGroup | null {
    return this.editing && this.editing !== 'new' ? this.editing : null;
  }

  ngOnInit() {
    this.loadGroups();
  }

  loadGroups() {
    this.isLoading = true;
    this.catalogService.listAddonGroups().subscribe({
      next: groups => {
        this.groups = groups;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  selectionRule(group: AddonGroup): string {
    const { minSelect: min, maxSelect: max } = group;
    if (max === null) return min ? `Pick at least ${min}` : 'Optional, any number';
    if (min === max) return `Pick exactly ${min}`;
    return min ? `Pick ${min}–${max}` : `Pick up to ${max}`;
  }

  activeAddons(group: AddonGroup): Addon[] {
    return group.addons.filter(a => a.active);
  }

  ctrl(path: (string | number)[]): AbstractControl | null {
    return this.form.get(path);
  }

  // ---------- editor ----------

  private addonGroup(a?: Addon): FormGroup {
    return this.fb.group({
      uuid: [a?.uuid ?? null],   // kept so PUT updates instead of delete + recreate
      name: [a?.name ?? '', [Validators.required, Validators.maxLength(100)]],
      price: [a?.price ?? 0, Validators.min(0)],
      foodType: [a?.foodType ?? ''],
      active: [a?.active ?? true],
    });
  }

  openCreate() {
    this.editing = 'new';
    this.formError = null;
    this.form.reset({ name: '', minSelect: 0, maxSelect: null, active: true });
    this.addons.clear();
    this.addAddon();
  }

  openEdit(group: AddonGroup) {
    this.editing = group;
    this.formError = null;
    this.form.reset({ name: group.name, minSelect: group.minSelect, maxSelect: group.maxSelect, active: group.active });
    this.addons.clear();
    [...group.addons].sort((a, b) => a.sortOrder - b.sortOrder).forEach(a => this.addons.push(this.addonGroup(a)));
  }

  closeEditor() {
    this.editing = null;
    this.formError = null;
  }

  addAddon() {
    this.addons.push(this.addonGroup());
  }

  removeAddon(index: number) {
    this.addons.removeAt(index);
  }

  save() {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const minSelect = numOrNull(v.minSelect) ?? 0;
    const maxSelect = numOrNull(v.maxSelect);
    if (maxSelect !== null && maxSelect < minSelect) {
      this.formError = 'Maximum selection cannot be less than minimum';
      return;
    }

    const body: AddonGroupRequest = {
      name: v.name.trim(),
      minSelect,
      maxSelect,
      active: !!v.active,
      addons: (this.addons.getRawValue() as AddonRow[]).map((row, index) => ({
        uuid: row.uuid ?? null,
        name: row.name.trim(),
        price: numOrNull(row.price) ?? 0,
        foodType: row.foodType || null,
        sortOrder: index + 1,
        active: !!row.active,
      })),
    };
    const editing = this.editingGroup;
    const request$ = editing
      ? this.catalogService.updateAddonGroup(editing.uuid, body)
      : this.catalogService.createAddonGroup(body);

    this.isSaving = true;
    request$.subscribe({
      next: saved => {
        this.isSaving = false;
        this.groups = editing
          ? this.groups.map(g => g.uuid === saved.uuid ? saved : g)
          : [...this.groups, saved].sort((a, b) => a.name.localeCompare(b.name));
        this.toastService.show(`${saved.name} ${editing ? 'updated' : 'created'}`, 'success');
        this.closeEditor();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        const apiError = readApiError(err);
        const unmatched = applyServerErrors(this.form, apiError.fields);
        this.formError = Object.keys(apiError.fields).length ? (unmatched.join(' · ') || null) : apiError.message;
        if (err.status === 404) this.loadGroups();
      }
    });
  }

  async deleteGroup(group: AddonGroup) {
    const confirmed = await this.confirmService.open({
      title: 'Delete add-on group',
      message: `Delete "${group.name}"? Groups still attached to items cannot be deleted.`,
      intent: 'delete',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    this.catalogService.deleteAddonGroup(group.uuid).subscribe({
      next: () => {
        this.groups = this.groups.filter(g => g.uuid !== group.uuid);
        if (this.editingGroup?.uuid === group.uuid) this.closeEditor();
        this.toastService.show(`${group.name} deleted`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.show(readApiError(err).message, 'error');
        if (err.status === 404) this.loadGroups();
      }
    });
  }
}
