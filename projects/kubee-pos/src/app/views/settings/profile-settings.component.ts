import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService, ConfirmationModalService } from 'kubee-ui';
import { SettingsService } from './settings.service';
import { AddressListComponent } from './address-list.component';
import { Address, Profile } from './settings.models';
import { readApiError } from '../catalog/catalog-errors';

/** The signed-in user's own account. Name and phone are changed by whoever manages users. */
@Component({
  selector: 'app-profile-settings',
  standalone: true,
  imports: [AddressListComponent],
  template: `
    @if (isLoading) {
    <p class="p-6 text-ez-sm text-ez-muted">Loading...</p>
    } @else if (profile) {
    <div class="p-6 space-y-8 max-w-5xl">
      <section>
        <h3 class="ez-micro-label mb-4">Your account</h3>
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-full bg-ez-carbon text-white flex items-center justify-center text-ez-lg font-medium">
            {{ initials }}
          </div>
          <div>
            <p class="text-ez-lg font-medium text-ez-heading">{{ profile.fullName }}</p>
            <p class="text-ez-sm text-ez-secondary">{{ roleLabel }}</p>
          </div>
        </div>
        <dl class="grid grid-cols-1 sm:grid-cols-3 gap-6 text-ez-base">
          <div><dt class="ez-label">Email</dt><dd class="text-ez-heading">{{ profile.email }}</dd></div>
          <div><dt class="ez-label">Phone</dt><dd class="text-ez-heading">{{ profile.phone || '-' }}</dd></div>
          <div><dt class="ez-label">Business</dt><dd class="text-ez-heading">{{ tenantName }}</dd></div>
        </dl>
        <p class="text-ez-sm text-ez-muted mt-4">
          To change your name or phone, ask whoever manages users. To change your password, use
          "Forgot password" on the sign-in screen.
        </p>
      </section>

      <section class="border-t border-ez-border pt-6">
        <app-address-list #addressList title="Your addresses" [addresses]="profile.addresses ?? []" [canEdit]="true"
          (save)="saveAddress($event)" (remove)="deleteAddress($event)"></app-address-list>
      </section>
    </div>
    }
  `
})
export class ProfileSettingsComponent implements OnInit {
  private settings = inject(SettingsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmationModalService);

  @ViewChild('addressList') addressList?: AddressListComponent;

  profile: Profile | null = null;
  isLoading = true;
  tenantName = '';

  get initials(): string {
    return (this.profile?.fullName || '').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  get roleLabel(): string {
    const type = this.profile?.userType ?? '';
    return type === 'SUPER_ADMIN' ? 'Owner' : type.charAt(0) + type.slice(1).toLowerCase().replace('_', ' ');
  }

  ngOnInit() {
    this.load();
  }

  private load() {
    this.settings.getProfile().subscribe({
      next: profile => {
        this.profile = profile;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
    this.settings.getTenant().subscribe({ next: t => this.tenantName = t.tenantName, error: () => { } });
  }

  saveAddress(address: Address) {
    if (!this.profile) return;
    this.settings.saveUserAddress(this.profile.id, address).subscribe({
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
    if (!this.profile || !address.id) return;
    const ok = await this.confirmService.open({
      title: 'Delete address',
      message: `Delete the ${address.type.toLowerCase()} address?`,
      intent: 'delete',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    this.settings.deleteUserAddress(this.profile.id, address.id).subscribe({
      next: () => {
        this.toastService.show('Address deleted', 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => this.toastService.show(readApiError(err).message, 'error')
    });
  }
}
