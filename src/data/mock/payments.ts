import type { Payment } from "@/types/payment";
import { DEFAULT_LENDER_ID } from "@/lib/constants";

export const mockPayments: Payment[] = [
  // loan_001 - Apex Logistics primary loan
  { id: "pay_001", lenderId: DEFAULT_LENDER_ID, loanId: "loan_001", borrowerId: "brw_001", amount: 9950, scheduledDate: "2025-06-01T00:00:00Z", status: "missed", createdAt: "2025-06-01T00:00:00Z" },
  { id: "pay_002", lenderId: DEFAULT_LENDER_ID, loanId: "loan_001", borrowerId: "brw_001", amount: 9950, scheduledDate: "2025-05-01T00:00:00Z", status: "missed", createdAt: "2025-05-01T00:00:00Z" },
  { id: "pay_003", lenderId: DEFAULT_LENDER_ID, loanId: "loan_001", borrowerId: "brw_001", amount: 9950, scheduledDate: "2025-04-01T00:00:00Z", status: "missed", createdAt: "2025-04-01T00:00:00Z" },
  { id: "pay_004", lenderId: DEFAULT_LENDER_ID, loanId: "loan_001", borrowerId: "brw_001", amount: 9950, scheduledDate: "2025-03-01T00:00:00Z", paidDate: "2025-03-05T00:00:00Z", status: "paid", paymentMethod: "ACH", confirmationNumber: "ACH-20250305-4421", createdAt: "2025-03-01T00:00:00Z" },
  { id: "pay_005", lenderId: DEFAULT_LENDER_ID, loanId: "loan_001", borrowerId: "brw_001", amount: 9950, scheduledDate: "2025-02-01T00:00:00Z", paidDate: "2025-02-03T00:00:00Z", status: "paid", paymentMethod: "ACH", confirmationNumber: "ACH-20250203-3892", createdAt: "2025-02-01T00:00:00Z" },

  // loan_003 - Greenfield Manufacturing
  { id: "pay_006", lenderId: DEFAULT_LENDER_ID, loanId: "loan_003", borrowerId: "brw_002", amount: 9520, scheduledDate: "2025-06-01T00:00:00Z", status: "missed", createdAt: "2025-06-01T00:00:00Z" },
  { id: "pay_007", lenderId: DEFAULT_LENDER_ID, loanId: "loan_003", borrowerId: "brw_002", amount: 9520, scheduledDate: "2025-05-01T00:00:00Z", status: "missed", createdAt: "2025-05-01T00:00:00Z" },
  { id: "pay_008", lenderId: DEFAULT_LENDER_ID, loanId: "loan_003", borrowerId: "brw_002", amount: 9520, scheduledDate: "2025-04-01T00:00:00Z", paidDate: "2025-04-08T00:00:00Z", status: "partial", paymentMethod: "Wire", confirmationNumber: "WIRE-20250408-1102", notes: "Partial payment - $5,000 of $9,520", createdAt: "2025-04-01T00:00:00Z" },

  // loan_011 - Pacific Builders default
  { id: "pay_009", lenderId: DEFAULT_LENDER_ID, loanId: "loan_011", borrowerId: "brw_007", amount: 15600, scheduledDate: "2025-06-01T00:00:00Z", status: "missed", createdAt: "2025-06-01T00:00:00Z" },
  { id: "pay_010", lenderId: DEFAULT_LENDER_ID, loanId: "loan_011", borrowerId: "brw_007", amount: 15600, scheduledDate: "2025-05-01T00:00:00Z", status: "missed", createdAt: "2025-05-01T00:00:00Z" },
  { id: "pay_011", lenderId: DEFAULT_LENDER_ID, loanId: "loan_011", borrowerId: "brw_007", amount: 15600, scheduledDate: "2025-04-01T00:00:00Z", status: "missed", createdAt: "2025-04-01T00:00:00Z" },
  { id: "pay_012", lenderId: DEFAULT_LENDER_ID, loanId: "loan_011", borrowerId: "brw_007", amount: 15600, scheduledDate: "2025-03-01T00:00:00Z", status: "missed", createdAt: "2025-03-01T00:00:00Z" },
  { id: "pay_013", lenderId: DEFAULT_LENDER_ID, loanId: "loan_011", borrowerId: "brw_007", amount: 15600, scheduledDate: "2025-02-01T00:00:00Z", status: "missed", createdAt: "2025-02-01T00:00:00Z" },
  { id: "pay_014", lenderId: DEFAULT_LENDER_ID, loanId: "loan_011", borrowerId: "brw_007", amount: 15600, scheduledDate: "2025-01-01T00:00:00Z", paidDate: "2025-01-15T00:00:00Z", status: "partial", paymentMethod: "Check", confirmationNumber: "CHK-884521", notes: "Partial payment - $7,800 of $15,600", createdAt: "2025-01-01T00:00:00Z" },

  // loan_005 - Sunrise Hospitality (current)
  { id: "pay_015", lenderId: DEFAULT_LENDER_ID, loanId: "loan_005", borrowerId: "brw_004", amount: 10850, scheduledDate: "2025-06-01T00:00:00Z", paidDate: "2025-06-01T00:00:00Z", status: "paid", paymentMethod: "ACH", confirmationNumber: "ACH-20250601-7723", createdAt: "2025-06-01T00:00:00Z" },
  { id: "pay_016", lenderId: DEFAULT_LENDER_ID, loanId: "loan_005", borrowerId: "brw_004", amount: 10850, scheduledDate: "2025-05-01T00:00:00Z", paidDate: "2025-05-02T00:00:00Z", status: "paid", paymentMethod: "ACH", confirmationNumber: "ACH-20250502-7710", createdAt: "2025-05-01T00:00:00Z" },

  // loan_009 - NovaBio
  { id: "pay_017", lenderId: DEFAULT_LENDER_ID, loanId: "loan_009", borrowerId: "brw_006", amount: 10250, scheduledDate: "2025-06-01T00:00:00Z", status: "missed", createdAt: "2025-06-01T00:00:00Z" },
  { id: "pay_018", lenderId: DEFAULT_LENDER_ID, loanId: "loan_009", borrowerId: "brw_006", amount: 10250, scheduledDate: "2025-05-01T00:00:00Z", status: "missed", createdAt: "2025-05-01T00:00:00Z" },
  { id: "pay_019", lenderId: DEFAULT_LENDER_ID, loanId: "loan_009", borrowerId: "brw_006", amount: 10250, scheduledDate: "2025-04-01T00:00:00Z", status: "missed", createdAt: "2025-04-01T00:00:00Z" },

  // loan_008 - Midwest Grain (current)
  { id: "pay_020", lenderId: DEFAULT_LENDER_ID, loanId: "loan_008", borrowerId: "brw_005", amount: 3680, scheduledDate: "2025-06-01T00:00:00Z", paidDate: "2025-05-28T00:00:00Z", status: "paid", paymentMethod: "ACH", confirmationNumber: "ACH-20250528-3301", createdAt: "2025-06-01T00:00:00Z" },
];
