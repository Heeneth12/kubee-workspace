import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService, ConfirmationModalService } from 'kubee-ui';
import { LucideAngularModule, Plug } from 'lucide-angular';
import { SettingsService } from './settings.service';
import { INTEGRATION_PROVIDERS, Integration, IntegrationProvider, IntegrationRequest } from './settings.models';
import { readApiError } from '../catalog/catalog-errors';

interface ProviderCard {
  provider: IntegrationProvider;
  configured?: Integration;
}

/** Third-party credentials for this business. Saved keys are never shown again; leave a field blank to keep it. */
@Component({
  selector: 'app-integrations-settings',
  standalone: true,
  imports: [FormsModule, DatePipe, LucideAngularModule],
  template: `
    @if (isLoading) {
    <p class="p-6 text-ez-sm text-ez-muted">Loading...</p>
    } @else {
    <div class="p-6 max-w-5xl">
      @if (!canEdit) {
      <div class="border border-ez-border bg-ez-ash text-ez-sm text-ez-secondary px-4 py-3 mb-6">You can see which services are connected. Ask the owner to change them.</div>
      }
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (card of cards; track card.provider.type) {
        <div class="border border-ez-border p-5 flex flex-col">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-ez-ash flex items-center justify-center">
                <lucide-icon [img]="icons.plug" class="w-5 h-5 text-ez-secondary"></lucide-icon>
              </div>
              <div>
                <p class="text-ez-base font-medium text-ez-heading">{{ card.provider.label }}</p>
                <p class="text-ez-xs text-ez-muted">{{ card.provider.description }}</p>
              </div>
            </div>
            @if (card.configured) {
            <span class="px-2 py-0.5 text-ez-xs font-medium shrink-0"
              [class]="card.configured.isActive ? 'bg-green-50 text-green-700' : 'bg-ez-ash text-ez-secondary'">
              {{ card.configured.isActive ? 'Active' : 'Off' }}{{ card.configured.isTestMode ? ' · test' : '' }}
            </span>
            }
          </div>

          @if (card.configured && editing !== card.provider.type) {
          <p class="text-ez-xs text-ez-muted mt-3">Connected {{ card.configured.connectedAt | date:'mediumDate' }}</p>
          }

          @if (editing === card.provider.type) {
          <div class="mt-4 space-y-3">
            @for (keyLabel of card.provider.keys; track $index) {
            @if (keyLabel) {
            <div>
              <label class="ez-label">{{ keyLabel }} @if ($index < 2 && !card.configured) { <span class="text-red-500">*</span> }</label>
              <input [type]="$index === 0 ? 'text' : 'password'" [(ngModel)]="draft[$index]" autocomplete="off"
                [placeholder]="card.configured ? 'Leave blank to keep the saved value' : ''" class="ez-input ez-input--default w-full">
            </div>
            }
            }
            <label class="flex items-center gap-2 text-ez-sm text-ez-body cursor-pointer">
              <input type="checkbox" [(ngModel)]="draftTestMode" style="accent-color: var(--ez-color-primary);" class="w-4 h-4">
              Test mode (sandbox keys)
            </label>
            @if (formError) { <p class="text-ez-sm text-red-600">{{ formError }}</p> }
            <div class="flex justify-end gap-3">
              <button type="button" (click)="editing = null" class="ez-btn ez-btn-secondary">Cancel</button>
              <button type="button" (click)="save(card)" [disabled]="busy" class="ez-btn ez-btn-primary">{{ busy ? 'Saving...' : 'Save' }}</button>
            </div>
          </div>
          } @else if (canEdit) {
          <div class="flex flex-wrap gap-3 mt-4 pt-4 border-t border-ez-border">
            <button type="button" (click)="open(card)" class="ez-btn ez-btn-secondary !min-h-0 !py-1.5">{{ card.configured ? 'Update keys' : 'Connect' }}</button>
            @if (card.configured) {
            <button type="button" (click)="toggle(card.configured)" [disabled]="busy" class="ez-btn ez-btn-secondary !min-h-0 !py-1.5">
              {{ card.configured.isActive ? 'Turn off' : 'Turn on' }}
            </button>
            <button type="button" (click)="remove(card)" [disabled]="busy" class="ez-btn ez-btn-secondary !min-h-0 !py-1.5 hover:!text-red-600 ml-auto">Disconnect</button>
            }
          </div>
          }
        </div>
        }
      </div>
    </div>
    }
  `
})
export class IntegrationsSettingsComponent implements OnInit {
  private settings = inject(SettingsService);
  private toastService = inject(ToastService);
  private confirmService = inject(ConfirmationModalService);

  readonly icons = { plug: Plug };
  readonly canEdit = this.settings.canEditSettings();

  cards: ProviderCard[] = [];
  isLoading = true;
  busy = false;
  editing: string | null = null;
  draft: string[] = ['', '', ''];
  draftTestMode = false;
  formError: string | null = null;

  ngOnInit() {
    this.load();
  }

  private load() {
    this.settings.getIntegrations().subscribe({
      next: integrations => {
        this.cards = INTEGRATION_PROVIDERS.map(provider => ({
          provider,
          configured: integrations.find(i => i.integrationType === provider.type),
        }));
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  open(card: ProviderCard) {
    this.editing = card.provider.type;
    this.draft = ['', '', ''];
    this.draftTestMode = card.configured?.isTestMode ?? false;
    this.formError = null;
  }

  save(card: ProviderCard) {
    const [primary, secondary, tertiary] = this.draft.map(v => v.trim());
    // Blank means "keep": only send keys that were typed
    const keys: Partial<IntegrationRequest> = {};
    if (primary) keys.primaryKey = primary;
    if (secondary) keys.secondaryKey = secondary;
    if (tertiary) keys.tertiaryKey = tertiary;

    if (!card.configured && (!primary || !secondary)) {
      this.formError = `${card.provider.keys[0]} and ${card.provider.keys[1]} are required.`;
      return;
    }

    this.busy = true;
    const request$ = card.configured
      ? this.settings.updateIntegration(card.configured.id, { ...keys, isTestMode: this.draftTestMode })
      : this.settings.createIntegration({
        integrationType: card.provider.type,
        displayName: card.provider.label,
        isTestMode: this.draftTestMode,
        ...keys,
      });
    request$.subscribe({
      next: () => {
        this.busy = false;
        this.editing = null;
        this.draft = ['', '', ''];
        this.toastService.show(`${card.provider.label} saved`, 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.formError = readApiError(err).message;
      }
    });
  }

  toggle(integration: Integration) {
    this.busy = true;
    this.settings.toggleIntegration(integration.id).subscribe({
      next: () => { this.busy = false; this.load(); },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }

  async remove(card: ProviderCard) {
    if (!card.configured) return;
    const ok = await this.confirmService.open({
      title: `Disconnect ${card.provider.label}`,
      message: 'The saved keys will be removed. Anything using this service will stop working.',
      intent: 'delete',
      confirmLabel: 'Disconnect',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    this.busy = true;
    this.settings.deleteIntegration(card.configured.id).subscribe({
      next: () => {
        this.busy = false;
        this.toastService.show(`${card.provider.label} disconnected`, 'success');
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.busy = false;
        this.toastService.show(readApiError(err).message, 'error');
      }
    });
  }
}
