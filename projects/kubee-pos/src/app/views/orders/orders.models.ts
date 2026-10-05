// Shapes from doc/orders-api.md (section 2).

export type OrderType = 'COUNTER' | 'TAKEAWAY' | 'DINE_IN' | 'DELIVERY';
export type OrderStatus = 'OPEN' | 'HELD' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'BANK_TRANSFER' | 'OTHER';
export type PaymentType = 'PAYMENT' | 'REFUND';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
export type DiscountType = 'PERCENT' | 'FLAT';

export interface OrderView {
  uuid: string;
  orderNumber: string;            // token for the customer, daily
  clientRef: string | null;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string | null;
  customerPhone: string | null;   // digits only, e.g. "9848022338"
  tableLabel: string | null;
  notes: string | null;
  subTotal: number;               // before any discount
  discountType: DiscountType | null;   // the bill discount as entered
  discountValue: number | null;
  discountAmount: number;         // all discounts in rupees (line + bill)
  discountReason: string | null;
  taxableAmount: number;
  taxAmount: number;
  roundOffAmount: number;         // may be negative
  grandTotal: number;
  paidAmount: number;             // payments − refunds
  dueAmount: number;
  createdBy: string | null;       // user uuid
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  lines: OrderLineView[];
  payments: PaymentView[];
}

export interface OrderLineView {
  uuid: string;
  itemUuid: string | null;        // null if the item was deleted since
  variantUuid: string | null;
  itemName: string;
  variantName: string | null;     // "Medium (10\")"
  hsnSacCode: string | null;
  unitOfMeasure: string;
  quantity: number;               // up to 3 decimals
  unitPrice: number;
  addonsUnitPrice: number;        // add-ons per unit of the line
  priceIncludesTax: boolean;
  lineAmount: number;
  discountType: DiscountType | null;   // the line discount as entered
  discountValue: number | null;
  discountAmount: number;         // line discount + share of bill discount
  taxRate: number;                // 5.000 = 5%
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes: string | null;           // "less spicy"
  addons: OrderLineAddonView[];
}

export interface OrderLineAddonView {
  uuid: string;
  addonUuid: string | null;
  name: string;
  quantity: number;               // per unit of the line
  unitPrice: number;
}

export interface PaymentView {
  uuid: string;
  clientRef: string | null;
  type: PaymentType;
  method: PaymentMethod;
  status: TransactionStatus;
  amount: number;
  tenderedAmount: number | null;  // cash handed over
  changeAmount: number | null;    // cash to give back
  refundableAmount: number | null;// PAYMENT rows: how much can still be refunded
  referenceNo: string | null;     // UPI UTR / card approval code
  refundOfPaymentUuid: string | null;  // REFUND rows
  notes: string | null;
  paidAt: string;
  receivedBy: string | null;
}

export interface OrderSummaryView {
  uuid: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string | null;
  customerPhone: string | null;
  tableLabel: string | null;
  lineCount: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  completedAt: string | null;
}

// ---------------------------------------------------------------- requests

export interface OrderLineRequest {
  itemUuid: string;
  variantUuid?: string;           // required when the item hasVariants
  quantity?: number;              // default 1
  unitPrice?: number;             // ONLY for openPrice items
  addons?: { addonUuid: string; quantity?: number }[];
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
}

export interface CreateOrderRequest {
  clientRef?: string;             // uuid made on the device: makes the call safe to retry
  orderType?: OrderType;          // default COUNTER
  customerName?: string;
  customerPhone?: string;
  tableLabel?: string;
  notes?: string;
  lines?: OrderLineRequest[];
  discount?: DiscountRequest;
}

export interface ChangeOrderLineRequest {   // full replace: omitted discount / note = removed
  quantity: number;
  discountType?: DiscountType;
  discountValue?: number;
  notes?: string;
}

export interface DiscountRequest { type: DiscountType; value: number; reason?: string; }

export interface OrderDetailsRequest {      // full replace: omitted fields are cleared
  orderType?: OrderType;
  customerName?: string;
  customerPhone?: string;
  tableLabel?: string;
  notes?: string;
}

export interface PaymentRequest {
  clientRef?: string;             // uuid made on the device: a retry is ignored, never double-charged
  method: PaymentMethod;
  amount?: number;                // required except for CASH with tenderedAmount
  tenderedAmount?: number;        // CASH only
  referenceNo?: string;
  notes?: string;
}

export interface RefundRequest {
  clientRef?: string;
  amount: number;
  method?: PaymentMethod;         // default: same as the original payment
  reason: string;
}

export interface OrderSearchParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderType?: OrderType;
  from?: string;                  // yyyy-MM-dd, inclusive
  to?: string;                    // yyyy-MM-dd, inclusive
  search?: string;                // order number, phone, name
  page?: number;                  // default 0
  size?: number;                  // default 50, max 200
}
