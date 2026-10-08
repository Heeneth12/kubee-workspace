import { Component, OnInit, inject } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfirmationModalService, ToastService } from 'kubee-ui';
import { LucideAngularModule, Plus, Pencil, Trash2, FolderTree, CornerDownRight, X } from 'lucide-angular';
import { CatalogService } from '../catalog.service';
import { Category, CategoryRequest } from '../catalog.models';
import { applyServerErrors, blankToNull, controlError, numOrNull, readApiError } from '../catalog-errors';
import { AuthService } from '../../../layouts/guards/auth.service';
import { PosPrivileges } from '../../../layouts/guards/pos-permissions';

interface CategoryNode {
  category: Category;
  children: Category[];
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule, NgTemplateOutlet, LucideAngularModule],
  templateUrl: './categories.component.html',
})
export class CategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private catalogService = inject(CatalogService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmationModalService);
  private authService = inject(AuthService);

  readonly can = {
    create: this.authService.hasPermission(PosPrivileges.CATALOG_CREATE),
    edit: this.authService.hasPermission(PosPrivileges.CATALOG_EDIT),
    delete: this.authService.hasPermission(PosPrivileges.CATALOG_DELETE),
  };

  readonly icons = { plus: Plus, edit: Pencil, trash: Trash2, tree: FolderTree, child: CornerDownRight, close: X };
  readonly controlError = controlError;

  categories: Category[] = [];
  tree: CategoryNode[] = [];
  isLoading = false;

  /** null = editor closed, 'new' = creating, otherwise the category being edited. */
  editing: Category | 'new' | null = null;
  isSaving = false;
  formError: string | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
    parentUuid: [''],
    imageUrl: ['', Validators.maxLength(500)],
    sortOrder: [0 as number | null],
    active: [true],
  });

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading = true;
    this.catalogService.listCategories().subscribe({
      next: categories => {
        this.setCategories(categories);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  /** The API returns a flat list (sortOrder, then name); build the 2-level tree on the client. */
  private setCategories(categories: Category[]) {
    this.categories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    const topLevel = this.categories.filter(c => !c.parentUuid || !this.categories.some(p => p.uuid === c.parentUuid));
    this.tree = topLevel.map(category => ({
      category,
      children: this.categories.filter(c => c.parentUuid === category.uuid),
    }));
  }

  get editingCategory(): Category | null {
    return this.editing && this.editing !== 'new' ? this.editing : null;
  }

  /** Allowed parents: top-level categories, never itself. A category with children must stay top-level. */
  get parentOptions(): Category[] {
    const self = this.editingCategory;
    if (self && this.categories.some(c => c.parentUuid === self.uuid)) return [];
    return this.categories.filter(c => !c.parentUuid && c.uuid !== self?.uuid);
  }

  ctrl(name: string): AbstractControl | null {
    return this.form.get(name);
  }

  openCreate(parent?: Category) {
    if (!this.can.create) return;
    this.editing = 'new';
    this.formError = null;
    this.form.reset({ name: '', parentUuid: parent?.uuid ?? '', imageUrl: '', sortOrder: 0, active: true });
  }

  openEdit(category: Category) {
    if (!this.can.edit) return;
    this.editing = category;
    this.formError = null;
    this.form.reset({
      name: category.name,
      parentUuid: category.parentUuid ?? '',
      imageUrl: category.imageUrl ?? '',
      sortOrder: category.sortOrder,
      active: category.active,
    });
  }

  closeEditor() {
    this.editing = null;
    this.formError = null;
  }

  save() {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: CategoryRequest = {
      name: (v.name ?? '').trim(),
      parentUuid: v.parentUuid || null,
      imageUrl: blankToNull(v.imageUrl),
      sortOrder: numOrNull(v.sortOrder) ?? 0,
      active: !!v.active,
    };
    const editing = this.editingCategory;
    const request$ = editing
      ? this.catalogService.updateCategory(editing.uuid, body)
      : this.catalogService.createCategory(body);

    this.isSaving = true;
    request$.subscribe({
      next: saved => {
        this.isSaving = false;
        this.setCategories([...this.categories.filter(c => c.uuid !== saved.uuid), saved]);
        this.toastService.show(`Category ${saved.name} ${editing ? 'updated' : 'created'}`, 'success');
        this.closeEditor();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        const apiError = readApiError(err);
        const unmatched = applyServerErrors(this.form, apiError.fields);
        this.formError = Object.keys(apiError.fields).length ? (unmatched.join(' · ') || null) : apiError.message;
        if (err.status === 404) this.loadCategories();
      }
    });
  }

  async deleteCategory(category: Category) {
    if (!this.can.delete) return;
    const confirmed = await this.confirmService.open({
      title: 'Delete category',
      message: `Delete "${category.name}"? Categories that still have items or sub-categories cannot be deleted.`,
      intent: 'delete',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!confirmed) return;

    this.catalogService.deleteCategory(category.uuid).subscribe({
      next: () => {
        this.setCategories(this.categories.filter(c => c.uuid !== category.uuid));
        if (this.editingCategory?.uuid === category.uuid) this.closeEditor();
        this.toastService.show(`Category ${category.name} deleted`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.toastService.show(readApiError(err).message, 'error');
        if (err.status === 404) this.loadCategories();
      }
    });
  }
}
