// Shapes from doc/shifts-api.md (section 2).

export interface ShiftView {
  uuid: string;
  status: 'OPEN' | 'CLOSED';
  openedBy: string | null; openedAt: string; openingCash: number; openingNotes: string | null;
  closedBy: string | null; closedAt: string | null; closingNotes: string | null;
  cashSales: number;        // live while OPEN
  cashIn: number;
  cashOut: number;
  expectedCash: number;     // live while OPEN
  countedCash: number | null;      // set on close
  cashDifference: number | null;   // counted − expected
  completedOrders: number;  // orders completed during the shift
  netSales: number;
  payments: { method: string; paymentCount: number; paymentAmount: number;
              refundCount: number; refundAmount: number; netAmount: number }[];   // all methods, during the shift
  movements: { uuid: string; type: 'IN' | 'OUT'; amount: number; reason: string;
               createdBy: string | null; movedAt: string }[];
}

export type CashMovementType = 'IN' | 'OUT';

export interface OpenShiftRequest {
  openingCash: number;
  notes?: string;
}

export interface CashMovementRequest {
  type: CashMovementType;
  amount: number;
  reason: string;                 // required
}

export interface CloseShiftRequest {
  countedCash: number;
  notes?: string;
}
