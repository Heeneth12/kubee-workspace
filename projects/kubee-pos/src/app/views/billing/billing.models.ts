// Shapes from doc/billing-api.md (section 2).

export type BillStatus = 'ISSUED' | 'CANCELLED';
export type TaxType = 'CGST' | 'SGST' | 'IGST' | 'CESS' | 'OTHER';
export type ShareChannel = 'PRINT' | 'WHATSAPP' | 'SMS';

export interface BillView {
  uuid: string;
  billNumber: string;             // "KPA/26-27/000001"
  billDate: string;
  status: BillStatus;
  orderUuid: string;
  orderNumber: string;            // token on the order
  seller: { name: string; address: string | null; gstin: string | null; stateCode: string | null };
  buyer: { name: string | null; phone: string | null; gstin: string | null; placeOfSupply: string | null };
  interState: boolean;            // true = IGST bill
  subTotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  roundOffAmount: number;
  grandTotal: number;
  amountInWords: string;          // "Rupees Four Hundred Eighty Five Only"
  lines: BillLineView[];
  taxSummary: TaxSummaryView[];   // the tax table at the bottom of the invoice
  hsnSummary: HsnSummaryView[];   // HSN/SAC-wise summary
  printCount: number;
  sharedVia: ShareChannel | null; // last way it reached the customer
  issuedBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
}

export interface BillLineView {
  uuid: string;
  itemName: string;               // "Margherita Pizza (Medium (10\"))" = item (variant)
  addonsText: string | null;      // "+ Thin Crust, Extra Cheese"
  hsnSacCode: string | null;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;              // including add-ons
  lineAmount: number;
  discountAmount: number;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxes: { taxType: TaxType; taxName: string; rate: number; taxableAmount: number; taxAmount: number }[];
}

export interface TaxSummaryView { taxType: TaxType; rate: number; taxableAmount: number; taxAmount: number; }

export interface HsnSummaryView {
  hsnSacCode: string | null; taxRate: number; quantity: number;
  taxableAmount: number; taxAmount: number; totalAmount: number;
}

export interface BillSummaryView {
  uuid: string; billNumber: string; billDate: string; status: BillStatus;
  orderUuid: string; orderNumber: string;
  customerName: string | null; customerPhone: string | null; customerGstin: string | null;
  taxableAmount: number; taxAmount: number; grandTotal: number; printCount: number;
}

export interface IssueBillRequest {
  orderUuid: string;
  series?: string;                // default "A"
  customerName?: string;          // default: from the order
  customerPhone?: string;         // default: from the order
  customerGstin?: string;         // B2B only
  placeOfSupply?: string;         // 2-digit state code; default: GSTIN's state, else the shop's
}

export interface BillSearchParams {
  status?: BillStatus;
  from?: string;                  // yyyy-MM-dd
  to?: string;                    // yyyy-MM-dd
  search?: string;                // bill number, order number, phone, GSTIN
  page?: number;
  size?: number;
}
