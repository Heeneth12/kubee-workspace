export interface PosItem {
    id: number;
    name: string;
    itemCode: string;
    barcode?: string;
    category: string;
    sellingPrice: number;
    taxPercentage?: number;
    imageUrl?: string;
}

export interface CartLine {
    item: PosItem;
    quantity: number;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'UPI';

export interface PosOrder {
    orderNumber: string;
    createdAt: Date;
    lines: CartLine[];
    subTotal: number;
    taxTotal: number;
    discount: number;
    grandTotal: number;
    paymentMethod: PaymentMethod;
}
