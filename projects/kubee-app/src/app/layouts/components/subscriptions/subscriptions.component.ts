import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule, Crown, Calendar, CheckCircle, XCircle,
  Clock, Users, Zap, Star, ShieldCheck, Plus, Ban, RefreshCw,
  AlertTriangle, Package, X
} from 'lucide-angular';
import { AuthService } from '../../guards/auth.service';
import { ModalService, ToastService, CommonService, SubscriptionPlanModel, SubscriptionModel, UserInitResponse } from 'kubee-ui';
import { HttpService } from '../../service/http-svc/http.service';
import { environment } from '../../../../environments/environment.development';

/**
 * Plan changes are requests: ezauth keeps them pending until the platform activates them after payment.
 * Cancelling turns off auto-renew; the plan keeps working until its end date.
 */


@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.css'
})
export class SubscriptionsComponent implements OnInit {

  @ViewChild('cancelSubscriptionModal') cancelSubscriptionModal!: TemplateRef<any>;
  @ViewChild('subscribeModal') subscribeModal!: TemplateRef<any>;

  // Icons
  readonly CrownIcon = Crown;
  readonly CalendarIcon = Calendar;
  readonly CheckCircleIcon = CheckCircle;
  readonly XCircleIcon = XCircle;
  readonly ClockIcon = Clock;
  readonly UsersIcon = Users;
  readonly ZapIcon = Zap;
  readonly StarIcon = Star;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly PlusIcon = Plus;
  readonly BanIcon = Ban;
  readonly RefreshCwIcon = RefreshCw;
  readonly AlertTriangleIcon = AlertTriangle;
  readonly PackageIcon = Package;
  readonly XIcon = X;

  // State
  currentSubscription = signal<SubscriptionModel | null>(null);
  activePlans = signal<SubscriptionPlanModel[]>([]);
  pendingRequest = signal<SubscriptionModel | null>(null);
  // Mirrors ezauth: the owner, or anyone with a *_SETTINGS_EDIT privilege
  canManage = signal(false);
  tenantId = signal<number>(0);
  isLoading = signal(false);
  isPlansLoading = signal(false);
  isSubscribing = signal(false);
  isCancelling = signal(false);
  selectedPlan = signal<SubscriptionPlanModel | null>(null);
  private tenantAppIds = new Set<number>();

  constructor(
    private commonSvc: CommonService,
    private authSvc: AuthService,
    private toastSvc: ToastService,
    private modalSvc: ModalService,
    private http: HttpService
  ) { }

  ngOnInit() {
    this.authSvc.currentUser$.subscribe(user => {
      if (user) {
        this.tenantId.set(user.tenantId);
        this.canManage.set(this.canEditSettings(user));
        this.loadCurrentSubscription();
        this.loadPendingRequest();
      }
    });
    this.loadActivePlans();
  }

  private canEditSettings(user: UserInitResponse): boolean {
    if (user.userRoles?.includes('SUPER_ADMIN')) return true;
    return (user.userApplications || []).some((app: any) =>
      Object.values(app.modulePrivileges || {}).some((perms: any) =>
        Array.isArray(perms) && perms.some((key: string) => key.endsWith('_SETTINGS_EDIT'))));
  }

  loadPendingRequest() {
    this.http.getHttp(
      `${environment.authUrl}/api/v1/subscription/tenant/${this.tenantId()}/pending`,
      (res: any) => this.pendingRequest.set(res.data ?? null),
      (_err: any) => this.pendingRequest.set(null)
    );
  }

  loadCurrentSubscription() {
    this.isLoading.set(true);
    this.commonSvc.getCurrentSubscription(
      this.tenantId(),
      (res: any) => {
        this.currentSubscription.set(res.data);
        this.isLoading.set(false);
      },
      (_err: any) => {
        this.currentSubscription.set(null);
        this.isLoading.set(false);
      }
    );
  }

  loadActivePlans() {
    this.isPlansLoading.set(true);
    // Only plans of apps this business uses; requesting another app's plan is rejected by ezauth
    this.commonSvc.getAllApplications(
      (appsRes: any) => {
        this.tenantAppIds = new Set((appsRes.data || []).map((app: any) => app.id));
        this.fetchPlans();
      },
      (_err: any) => this.fetchPlans()
    );
  }

