import {
  mockBorrowers,
  mockLoans,
  mockPayments,
  mockRecommendations,
  mockRules,
  mockLenders,
} from "@/data/mock";
import { getAuditLogs } from "@/data/mock/runtime-store";
import type { IDataRepository } from "@/services/interfaces/IDataRepository";
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
import type {
  RecoveryRecommendationWithContext,
} from "@/types/recovery";
import type { LenderRule } from "@/types/rules";

function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 10
): PaginatedResult<T> {
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

function enrichLoanWithBorrower(
  loan: (typeof mockLoans)[0]
): LoanWithBorrower {
  const borrower = mockBorrowers.find((b) => b.id === loan.borrowerId)!;
  return {
    ...loan,
    borrower: {
      id: borrower.id,
      firstName: borrower.firstName,
      lastName: borrower.lastName,
      email: borrower.email,
      phone: borrower.phone,
      company: borrower.company,
      riskLevel: borrower.riskLevel,
    },
  };
}

function enrichRecommendation(
  rec: (typeof mockRecommendations)[0]
): RecoveryRecommendationWithContext {
  const loan = mockLoans.find((l) => l.id === rec.loanId)!;
  const borrower = mockBorrowers.find((b) => b.id === rec.borrowerId)!;
  return {
    ...rec,
    loan: {
      id: loan.id,
      loanNumber: loan.loanNumber,
      outstandingBalance: loan.outstandingBalance,
      daysOverdue: loan.daysOverdue,
      status: loan.status,
    },
    borrower: {
      id: borrower.id,
      firstName: borrower.firstName,
      lastName: borrower.lastName,
      email: borrower.email,
      phone: borrower.phone,
      company: borrower.company,
      riskLevel: borrower.riskLevel,
      riskScore: borrower.riskScore,
    },
  };
}

export class MockDataRepository implements IDataRepository {
  async getLender(lenderId: string): Promise<Lender | null> {
    return mockLenders.find((l) => l.id === lenderId) ?? null;
  }

  async getDashboardStats(lenderId: string): Promise<DashboardStats> {
    const loans = mockLoans.filter((l) => l.lenderId === lenderId);
    const activeLoans = loans.filter(
      (l) => l.status === "active" || l.status === "overdue"
    );
    const overdueLoans = loans.filter(
      (l) => l.status === "overdue" || l.status === "default"
    );
    const highRiskBorrowers = mockBorrowers.filter(
      (b) =>
        b.lenderId === lenderId &&
        (b.riskLevel === "high" || b.riskLevel === "critical")
    );

    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      overdueLoans: overdueLoans.length,
      highRiskAccounts: highRiskBorrowers.length,
      totalOutstanding: loans.reduce((sum, l) => sum + l.outstandingBalance, 0),
      recoveryRate: 0.73,
    };
  }

  async getBorrowers(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<Borrower>> {
    let items = mockBorrowers.filter((b) => b.lenderId === lenderId);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (b) =>
          b.firstName.toLowerCase().includes(q) ||
          b.lastName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.company?.toLowerCase().includes(q)
      );
    }

    if (filters.riskLevel) {
      items = items.filter((b) => b.riskLevel === filters.riskLevel);
    }

    return paginate(items, filters.page, filters.pageSize);
  }

  async getBorrowerById(
    lenderId: string,
    borrowerId: string
  ): Promise<BorrowerWithLoans | null> {
    const borrower = mockBorrowers.find(
      (b) => b.id === borrowerId && b.lenderId === lenderId
    );
    if (!borrower) return null;

    const loans = mockLoans
      .filter((l) => l.borrowerId === borrowerId)
      .map((l) => ({
        id: l.id,
        loanNumber: l.loanNumber,
        outstandingBalance: l.outstandingBalance,
        status: l.status,
        daysOverdue: l.daysOverdue,
        riskLevel: l.riskLevel,
      }));

    return { ...borrower, loans };
  }

  async getLoans(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<LoanWithBorrower>> {
    let items = mockLoans
      .filter((l) => l.lenderId === lenderId)
      .map(enrichLoanWithBorrower);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (l) =>
          l.loanNumber.toLowerCase().includes(q) ||
          l.borrower.firstName.toLowerCase().includes(q) ||
          l.borrower.lastName.toLowerCase().includes(q) ||
          l.borrower.company?.toLowerCase().includes(q)
      );
    }

    if (filters.status) {
      items = items.filter((l) => l.status === filters.status);
    }

    if (filters.riskLevel) {
      items = items.filter((l) => l.riskLevel === filters.riskLevel);
    }

    return paginate(items, filters.page, filters.pageSize);
  }

  async getLoanById(
    lenderId: string,
    loanId: string
  ): Promise<LoanWithDetails | null> {
    const loan = mockLoans.find(
      (l) => l.id === loanId && l.lenderId === lenderId
    );
    if (!loan) return null;

    const enriched = enrichLoanWithBorrower(loan);
    const payments = mockPayments.filter((p) => p.loanId === loanId);
    const recommendations = mockRecommendations
      .filter((r) => r.loanId === loanId)
      .map((r) => ({
        id: r.id,
        action: r.action,
        status: r.status,
        title: r.title,
        confidenceScore: r.confidenceScore,
        generatedAt: r.generatedAt,
      }));

    return { ...enriched, payments, recommendations };
  }

  async getOverdueLoans(lenderId: string): Promise<LoanWithBorrower[]> {
    return mockLoans
      .filter(
        (l) =>
          l.lenderId === lenderId &&
          (l.status === "overdue" || l.status === "default")
      )
      .map(enrichLoanWithBorrower);
  }

  async getMissedPayments(lenderId: string): Promise<Payment[]> {
    return mockPayments.filter(
      (p) => p.lenderId === lenderId && p.status === "missed"
    );
  }

  async getRecommendations(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<RecoveryRecommendationWithContext>> {
    let items = mockRecommendations
      .filter((r) => r.lenderId === lenderId)
      .map(enrichRecommendation);

    if (filters.status) {
      items = items.filter((r) => r.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.borrower.firstName.toLowerCase().includes(q) ||
          r.borrower.lastName.toLowerCase().includes(q)
      );
    }

    items.sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );

    return paginate(items, filters.page, filters.pageSize);
  }

  async getRecommendationById(
    lenderId: string,
    recommendationId: string
  ): Promise<RecoveryRecommendationWithContext | null> {
    const rec = mockRecommendations.find(
      (r) => r.id === recommendationId && r.lenderId === lenderId
    );
    return rec ? enrichRecommendation(rec) : null;
  }

  async getRecentRecommendations(
    lenderId: string,
    limit = 5
  ): Promise<RecoveryRecommendationWithContext[]> {
    return mockRecommendations
      .filter((r) => r.lenderId === lenderId)
      .map(enrichRecommendation)
      .sort(
        (a, b) =>
          new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      )
      .slice(0, limit);
  }

  async getRules(lenderId: string): Promise<LenderRule[]> {
    return mockRules
      .filter((r) => r.lenderId === lenderId)
      .sort((a, b) => a.priority - b.priority);
  }

  async getAuditLogs(
    lenderId: string,
    filters: ListFilters = {}
  ): Promise<PaginatedResult<AuditLog>> {
    let items = getAuditLogs().filter((a) => a.lenderId === lenderId);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (a) =>
          a.description.toLowerCase().includes(q) ||
          a.userName.toLowerCase().includes(q) ||
          a.entityLabel.toLowerCase().includes(q)
      );
    }

    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return paginate(items, filters.page, filters.pageSize);
  }
}

export const mockDataRepository = new MockDataRepository();
