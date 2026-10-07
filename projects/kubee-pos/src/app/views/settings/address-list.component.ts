import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, Plus, Pencil, Trash2, MapPin } from 'lucide-angular';
import { ADDRESS_TYPES, Address } from './settings.models';

/** Address cards with an inline editor. The parent saves; call done() / fail() when the request finishes. */
@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="flex items-center justify-between mb-4">
      <h3 class="ez-micro-label">{{ title }}</h3>
      @if (canEdit && !editing) {
      <button type="button" (click)="openNew()" class="ez-btn ez-btn-secondary !min-h-0 !py-1.5">
        <lucide-icon [img]="icons.plus" class="w-4 h-4"></lucide-icon> Add address
      </button>
      }
    </div>

    @if (editing) {
    <form [formGroup]="form" (ngSubmit)="submit()" class="border border-ez-border p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      <div>
        <label class="ez-label">Type <span class="text-red-500">*</span></label>
        <select formControlName="type" class="ez-select w-full">
          @for (t of types; track t) { <option [value]="t">{{ label(t) }}</option> }
        </select>
      </div>
      <div class="hidden sm:block"></div>
      <div class="sm:col-span-2">
        <label class="ez-label">Address line 1 <span class="text-red-500">*</span></label>
        <input type="text" formControlName="addressLine1" class="ez-input ez-input--default w-full" [class.ez-input--error]="invalid('addressLine1')">
      </div>
      <div class="sm:col-span-2">
        <label class="ez-label">Address line 2</label>
        <input type="text" formControlName="addressLine2" class="ez-input ez-input--default w-full">
      </div>
      <div>
        <label class="ez-label">Area</label>
        <input type="text" formControlName="area" class="ez-input ez-input--default w-full">
      </div>
      <div>
        <label class="ez-label">City <span class="text-red-500">*</span></label>
        <input type="text" formControlName="city" class="ez-input ez-input--default w-full" [class.ez-input--error]="invalid('city')">
      </div>
      <div>
        <label class="ez-label">State <span class="text-red-500">*</span></label>
        <input type="text" formControlName="state" class="ez-input ez-input--default w-full" [class.ez-input--error]="invalid('state')">
      </div>
      <div>
        <label class="ez-label">Country <span class="text-red-500">*</span></label>
        <input type="text" formControlName="country" class="ez-input ez-input--default w-full" [class.ez-input--error]="invalid('country')">
      </div>
      <div>
        <label class="ez-label">PIN code <span class="text-red-500">*</span></label>
        <input type="text" formControlName="pinCode" class="ez-input ez-input--default w-full" [class.ez-input--error]="invalid('pinCode')">
      </div>
      <div class="sm:col-span-2 flex justify-end gap-3">
        <button type="button" (click)="editing = false" class="ez-btn ez-btn-secondary">Cancel</button>
        <button type="submit" [disabled]="busy" class="ez-btn ez-btn-primary">{{ busy ? 'Saving...' : 'Save address' }}</button>
      </div>
    </form>
    }

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      @for (address of addresses; track address.id) {
      <div class="border border-ez-border p-4 flex gap-3">
        <lucide-icon [img]="icons.pin" class="w-4 h-4 text-ez-muted mt-0.5 shrink-0"></lucide-icon>
        <div class="flex-1 min-w-0 text-ez-sm text-ez-body">
          <p class="ez-micro-label mb-1">{{ label(address.type) }}</p>
          <p>{{ address.addressLine1 }}{{ address.addressLine2 ? ', ' + address.addressLine2 : '' }}</p>
          <p class="text-ez-secondary">{{ cityLine(address) }}</p>
          <p class="text-ez-secondary">{{ address.country }}</p>
        </div>
        @if (canEdit) {
        <div class="flex flex-col gap-2">
          <button type="button" (click)="openEdit(address)" title="Edit" class="text-ez-secondary hover:text-ez-primary outline-none">
            <lucide-icon [img]="icons.edit" class="w-4 h-4"></lucide-icon>
          </button>
          <button type="button" (click)="remove.emit(address)" title="Delete" class="text-ez-secondary hover:text-red-500 outline-none">
            <lucide-icon [img]="icons.trash" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
        }
      </div>
      } @empty {
      @if (!editing) { <p class="text-ez-sm text-ez-muted">No addresses yet.</p> }
      }
    </div>
  `
})
export class AddressListComponent {
  private fb = inject(FormBuilder);

  @Input() title = 'Addresses';
  @Input() addresses: Address[] = [];
  @Input() canEdit = false;
  @Output() save = new EventEmitter<Address>();
  @Output() remove = new EventEmitter<Address>();

  readonly icons = { plus: Plus, edit: Pencil, trash: Trash2, pin: MapPin };
  readonly types = ADDRESS_TYPES;
  editing = false;
  busy = false;
  private editingId: number | null = null;

  form: FormGroup = this.fb.group({
    type: ['BILLING', Validators.required],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    area: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    country: ['India', Validators.required],
    pinCode: ['', Validators.required],
  });

  label(value: string): string {
    return value.charAt(0) + value.slice(1).toLowerCase();
  }

  cityLine(address: Address): string {
    return [address.area, address.city, address.state].filter(Boolean).join(', ') + ' ' + address.pinCode;
  }

  invalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  openNew() {
    this.editingId = null;
    this.form.reset({ type: 'BILLING', country: 'India' });
    this.editing = true;
  }

  openEdit(address: Address) {
    this.editingId = address.id ?? null;
    this.form.reset({ ...address });
    this.editing = true;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy = true;
    this.save.emit({ ...this.form.value, id: this.editingId });
  }

  /** Parent calls this after a successful save. */
  done() {
    this.busy = false;
    this.editing = false;
  }

  fail() {
    this.busy = false;
  }
}
