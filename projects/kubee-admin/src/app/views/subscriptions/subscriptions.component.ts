import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DrawerService, ToastService, CommonService, ApplicationModel, PlanType } from 'kubee-ui';
import { SubscriptionPlanModel, SubscriptionSummaryModel } from './subscription.model';

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
  subscriptionPlans: SubscriptionSummaryModel[] = [];
  isLoading = false;

  applicationList: ApplicationModel[] = [];
  planTypeList: PlanType[] = [PlanType.MONTHLY, PlanType.YEARLY, PlanType.LIFETIME];

  planForm!: FormGroup;
  isEditMode = false;
  selectedPlanId: number | null = null;
  isSubmitting = false;

  // pagination
  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  constructor(
    private commonSvc: CommonService,
    private fb: FormBuilder,
    private drawerSvc: DrawerService,
    private toastSvc: ToastService
  ) {
    this.initForm();
  }

  ngOnInit() { this.load(); this.getApplications(); }

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
    this.commonSvc.getAllSubscriptionPlans(
      this.page,
      this.size,
      null,
      (res: any) => {
        this.subscriptionPlans = res.data.content ?? [];
        this.isLoading = false;
        this.totalPages = res.data.totalPages;
        this.totalElements = res.data.totalElements;
      },
      (err: any) => {
        this.isLoading = false;
        this.toastSvc.show('Failed to load plans', 'error');
      }
    );
  }

  openCreateForm() {
    this.isEditMode = false;
    this.selectedPlanId = null;
    this.planForm.reset({ applicationId: 1, type: 'Standard', price: 0, durationDays: 30, maxUsers: 10, isActive: true });
    this.drawerSvc.openTemplate(this.planFormTemplate, 'Create Subscription Plan', 'lg');
  }

  openEditForm(id: number) {
    this.isEditMode = true;
    this.selectedPlanId = id;
    this.commonSvc.getSubscriptionPlanById(id,
      (res: any) => { this.planForm.patchValue(res.data); },
      (err: any) => { this.toastSvc.show('Failed to load plan', 'error'); }
    );
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
      this.commonSvc.updateSubscriptionPlan(this.selectedPlanId, data,
        (res: any) => {
          this.toastSvc.show('Plan updated successfully', 'success');
          this.isSubmitting = false;
          this.closeDrawer();
          this.load();
        },
        (err: any) => {
          this.toastSvc.show('Failed to update plan', 'error');
          this.isSubmitting = false;
        }
      );
    } else {
      this.commonSvc.createSubscriptionPlan(data,
        (res: any) => {
          this.toastSvc.show('Plan created successfully', 'success');
          this.isSubmitting = false;
          this.closeDrawer();
          this.load();
        },
        (err: any) => {
          this.toastSvc.show('Failed to create plan', 'error');
          this.isSubmitting = false;
        }
      );
    }
  }

  deletePlanAction(id: number) {
    if (confirm('Are you sure you want to delete this plan?')) {
      this.commonSvc.deleteSubscriptionPlan(id,
        (res: any) => {
          this.toastSvc.show('Plan deleted successfully', 'success');
          this.load();
        },
        (err: any) => {
          this.toastSvc.show('Failed to delete plan', 'error');
        }
      );
    }
  }

  toggleStatus(id: number, status: boolean) {
    this.commonSvc.updateSubscriptionPlanStatus(id,
      status,
      (res: any) => {
        this.toastSvc.show('Plan status toggled', 'success');
        this.load();
      },
      (err: any) => {
        this.toastSvc.show('Failed to toggle status', 'error');
      }
    );
  }


  getApplications() {
    this.commonSvc.getAllApplications((res: any) => {
      this.applicationList = res.data;
    }, (err: any) => {
      this.toastSvc.show('Failed to load applications', 'error');
    });
  }

  getPlanById(id: number) {
    this.commonSvc.getSubscriptionPlanById(id,
      (res: any) => { console.log('Plan:', res.data); },
      (err: any) => { console.error('Error fetching plan:', err); }
    );
  }

  subscribeTenant(tenantId: number, planId: number) {
    this.commonSvc.subscribeTenant(tenantId, planId,
      (res: any) => { console.log('Subscribed:', res); },
      (err: any) => { console.error('Error subscribing:', err); }
    );
  }

  getCurrentSubscription(tenantId: number) {
    this.commonSvc.getCurrentSubscription(tenantId,
      (res: any) => { console.log('Current subscription:', res.data); },
      (err: any) => { console.error('Error fetching subscription:', err); }
    );
  }

  cancelSubscription(subscriptionId: number) {
    this.commonSvc.cancelSubscription(subscriptionId,
      (res: any) => { console.log('Cancelled:', res); },
      (err: any) => { console.error('Error cancelling:', err); }
    );
  }
}
