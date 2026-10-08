import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService, ConfirmationModalService } from 'kubee-ui';
import { LucideAngularModule, Save } from 'lucide-angular';
import { SettingsService } from './settings.service';
import { AddressListComponent } from './address-list.component';
import { Address, BUSINESS_TYPES, CURRENCIES, TIME_ZONES, Tenant } from './settings.models';
import { readApiError } from '../catalog/catalog-errors';

@Component({
  selector: 'app-business-settings',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, AddressListComponent],
  template: `
    @if (isLoading) {
    <p class="p-6 text-ez-sm text-ez-muted">Loading...</p>
    } @else {
    <div class="p-6 space-y-8 max-w-5xl">
      @if (!canEdit) {
      <div class="border border-ez-border bg-ez-ash text-ez-sm text-ez-secondary px-4 py-3">You can view these settings. Ask the owner to change them.</div>
      }

      <form [formGroup]="form" (ngSubmit)="saveDetails()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="ez-micro-label">Business details</h3>
          @if (canEdit) {
          <button type="submit" [disabled]="isSaving" class="ez-btn ez-btn-primary !min-h-0 !py-1.5">
            <lucide-icon [img]="icons.save" class="w-4 h-4"></lucide-icon>
            {{ isSaving ? 'Saving...' : 'Save details' }}
          </button>
          }
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
          <div class="sm:col-span-2">
            <label class="ez-label">Legal name <span class="text-red-500">*</span></label>
            <input type="text" formControlName="legalName" class="ez-input ez-input--default w-full" [class.ez-input--error]="invalid('legalName')">
          </div>
          <div>
            <label class="ez-label">Business type <span class="text-red-500">*</span></label>
            <select formControlName="businessType" class="ez-select w-full">
              @for (t of businessTypes; track t.value) { <option [value]="t.value">{{ t.label }}</option> }
            </select>
          </div>
          <div>
            <label class="ez-label">Currency <span class="text-red-500">*</span></label>
            <select formControlName="baseCurrency" class="ez-select w-full">
              @for (c of currencies; track c) { <option [value]="c">{{ c }}</option> }
            </select>
          </div>
          <div>
            <label class="ez-label">Time zone <span class="text-red-500">*</span></label>
            <select formControlName="timeZone" class="ez-select w-full">
              @for (z of timeZones; track z) { <option [value]="z">{{ z }}</option> }
            </select>
          </div>
          <div>
            <label class="ez-label">GSTIN</label>
            <input type="text" formControlName="gstNumber" class="ez-input ez-input--default w-full uppercase" placeholder="22AAAAA0000A1Z5">
          </div>
          <div>
            <label class="ez-label">PAN</label>
            <input type="text" formControlName="panNumber" class="ez-input ez-input--default w-full uppercase">
          </div>
          <div>
            <label class="ez-label">Support email</label>
            <input type="email" formControlName="supportEmail" class="ez-input ez-input--default w-full" [class.ez-input--error]="invalid('supportEmail')">
          </div>
          <div>
            <label class="ez-label">Contact phone</label>
            <input type="tel" formControlName="contactPhone" class="ez-input ez-input--default w-full">
          </div>
          <div class="sm:col-span-2 lg:col-span-3">
            <label class="ez-label">Website</label>
            <input type="url" formControlName="website" class="ez-input ez-input--default w-full" placeholder="https://">
          </div>
        </div>
        @if (formError) { <p class="text-ez-sm text-red-600 mt-3">{{ formError }}</p> }
      </form>

      <section class="border-t border-ez-border pt-6">
        <app-address-list #addressList title="Business addresses" [addresses]="tenant?.tenantAddress ?? []" [canEdit]="canEdit"
          (save)="saveAddress($event)" (remove)="deleteAddress($event)"></app-address-list>
      </section>
    </div>
    }
  `
})
export class BusinessSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settings = inject(SettingsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmationModalService);

  @ViewChild('addressList') addressList?: AddressListComponent;

  readonly icons = { save: Save };
  readonly businessTypes = BUSINESS_TYPES;
  readonly currencies = [...CURRENCIES];
  readonly timeZones = [...TIME_ZONES];
  readonly canEdit = this.settings.canEditSettings();

  tenant: Tenant | null = null;
  isLoading = true;
  isSaving = false;
  formError: string | null = null;

  form: FormGroup = this.fb.group({
    legalName: ['', Validators.required],
    businessType: ['RETAIL', Validators.required],
    baseCurrency: ['INR', Validators.required],
    timeZone: ['Asia/Kolkata', Validators.required],
    gstNumber: [''],
    panNumber: [''],
    supportEmail: ['', Validators.email],
    contactPhone: [''],
    website: [''],
  });

  ngOnInit() {
    if (!this.canEdit) this.form.disable();
    this.load();
  }

  private load() {
    this.settings.getTenant().subscribe({
      next: tenant => {
        this.tenant = tenant;
        const d = tenant.tenantDetails;
        this.form.patchValue(d ? {
          ...d,
          // Keep values outside our short lists selectable
          baseCurrency: d.baseCurrency?.trim(),
        } : { legalName: tenant.tenantName });
        if (d?.baseCurrency && !this.currencies.includes(d.baseCurrency.trim())) this.currencies.unshift(d.baseCurrency.trim());
        if (d?.timeZone && !this.timeZones.includes(d.timeZone)) this.timeZones.unshift(d.timeZone);
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  invalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  saveDetails() {
    if (!this.canEdit) return;
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const blank = (x: string) => (x ?? '').trim() || null;
    this.isSaving = true;
    this.settings.saveDetails({
      legalName: v.legalName.trim(),
      businessType: v.businessType,
      baseCurrency: v.baseCurrency,
      timeZone: v.timeZone,
      gstNumber: blank(v.gstNumber)?.toUpperCase() ?? null,
      panNumber: blank(v.panNumber)?.toUpperCase() ?? null,
      supportEmail: blank(v.supportEmail),
      contactPhone: blank(v.contactPhone),
      website: blank(v.website),
      logoUrl: this.tenant?.tenantDetails?.logoUrl ?? null,
    }, !!this.tenant?.tenantDetails).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.show('Business details saved', 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.isSaving = false;
        this.formError = readApiError(err).message;
      }
    });
  }

  saveAddress(address: Address) {
    this.settings.saveTenantAddress(address).subscribe({
      next: () => {
        this.addressList?.done();
        this.toastService.show('Address saved', 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.addressList?.fail();
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  async deleteAddress(address: Address) {
    if (!address.id) return;
    const ok = await this.confirmService.open({
      title: 'Delete address',
      message: `Delete the ${address.type.toLowerCase()} address?`,
      intent: 'delete',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    this.settings.deleteTenantAddress(address.id).subscribe({
      next: () => {
        this.toastService.show('Address deleted', 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => this.toastService.show(readApiError(err).message, 'error')
    });
  }
}
