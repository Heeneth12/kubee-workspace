// Shapes of the ezauth tenant, profile, subscription and integration APIs.

export type AddressType = 'BILLING' | 'SHIPPING' | 'REGISTERED' | 'OPERATIONAL' | 'OFFICE' | 'HOME' | 'OTHER';
export const ADDRESS_TYPES: AddressType[] = ['BILLING', 'SHIPPING', 'REGISTERED', 'OPERATIONAL', 'OFFICE', 'HOME', 'OTHER'];

export interface Address {
  id?: number | null;
  addressLine1: string;
  addressLine2?: string | null;
  route?: string | null;
  area?: string | null;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  type: AddressType;
  isPrimary?: boolean | null;
}

export type BusinessType = 'RETAIL' | 'WHOLESALE' | 'MANUFACTURING' | 'DISTRIBUTION' | 'ECOMMERCE' | 'SERVICE_PROVIDER';
export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: 'RETAIL', label: 'Retail' },
  { value: 'WHOLESALE', label: 'Wholesale' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'DISTRIBUTION', label: 'Distribution' },
  { value: 'ECOMMERCE', label: 'E-commerce' },
  { value: 'SERVICE_PROVIDER', label: 'Service Provider' },
];

export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'SGD', 'AUD', 'CAD', 'JPY'];
export const TIME_ZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Riyadh', 'Asia/Singapore', 'Asia/Tokyo',
  'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Australia/Sydney', 'UTC',
];

export interface TenantDetails {
  businessType: BusinessType;
  legalName: string;
  baseCurrency: string;
  timeZone: string;
  gstNumber?: string | null;
  panNumber?: string | null;
  supportEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  website?: string | null;
}

export interface Tenant {
  id: number;
  tenantName: string;
  tenantCode: string;
  tenantDetails: TenantDetails | null;
  tenantAddress: Address[] | null;
}

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  userType: string;
  addresses: Address[] | null;
}

export type PlanType = 'LIFETIME' | 'MONTHLY' | 'YEARLY';

export interface Plan {
  id: number;
  applicationId: number;
  name: string;
  description: string | null;
  type: PlanType;
  price: number;
  durationDays: number;
  maxUsers: number | null;
  isActive: boolean;
}

export interface Subscription {
  id: number;
  plan: Plan;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  daysRemaining: number;
}

// Only the types the ezauth IntegrationType enum accepts
export type IntegrationType = 'RAZORPAY' | 'STRIPE' | 'WHATSAPP' | 'EMAIL_SMTP';

export interface Integration {
  id: number;
  integrationType: IntegrationType | string;
  displayName: string | null;
  primaryKey: string | null;
  secondaryKey: string | null;
  tertiaryKey: string | null;
  isTestMode: boolean;
  isConnected: boolean;
  isActive: boolean;
  connectedAt: string | null;
}

export interface IntegrationRequest {
  integrationType: IntegrationType;
  displayName?: string;
  primaryKey?: string;
  secondaryKey?: string;
  tertiaryKey?: string;
  isTestMode: boolean;
}

/** What each provider calls its three credential fields. */
export interface IntegrationProvider {
  type: IntegrationType;
  label: string;
  description: string;
  keys: [string, string, string?];
}

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  { type: 'RAZORPAY', label: 'Razorpay', description: 'Card and UPI payments at the counter.', keys: ['Key ID', 'Key secret', 'Webhook secret'] },
  { type: 'STRIPE', label: 'Stripe', description: 'Card payments and online checkout.', keys: ['Publishable key', 'Secret key', 'Webhook secret'] },
  { type: 'WHATSAPP', label: 'WhatsApp Business', description: 'Send bills and order updates on WhatsApp.', keys: ['Phone number ID', 'Access token', 'Business account ID'] },
  { type: 'EMAIL_SMTP', label: 'Email (SMTP)', description: 'Email bills and reports from your own address.', keys: ['SMTP host:port', 'Username', 'Password'] },
];
