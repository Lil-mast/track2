import type { PaymentStatus } from "./index";

export interface Payment {
  id: string;
  lenderId: string;
  loanId: string;
  borrowerId: string;
  amount: number;
  scheduledDate: string;
  paidDate?: string;
  status: PaymentStatus;
  paymentMethod?: string;
  confirmationNumber?: string;
  notes?: string;
  createdAt: string;
}
