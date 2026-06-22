import type { AuditLog } from "@/types/audit";
import type { Borrower, BorrowerWithLoans } from "@/types/borrower";
import type {
  DashboardStats,
  ListFilters,
  PaginatedResult,
} from "@/types/index";
import type { Lender } from "@/types/lender";
import type {
  LoanWithBorrower,
  LoanWithDetails,
} from "@/types/loan";
import type { Payment } from "@/types/payment";
import type { RecoveryRecommendationWithContext } from "@/types/recovery";
import type { LenderRule } from "@/types/rules";

/**
 * Repository interface — swap MockDataRepository for AuroraDataRepository
 * when connecting to AWS Aurora PostgreSQL.
 */
export interface IDataRepository {
  getLender(lenderId: string): Promise<Lender | null>;
  getDashboardStats(lenderId: string): Promise<DashboardStats>;
  getBorrowers(
    lenderId: string,
    filters?: ListFilters
  ): Promise<PaginatedResult<Borrower>>;
  getBorrowerById(
    lenderId: string,
    borrowerId: string
  ): Promise<BorrowerWithLoans | null>;
  getLoans(
    lenderId: string,
    filters?: ListFilters
  ): Promise<PaginatedResult<LoanWithBorrower>>;
  getLoanById(lenderId: string, loanId: string): Promise<LoanWithDetails | null>;
  getOverdueLoans(lenderId: string): Promise<LoanWithBorrower[]>;
  getMissedPayments(lenderId: string): Promise<Payment[]>;
  getRecommendations(
    lenderId: string,
    filters?: ListFilters
  ): Promise<PaginatedResult<RecoveryRecommendationWithContext>>;
  getRecommendationById(
    lenderId: string,
    recommendationId: string
  ): Promise<RecoveryRecommendationWithContext | null>;
  getRecentRecommendations(
    lenderId: string,
    limit?: number
  ): Promise<RecoveryRecommendationWithContext[]>;
  getRules(lenderId: string): Promise<LenderRule[]>;
  getAuditLogs(
    lenderId: string,
    filters?: ListFilters
  ): Promise<PaginatedResult<AuditLog>>;
}
