import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SubscriptionsService } from './subscriptions.service';
import { DrawerService, ToastService } from 'kubee-ui';
import { SubscriptionPlanModel } from './subscription.model';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subscriptions.component.html',
})
export class SubscriptionsComponent implements OnInit {
  @ViewChild('planFormTemplate') planFormTemplate!: TemplateRef<any>;

  searchControl = new FormControl('');
  items: SubscriptionPlanModel[] = [];
  isLoading = false;

  planForm!: FormGroup;
  isEditMode = false;
  selectedPlanId: number | null = null;
  isSubmitting = false;

  constructor(
    private service: SubscriptionsService,
    private fb: FormBuilder,
    private drawerSvc: DrawerService,
    private toast: ToastService
  ) {
    this.initForm();
  }

  ngOnInit() { this.load(); }

  initForm() {
    this.planForm = this.fb.group({
      applicationId: [1, Validators.required], // Setting a default app ID or letting user type it
      name: ['', Validators.required],
      description: [''],
      type: ['Standard', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      durationDays: [30, [Validators.required, Validators.min(1)]],
      maxUsers: [10, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  load() {
    this.isLoading = true;
    this.service.getAll(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; this.toast.show('Failed to load plans', 'error'); }
    );
  }

  openCreateForm() {
    this.isEditMode = false;
    this.selectedPlanId = null;
    this.planForm.reset({ applicationId: 1, type: 'Standard', price: 0, durationDays: 30, maxUsers: 10, isActive: true });
    this.drawerSvc.openTemplate(this.planFormTemplate, 'Create Subscription Plan', 'lg');
  }

  openEditForm(plan: SubscriptionPlanModel) {
    this.isEditMode = true;
    this.selectedPlanId = plan.id;
    this.planForm.patchValue(plan);
    this.drawerSvc.openTemplate(this.planFormTemplate, 'Edit Subscription Plan', 'lg');
  }

  closeDrawer() {
    this.drawerSvc.close();
  }

  submitForm() {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const data = this.planForm.value;

    if (this.isEditMode && this.selectedPlanId) {
      this.service.editPlan(this.selectedPlanId, data,
        (res: any) => {
          this.toast.show('Plan updated successfully', 'success');
          this.isSubmitting = false;
          this.closeDrawer();
          this.load();
        },
        (err: any) => {
          this.toast.show('Failed to update plan', 'error');
          this.isSubmitting = false;
        }
      );
    } else {
      this.service.createPlan(data,
        (res: any) => {
          this.toast.show('Plan created successfully', 'success');
          this.isSubmitting = false;
          this.closeDrawer();
          this.load();
        },
        (err: any) => {
          this.toast.show('Failed to create plan', 'error');
          this.isSubmitting = false;
        }
      );
    }
  }

  deletePlanAction(id: number) {
    if (confirm('Are you sure you want to delete this plan?')) {
      this.service.deletePlan(id,
        (res: any) => {
          this.toast.show('Plan deleted successfully', 'success');
          this.load();
        },
        (err: any) => {
          this.toast.show('Failed to delete plan', 'error');
        }
      );
    }
  }

  toggleActive(plan: SubscriptionPlanModel) {
    this.service.disablePlan(plan.id,
      (res: any) => {
        this.toast.show('Plan status toggled', 'success');
        this.load();
      },
      (err: any) => {
        this.toast.show('Failed to toggle status', 'error');
      }
    );
  }

  // Legacy/other methods from service implementation requested earlier
  getActivePlans() {
    this.isLoading = true;
    this.service.getActivePlans(
      (res: any) => { this.items = res.data ?? []; this.isLoading = false; },
      () => { this.isLoading = false; }
    );
  }

  getPlanById(id: number) {
    this.service.getPlanById(id,
      (res: any) => { console.log('Plan:', res.data); },
      (err: any) => { console.error('Error fetching plan:', err); }
    );
  }

  subscribeTenant(tenantId: number, planId: number) {
    this.service.subscribeTenant(tenantId, planId,
      (res: any) => { console.log('Subscribed:', res); },
      (err: any) => { console.error('Error subscribing:', err); }
    );
  }

  getCurrentSubscription(tenantId: number) {
    this.service.getCurrentSubscription(tenantId,
      (res: any) => { console.log('Current subscription:', res.data); },
      (err: any) => { console.error('Error fetching subscription:', err); }
    );
  }

  cancelSubscription(subscriptionId: number) {
    this.service.cancelSubscription(subscriptionId,
      (res: any) => { console.log('Cancelled:', res); },
      (err: any) => { console.error('Error cancelling:', err); }
    );
  }
}
