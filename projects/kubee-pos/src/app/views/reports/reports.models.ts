// Shapes from doc/reports-api.md (section 2).
export interface SalesSummaryReport {
  from: string; to: string;
  completedOrders: number;
  grossSales: number;        // before discounts
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  netSales: number;          // what customers were charged (sum of grand totals)
  averageOrderValue: number;
  collected: number;         // payments received in the period
  refunded: number;          // refunds given in the period
  netCollected: number;      // collected − refunded = money that should be in the drawer/bank
  cancelledOrders: number;
  billsIssued: number;       // bills dated in the period (incl. ones cancelled later)
  billsCancelled: number;    // bills cancelled in the period
  days: { date: string; orders: number; netSales: number; taxAmount: number; averageOrderValue: number }[];
}

export interface PaymentModeRow {
  method: 'CASH' | 'UPI' | 'CARD' | 'WALLET' | 'BANK_TRANSFER' | 'OTHER' | null;  // null on the total row
  paymentCount: number; paymentAmount: number;
  refundCount: number; refundAmount: number;
  netAmount: number;
}
export interface PaymentModeReport { from: string; to: string; methods: PaymentModeRow[]; total: PaymentModeRow; }

export interface ItemSalesRow {
  itemUuid: string | null; itemName: string;
  variantUuid: string | null; variantName: string | null;   // one row per item + variant
  categoryName: string | null;
  unitOfMeasure: string;
  quantity: number;
  orderCount: number;        // orders it appeared in
  grossAmount: number; discountAmount: number; taxableAmount: number; taxAmount: number;
  netAmount: number;         // after discounts, incl. GST
  shareOfSales: number;      // % of totalNetAmount
}
export interface ItemSalesReport { from: string; to: string; totalNetAmount: number; items: ItemSalesRow[]; }

export interface GstReport {
  from: string; to: string;
  totals: {
    invoiceCount: number; taxableAmount: number;
    cgst: number; sgst: number; igst: number; cess: number; totalTax: number;
    roundOff: number; invoiceValue: number;          // invoice value = bill totals incl. round-off
  };
  byRate: { rate: number; taxableAmount: number; cgst: number; sgst: number; igst: number; cess: number;
            totalTax: number; invoiceValue: number }[];          // invoiceValue here excludes round-off
  b2bInvoices: { billNumber: string; billDate: string; customerGstin: string; customerName: string | null;
                 placeOfSupply: string; taxableAmount: number; cgst: number; sgst: number; igst: number;
                 cess: number; invoiceValue: number }[];         // one row per B2B invoice
  b2c: { placeOfSupply: string | null; rate: number; taxableAmount: number;
         cgst: number; sgst: number; igst: number; cess: number }[];   // unregistered buyers, by state + rate
  hsn: { hsnSacCode: string | null; unitOfMeasure: string; rate: number; quantity: number; taxableAmount: number;
         cgst: number; sgst: number; igst: number; cess: number; totalValue: number }[];
  ordersWithoutBill: number;   // completed orders in the period with no issued bill: their tax is NOT in here
  cancelledBills: number;      // bills dated in the period that were cancelled (excluded above)
}

export interface CancellationReport {
  from: string; to: string;
  cancelledOrderCount: number; cancelledOrderValue: number;
  cancelledBillCount: number; cancelledBillValue: number;
  refundCount: number; refundAmount: number;
  cancelledOrders: { orderUuid: string; orderNumber: string; createdAt: string; cancelledAt: string;
                     cancelledBy: string | null; reason: string; lineCount: number; orderValue: number }[];
  cancelledBills: { billUuid: string; billNumber: string; orderNumber: string; billDate: string;
                    cancelledAt: string; cancelledBy: string | null; reason: string; billValue: number }[];
  refunds: { paymentUuid: string; orderUuid: string; orderNumber: string; method: string; amount: number;
             reason: string | null; refundedAt: string; refundedBy: string | null }[];
}

export type ItemSalesSort = 'AMOUNT' | 'QUANTITY';

/** Inclusive date range, yyyy-MM-dd. */
export interface ReportPeriod {
  from: string;
  to: string;
}
