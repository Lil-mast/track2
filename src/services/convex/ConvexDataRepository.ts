import { api, fetchMutation, fetchQuery } from "@/lib/convex/server";
import type { IDataRepository } from "@/services/interfaces/IDataRepository";
import type { AuditLog } from "@/types/audit";
import type { Borrower, BorrowerWithLoans } from "@/types/borrower";
import type {
  DashboardStats,
  ListFilters,
  PaginatedResult,
} from "@/types/index";
import type { Lender } from "@/types/lender";
import type { LoanWithBorrower, LoanWithDetails } from "@/types/loan";
import type { Payment } from "@/types/payment";
import type { RecoveryRecommendationWithContext } from "@/types/recovery";
import type { LenderRule } from "@/types/rules";

export class ConvexDataRepository implements IDataRepository {
  async getLender(lenderId: string): Promise<Lender | null> {
    return fetchQuery(api.repository.getLender, { lenderId });
  }

  async getDashboardStats(lenderId: string): Promise<DashboardStats> {
    return fetchQuery(api.repository.getDashboardStats, { lenderId });
  }

  async getBorrowers(
    lenderId: string,
    filters?: ListFilters
  ): Promise<PaginatedResult<Borrower>> {
    return fetchQuery(api.repository.getBorrowers, { lenderId, filters });
  }

  async getBorrowerById(
    lenderId: string,
    borrowerId: string
  ): Promise<BorrowerWithLoans | null> {
    return fetchQuery(api.repository.getBorrowerById, { lenderId, borrowerId });
  }

  async getLoans(
    lenderId: string,
    filters?: ListFilters
  ): Promise<PaginatedResult<LoanWithBorrower>> {
    return fetchQuery(api.repository.getLoans, { lenderId, filters });
  }

  async getLoanById(
    lenderId: string,
    loanId: string
  ): Promise<LoanWithDetails | null> {
    return fetchQuery(api.repository.getLoanById, { lenderId, loanId });
  }

  async getOverdueLoans(lenderId: string): Promise<LoanWithBorrower[]> {
    return fetchQuery(api.repository.getOverdueLoans, { lenderId });
  }

  async getMissedPayments(lenderId: string): Promise<Payment[]> {
    return fetchQuery(api.repository.getMissedPayments, { lenderId });
  }

  async getRecommendations(
    lenderId: string,
    filters?: ListFilters
  ): Promise<PaginatedResult<RecoveryRecommendationWithContext>> {
    return fetchQuery(api.repository.getRecommendations, { lenderId, filters });
  }

  async getRecommendationById(
    lenderId: string,
    recommendationId: string
  ): Promise<RecoveryRecommendationWithContext | null> {
    return fetchQuery(api.repository.getRecommendationById, {
      lenderId,
      recommendationId,
    });
  }

  async getRecentRecommendations(
    lenderId: string,
    limit?: number
  ): Promise<RecoveryRecommendationWithContext[]> {
    return fetchQuery(api.repository.getRecentRecommendations, {
      lenderId,
      limit,
    });
  }

  async getRules(lenderId: string): Promise<LenderRule[]> {
    return fetchQuery(api.repository.getRules, { lenderId });
  }

  async getAuditLogs(
    lenderId: string,
    filters?: ListFilters
  ): Promise<PaginatedResult<AuditLog>> {
    return fetchQuery(api.repository.getAuditLogs, { lenderId, filters });
  }
}

export const convexDataRepository = new ConvexDataRepository();

export async function appendAuditLogConvex(args: {
  lenderId: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  return fetchMutation(api.repository.appendAuditLog, args);
}

export async function createStrategyFromEngineConvex(args: {
  lenderId: string;
  loanId: string;
  borrowerId: string;
  action: string;
  status: string;
  priority: number;
  confidenceScore: number;
  riskLevel: string;
  title: string;
  summary: string;
  reasoning: string;
  expectedRecoveryAmount: number;
  expectedRecoveryRate: number;
  aiModel: string;
  aiModelVersion: string;
  generatedAt: string;
  expiresAt: string;
}): Promise<string> {
  return fetchMutation(api.repository.createStrategyFromEngine, args);
}
