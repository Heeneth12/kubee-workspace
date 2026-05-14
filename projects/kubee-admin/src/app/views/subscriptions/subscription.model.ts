export class SubscriptionPlanModel {
    id!: number;
    applicationId!: number;
    name!: string;
    description!: string;
    type!: string;
    price!: number;
    durationDays!: number;
    maxUsers!: number;
    isActive!: boolean;
}

export class SubscriptionModel {
    id!: number;
    plan!: SubscriptionPlanModel;
    status!: string;
    startDate!: string;
    endDate!: string;
    autoRenew!: boolean;
    createdAt!: string;
    isValid!: boolean;
    daysRemaining!: number;
}