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

export class SubscriptionSummaryModel {
    id!: number;
    name!: string;
    description!: string;
    type!: string;
    price!: number;
    durationDays!: number;
    maxUsers!: number;
    isActive!: boolean;
    application!: MiniApplicationModel;
}

export class MiniApplicationModel {
    id!: number;
    appName!: string;
    appKey!: string;
}