  private fetchPlans() {
    this.commonSvc.getActiveSubscriptionPlans(
      (res: any) => {
        const plans: SubscriptionPlanModel[] = res.data || [];
        this.activePlans.set(plans
          .filter((plan: any) => !this.tenantAppIds.size || this.tenantAppIds.has(plan.applicationId))
          .sort((a, b) => a.price - b.price));
        this.isPlansLoading.set(false);
      },
      (_err: any) => {
        this.toastSvc.show('Failed to load subscription plans', 'error');
        this.isPlansLoading.set(false);
      }
    );
  }

  openSubscribeModal(plan: SubscriptionPlanModel) {
    this.selectedPlan.set(plan);
    this.modalSvc.openTemplate(
      this.subscribeModal,
      plan,
      'md'
    )
  }

  confirmSubscribe() {
    const plan = this.selectedPlan();
    if (!plan) return;
    this.isSubscribing.set(true);
    this.commonSvc.subscribeTenant(
      this.tenantId(),
      plan.id,
      (res: any) => {
        this.isSubscribing.set(false);
        this.toastSvc.show(res?.data?.message || `Requested ${plan.name}`, 'success');
        this.closeModal();
        this.loadCurrentSubscription();
        this.loadPendingRequest();
      },
      (err: any) => {
        this.isSubscribing.set(false);
        this.toastSvc.show(err?.error?.message || 'Failed to request plan', 'error');
      }
    );
  }

  openCancelModal() {
    this.modalSvc.openTemplate(
      this.cancelSubscriptionModal,
      this.currentSubscription(),
      'md'
    )
  }

  confirmCancel() {
    const sub = this.currentSubscription();
    if (!sub) return;
    this.isCancelling.set(true);
    this.commonSvc.cancelSubscription(
      sub.id,
      (res: any) => {
        this.isCancelling.set(false);
        this.toastSvc.show(res?.data?.message || 'Auto-renew turned off', 'success');
        this.closeModal();
        this.loadCurrentSubscription();
      },
      (err: any) => {
        this.isCancelling.set(false);
        this.toastSvc.show(err?.error?.message || 'Failed to update subscription', 'error');
      }
    );
  }

  withdrawRequest() {
    const pending = this.pendingRequest();
    if (!pending) return;
    this.isCancelling.set(true);
    this.commonSvc.cancelSubscription(
      pending.id,
      (_res: any) => {
        this.isCancelling.set(false);
        this.toastSvc.show('Plan request withdrawn', 'success');
        this.loadPendingRequest();
      },
      (err: any) => {
        this.isCancelling.set(false);
        this.toastSvc.show(err?.error?.message || 'Failed to withdraw request', 'error');
      }
    );
  }

  isRequestedPlan(planId: number): boolean {
    return this.pendingRequest()?.plan?.id === planId;
  }

  closeModal() {
    this.modalSvc.close();
    this.selectedPlan.set(null);
  }

  isCurrentPlan(planId: number): boolean {
    return this.currentSubscription()?.plan?.id === planId &&
      this.currentSubscription()?.status === 'ACTIVE';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      'ACTIVE': 'bg-green-50 text-green-700 border border-green-100',
      'EXPIRED': 'bg-red-50 text-red-700 border border-red-100',
      'CANCELLED': 'bg-gray-100 text-gray-500 border border-gray-200',
      'PENDING': 'bg-yellow-50 text-yellow-700 border border-yellow-100'
    };
    return map[status] || 'bg-gray-100 text-gray-500 border border-gray-200';
  }

  getPlanAccentClass(type: string): {
    border: string; badge: string; icon: string; btn: string;
    iconBg: string; iconColor: string;
  } {
    const map: Record<string, any> = {
      'BASIC': {
        border: 'border-slate-200 hover:border-slate-300',
        badge: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: 'text-slate-400',
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
        btn: 'bg-slate-800 hover:bg-slate-900 text-white border-slate-800'
      },
      'STANDARD': {
        border: 'border-blue-100 hover:border-blue-300',
        badge: 'bg-blue-50 text-blue-600 border-blue-100',
        icon: 'text-blue-500',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-500',
        btn: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
      },
      'PREMIUM': {
        border: 'border-purple-100 hover:border-purple-300',
        badge: 'bg-purple-50 text-purple-600 border-purple-100',
        icon: 'text-purple-500',
        iconBg: 'bg-purple-50',
        iconColor: 'text-purple-500',
        btn: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600'
      },
      'ENTERPRISE': {
        border: 'border-amber-100 hover:border-amber-300',
        badge: 'bg-amber-50 text-amber-700 border-amber-100',
        icon: 'text-amber-500',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        btn: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
      }
    };
    return map[type] || map['BASIC'];
  }
}