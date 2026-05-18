import { Inject, Injectable } from '@angular/core';
import { HttpService } from '../http-svc/http.service';
import { KUBEE_CONFIG, KubeeConfig } from '../../config/kubee-config.token';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  private readonly BASE_URL: string;
  private readonly AUTH_BASE_URL: string;
  private readonly TENANT_BASE_URL: string;
  private readonly USER_BASE_URL: string;
  private readonly BRANCH_BASE_URL: string;
  private readonly SUBSCRIPTION_BASE_URL: string;
  private readonly INTEGRATIONS_BASE_URL: string;
  private readonly COMMON_BASE_URL: string;
  private readonly USER_REQUEST_BASE_URL: string;

  constructor(
    private httpService: HttpService,
    @Inject(KUBEE_CONFIG) private config: KubeeConfig
  ) {
    this.BASE_URL = this.config.authUrl;
    this.AUTH_BASE_URL = this.BASE_URL + '/api/v1/auth';
    this.TENANT_BASE_URL = this.BASE_URL + '/api/v1/tenant';
    this.USER_BASE_URL = this.BASE_URL + '/api/v1/user';
    this.BRANCH_BASE_URL = this.BASE_URL + '/api/v1/branch';
    this.SUBSCRIPTION_BASE_URL = this.BASE_URL + '/api/v1/subscription';
    this.INTEGRATIONS_BASE_URL = this.BASE_URL + '/api/v1/integration';
    this.COMMON_BASE_URL = this.BASE_URL + '/api/v1/common';
    this.USER_REQUEST_BASE_URL = this.BASE_URL + '/api/v1/userrequest';
  }

  // ─── Auth APIs ────────────────────────────────────────────────────────────

  registerTenant(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/register`, request, success, error);
  }

  signIn(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/signin`, request, success, error);
  }

  initUser(success: any, error: any) {
    return this.httpService.getHttp(`${this.AUTH_BASE_URL}/user/init`, success, error);
  }

  refreshToken(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/refresh`, request, success, error);
  }

  signInWithGoogle(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/google`, request, success, error);
  }

  validateToken(success: any, error: any) {
    return this.httpService.getHttp(`${this.AUTH_BASE_URL}/validate`, success, error);
  }

  signOut(success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/signout`, null, success, error);
  }

  forgotPassword(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/forgot-password`, request, success, error);
  }

  resetPassword(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/reset-password`, request, success, error);
  }

  resendOtp(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/resend-otp`, request, success, error);
  }

  verifyTenant(tenantId: any, otp: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.AUTH_BASE_URL}/verifyTenant?tenantId=${tenantId}&otp=${otp}`, null, success, error);
  }

  // ─── Branch APIs ──────────────────────────────────────────────────────────

  createBranch(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.BRANCH_BASE_URL}`, request, success, error);
  }

  updateBranch(branchId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.BRANCH_BASE_URL}/${branchId}`, request, success, error);
  }

  deleteBranch(branchId: number, success: any, error: any) {
    return this.httpService.deleteHttp(`${this.BRANCH_BASE_URL}/${branchId}`, success, error);
  }

  getBranchById(branchId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.BRANCH_BASE_URL}/${branchId}`, success, error);
  }

  getBranches(success: any, error: any) {
    return this.httpService.getHttp(`${this.BRANCH_BASE_URL}`, success, error);
  }

  getBranchSummaries(success: any, error: any) {
    return this.httpService.getHttp(`${this.BRANCH_BASE_URL}/summary`, success, error);
  }

  getMyBranch(success: any, error: any) {
    return this.httpService.getHttp(`${this.BRANCH_BASE_URL}/my`, success, error);
  }

  getBranchUsers(branchId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.BRANCH_BASE_URL}/${branchId}/users`, success, error);
  }

  assignUserToBranch(branchId: number, userId: number, success: any, error: any) {
    return this.httpService.patchHttp(`${this.BRANCH_BASE_URL}/${branchId}/users/${userId}`, null, success, error);
  }

  removeUserFromBranch(branchId: number, userId: number, success: any, error: any) {
    return this.httpService.deleteHttp(`${this.BRANCH_BASE_URL}/${branchId}/users/${userId}`, success, error);
  }

  addBranchAddress(branchId: number, request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.BRANCH_BASE_URL}/${branchId}/address`, request, success, error);
  }

  deleteBranchAddress(branchId: number, addressId: number, success: any, error: any) {
    return this.httpService.deleteHttp(`${this.BRANCH_BASE_URL}/${branchId}/address/${addressId}`, success, error);
  }

  // ─── User APIs ────────────────────────────────────────────────────────────

  createUser(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.USER_BASE_URL}/create`, request, success, error);
  }

  getAllUsers(page: number, size: number, filter: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.USER_BASE_URL}/all?page=${page}&size=${size}`, filter, success, error);
  }

  getBulkUsers(ids: number[], includeAddress: boolean = false, success: any, error: any) {
    return this.httpService.getHttp(`${this.USER_BASE_URL}/bulk?ids=${ids.join(',')}&address=${includeAddress}`, success, error);
  }

  getUserById(userId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.USER_BASE_URL}/${userId}`, success, error);
  }

  updateUser(userId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.USER_BASE_URL}/${userId}`, request, success, error);
  }

  toggleUserStatus(userId: number, success: any, error: any) {
    return this.httpService.putHttp(`${this.USER_BASE_URL}/${userId}/toggle-status`, null, success, error);
  }

  searchUsers(page: number = 0, size: number = 50, filter: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.USER_BASE_URL}/search?page=${page}&size=${size}`, filter, success, error);
  }

  getCurrentUser(success: any, error: any) {
    return this.httpService.getHttp(`${this.USER_BASE_URL}/me`, success, error);
  }

  addUserAddress(userId: number, request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.USER_BASE_URL}/${userId}/address`, request, success, error);
  }

  updateUserAddress(userId: number, addressId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.USER_BASE_URL}/${userId}/address/${addressId}`, request, success, error);
  }

  getUserAddresses(userId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.USER_BASE_URL}/${userId}/addresses`, success, error);
  }

  deleteUserAddress(userId: number, addressId: number, success: any, error: any) {
    return this.httpService.deleteHttp(`${this.USER_BASE_URL}/${userId}/address/${addressId}`, success, error);
  }

  // ─── Tenant APIs ──────────────────────────────────────────────────────────

  getAllTenants(page: number, size: number, success: any, error: any) {
    return this.httpService.postHttp(`${this.TENANT_BASE_URL}/all?page=${page}&size=${size}`, null, success, error);
  }

  getBulkTenants(ids: number[], success: any, error: any) {
    return this.httpService.getHttp(`${this.TENANT_BASE_URL}/bulk?ids=${ids.join(',')}`, success, error);
  }

  updateTenant(tenantId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.TENANT_BASE_URL}/${tenantId}`, request, success, error);
  }

  getTenantById(tenantId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.TENANT_BASE_URL}/${tenantId}`, success, error);
  }

  getCurrentTenant(success: any, error: any) {
    return this.httpService.getHttp(`${this.TENANT_BASE_URL}/current`, success, error);
  }

  toggleTenantStatus(tenantId: number, success: any, error: any) {
    return this.httpService.putHttp(`${this.TENANT_BASE_URL}/${tenantId}/toggle-status`, null, success, error);
  }

  createTenantDetails(tenantId: number, request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.TENANT_BASE_URL}/${tenantId}/details`, request, success, error);
  }

  updateTenantDetails(tenantId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.TENANT_BASE_URL}/${tenantId}/details`, request, success, error);
  }

  getTenantDetails(tenantId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.TENANT_BASE_URL}/${tenantId}/details`, success, error);
  }

  createTenantAddress(tenantId: number, request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.TENANT_BASE_URL}/${tenantId}/address`, request, success, error);
  }

  updateTenantAddress(tenantId: number, addressId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.TENANT_BASE_URL}/${tenantId}/address/${addressId}`, request, success, error);
  }

  deleteTenantAddress(tenantId: number, addressId: number, success: any, error: any) {
    return this.httpService.deleteHttp(`${this.TENANT_BASE_URL}/${tenantId}/address/${addressId}`, success, error);
  }

  getTenantBranches(tenantId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.TENANT_BASE_URL}/${tenantId}/branches`, success, error);
  }

  getTenantBranchSummaries(tenantId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.TENANT_BASE_URL}/${tenantId}/branches/summary`, success, error);
  }

  // ─── Subscription APIs ────────────────────────────────────────────────────

  subscribeTenant(tenantId: number, planId: number, success: any, error: any) {
    return this.httpService.postHttp(`${this.SUBSCRIPTION_BASE_URL}/tenant/${tenantId}/plan/${planId}`, null, success, error);
  }

  getCurrentSubscription(tenantId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.SUBSCRIPTION_BASE_URL}/tenant/${tenantId}/current`, success, error);
  }

  cancelSubscription(subscriptionId: number, success: any, error: any) {
    return this.httpService.putHttp(`${this.SUBSCRIPTION_BASE_URL}/${subscriptionId}/cancel`, null, success, error);
  }

  createSubscriptionPlan(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.SUBSCRIPTION_BASE_URL}`, request, success, error);
  }

  updateSubscriptionPlan(planId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.SUBSCRIPTION_BASE_URL}/plan/${planId}`, request, success, error);
  }

  deleteSubscriptionPlan(planId: number, success: any, error: any) {
    return this.httpService.deleteHttp(`${this.SUBSCRIPTION_BASE_URL}/plan/${planId}`, success, error);
  }

  disableSubscriptionPlan(planId: number, success: any, error: any) {
    return this.httpService.patchHttp(`${this.SUBSCRIPTION_BASE_URL}/plan/${planId}/disable`, null, success, error);
  }

  getAllSubscriptionPlans(page: number = 0, size: number = 10, isActive: boolean | null = null, success: any, error: any) {
    const activeParam = isActive !== null ? `&isActive=${isActive}` : '';
    return this.httpService.getHttp(`${this.SUBSCRIPTION_BASE_URL}/plan/all?page=${page}&size=${size}${activeParam}`, success, error);
  }

  getActiveSubscriptionPlans(success: any, error: any) {
    return this.httpService.getHttp(`${this.SUBSCRIPTION_BASE_URL}/active`, success, error);
  }

  getSubscriptionPlanById(planId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.SUBSCRIPTION_BASE_URL}/${planId}`, success, error);
  }

  // ─── Integration APIs ─────────────────────────────────────────────────────

  createIntegration(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.INTEGRATIONS_BASE_URL}`, request, success, error);
  }

  getIntegrations(success: any, error: any) {
    return this.httpService.getHttp(`${this.INTEGRATIONS_BASE_URL}`, success, error);
  }

  getIntegrationByType(type: string, success: any, error: any) {
    return this.httpService.getHttp(`${this.INTEGRATIONS_BASE_URL}/by-type?type=${type}`, success, error);
  }

  checkIntegration(type: string, success: any, error: any) {
    return this.httpService.getHttp(`${this.INTEGRATIONS_BASE_URL}/check?type=${type}`, success, error);
  }

  getIntegrationById(integrationId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.INTEGRATIONS_BASE_URL}/${integrationId}`, success, error);
  }

  updateIntegration(integrationId: number, request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.INTEGRATIONS_BASE_URL}/${integrationId}/update`, request, success, error);
  }

  deleteIntegration(integrationId: number, success: any, error: any) {
    return this.httpService.postHttp(`${this.INTEGRATIONS_BASE_URL}/${integrationId}/delete`, null, success, error);
  }

  toggleIntegration(integrationId: number, success: any, error: any) {
    return this.httpService.patchHttp(`${this.INTEGRATIONS_BASE_URL}/${integrationId}/toggle`, null, success, error);
  }

  testIntegrationConnection(integrationId: number, success: any, error: any) {
    return this.httpService.postHttp(`${this.INTEGRATIONS_BASE_URL}/${integrationId}/test-connection`, null, success, error);
  }

  // ─── Common APIs ─────────────────────────────────────────────────────────

  getAllApplications(success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/app/all`, success, error);
  }

  createApplication(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.COMMON_BASE_URL}/app/create`, request, success, error);
  }

  updateApplication(applicationId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.COMMON_BASE_URL}/app/${applicationId}`, request, success, error);
  }

  deleteApplication(applicationId: number, success: any, error: any) {
    return this.httpService.postHttp(`${this.COMMON_BASE_URL}/app/${applicationId}/delete`, null, success, error);
  }

  getAllRoles(success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/role/all`, success, error);
  }

  createRole(request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.COMMON_BASE_URL}/role/create`, request, success, error);
  }

  updateRole(roleId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.COMMON_BASE_URL}/role/${roleId}`, request, success, error);
  }

  deleteRole(roleId: number, success: any, error: any) {
    return this.httpService.postHttp(`${this.COMMON_BASE_URL}/role/${roleId}/delete`, null, success, error);
  }

  getModulesByApplicationId(applicationId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/app/${applicationId}/modules`, success, error);
  }

  getPrivilegesByModuleId(moduleId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/module/${moduleId}/privileges`, success, error);
  }

  getApplicationsByUserType(userType: string, success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/app/user-type/${userType}`, success, error);
  }

  getAddressTypes(success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/address/types`, success, error);
  }

  getAddresses(entityType: string, entityId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/address/${entityType}/${entityId}`, success, error);
  }

  getAddress(addressTypeId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/address/type/${addressTypeId}`, success, error);
  }

  getAddressById(addressId: number, success: any, error: any) {
    return this.httpService.getHttp(`${this.COMMON_BASE_URL}/address/${addressId}`, success, error);
  }

  createAddress(entityType: string, entityId: number, request: any, success: any, error: any) {
    return this.httpService.postHttp(`${this.COMMON_BASE_URL}/address/${entityType}/${entityId}`, request, success, error);
  }

  updateAddress(addressId: number, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.COMMON_BASE_URL}/address/${addressId}`, request, success, error);
  }

  deleteAddress(addressId: number, success: any, error: any) {
    return this.httpService.postHttp(`${this.COMMON_BASE_URL}/address/${addressId}/delete`, null, success, error);
  }

  setPrimaryAddress(addressId: number, success: any, error: any) {
    return this.httpService.postHttp(`${this.COMMON_BASE_URL}/address/${addressId}/primary`, null, success, error);
  }

  // ─── User Request APIs ────────────────────────────────────────────────────

  createRequest(type: 'app' | 'mkt', request: any, success: any, error: any) {
    const url = type === 'app' ? `${this.USER_REQUEST_BASE_URL}` : `${this.USER_REQUEST_BASE_URL}/mkt`;
    return this.httpService.postHttp(url, request, success, error);
  }

  getRequestById(userReqUuid: any, success: any, error: any) {
    return this.httpService.getHttp(`${this.USER_REQUEST_BASE_URL}/${userReqUuid}`, success, error);
  }

  updateRequest(userReqUuid: any, request: any, success: any, error: any) {
    return this.httpService.putHttp(`${this.USER_REQUEST_BASE_URL}/${userReqUuid}`, request, success, error);
  }

  getRequestsWithPagination(tenantUuid: any, page: any, size: any, sortBy: any, sortDir: any, success: any, error: any) {
    return this.httpService.getHttp(
      `${this.USER_REQUEST_BASE_URL}?tenantUuid=${tenantUuid}&page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`,
      success, error
    );
  }
}