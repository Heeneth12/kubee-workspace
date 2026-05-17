export class SubscriptionModel {
    id?: number;
    plan?: SubscriptionPlanModel;
    status?: SubscriptionStatus;
    startDate?: string;
    endDate?: string;
    autoRenew?: boolean;
    createdAt?: string;
    isValid?: boolean;
    daysRemaining?: number;
}

export class SubscriptionPlanModel {
    id?: number;
    applicationId?: number;
    name?: string;
    description?: string;
    type?: string;
    price?: number;
    durationDays?: number;
    maxUsers?: number;
    isActive?: boolean;
}

export enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
    PENDING_PAYMENT = "PENDING_PAYMENT"
}

export class MiniSubscriptionModel {
    id?: number;
    applicationId?: number;
    status?: SubscriptionStatus;
    startDate?: string;
    endDate?: string;
    isValid?: boolean;
    daysRemaining?: number;
}