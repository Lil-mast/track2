import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import {
  computeLoanFields,
  mapStrategyStatus,
  splitName,
  toIso,
} from "./lib/loanComputed";

const listFilters = v.object({
  search: v.optional(v.string()),
  status: v.optional(v.string()),
  riskLevel: v.optional(v.string()),
  page: v.optional(v.number()),
  pageSize: v.optional(v.number()),
});

function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 10
): {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

async function getScheduleForLoan(ctx: QueryCtx, loanExternalId: string) {
  return ctx.db
    .query("repaymentSchedule")
    .withIndex("by_loan", (q) => q.eq("loanExternalId", loanExternalId))
    .collect();
}

async function getPaymentsForLoan(ctx: QueryCtx, loanExternalId: string) {
  return ctx.db
    .query("payments")
    .withIndex("by_loan", (q) => q.eq("loanExternalId", loanExternalId))
    .collect();
}

async function loadBorrowerAggregates(
  ctx: QueryCtx,
  borrowerExternalId: string
) {
  const loans = await ctx.db
    .query("loans")
    .withIndex("by_borrower", (q) => q.eq("borrowerExternalId", borrowerExternalId))
    .collect();

  let totalOutstanding = 0;
  let activeLoans = 0;
  let missedPaymentsCount = 0;

  for (const loan of loans) {
    const schedule = await getScheduleForLoan(ctx, loan.externalId);
    const computed = computeLoanFields(loan, schedule, []);
    totalOutstanding += computed.outstandingBalance;
    if (loan.status === "active" || loan.status === "overdue") {
      activeLoans += 1;
    }
    missedPaymentsCount += computed.missedPaymentsCount;
  }

  return { totalOutstanding, activeLoans, missedPaymentsCount };
}

function mapBorrower(
  user: Doc<"users">,
  aggregates: {
    totalOutstanding: number;
    activeLoans: number;
    missedPaymentsCount: number;
  }
) {
  const { firstName, lastName } = splitName(user.name);
  return {
    id: user.externalId,
    lenderId: user.lenderExternalId ?? "",
    firstName,
    lastName,
    email: user.email,
    phone: user.phone ?? "",
    company: user.company,
    address: {
      street: user.addressStreet ?? "",
      city: user.addressCity ?? "",
      state: user.addressState ?? "",
      zip: user.addressZip ?? "",
    },
    riskScore: user.riskScore ?? 0,
    riskLevel: user.riskLevel ?? "low",
    totalOutstanding: aggregates.totalOutstanding,
    activeLoans: aggregates.activeLoans,
    missedPaymentsCount: aggregates.missedPaymentsCount,
    createdAt: toIso(user.createdAt),
    updatedAt: toIso(user.updatedAt),
  };
}

async function mapLoanWithBorrower(ctx: QueryCtx, loan: Doc<"loans">) {
  const borrower = await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) =>
      q.eq("externalId", loan.borrowerExternalId)
    )
    .first();

  const schedule = await getScheduleForLoan(ctx, loan.externalId);
  const payments = await getPaymentsForLoan(ctx, loan.externalId);
  const computed = computeLoanFields(loan, schedule, payments);
  const { firstName, lastName } = splitName(borrower?.name ?? "");

  return {
    id: loan.externalId,
    lenderId: loan.lenderExternalId,
    borrowerId: loan.borrowerExternalId,
    loanNumber: loan.loanNumber,
    principalAmount: loan.principal,
    outstandingBalance: computed.outstandingBalance,
    interestRate: loan.interestRate,
    termMonths: loan.durationMonths,
    monthlyPayment: computed.monthlyPayment,
    status: loan.status,
    riskLevel: loan.riskLevel,
    originationDate: toIso(loan.disbursementDate),
    maturityDate: toIso(computed.maturityDate),
    nextPaymentDueDate: toIso(computed.nextDueDate),
    daysOverdue: computed.daysOverdue,
    missedPaymentsCount: computed.missedPaymentsCount,
    lastPaymentDate: computed.lastPaymentAt
      ? toIso(computed.lastPaymentAt)
      : undefined,
    lastPaymentAmount: computed.lastPaymentAmount,
    collateral: loan.collateral,
    purpose: loan.purpose,
    createdAt: toIso(loan.createdAt),
    updatedAt: toIso(loan.updatedAt),
    borrower: {
      id: loan.borrowerExternalId,
      firstName,
      lastName,
      email: borrower?.email ?? "",
      phone: borrower?.phone ?? "",
      company: borrower?.company,
      riskLevel: borrower?.riskLevel ?? loan.riskLevel,
    },
  };
}

async function mapRecommendation(
  ctx: QueryCtx,
  strategy: Doc<"strategies">,
  loan?: Awaited<ReturnType<typeof mapLoanWithBorrower>>
) {
  const loanData =
    loan ?? (await mapLoanWithBorrower(ctx, (await ctx.db
      .query("loans")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", strategy.loanExternalId)
      )
      .first())!));

  const borrower = await ctx.db
    .query("users")
    .withIndex("by_externalId", (q) =>
      q.eq("externalId", loanData.borrowerId)
    )
    .first();

  const { firstName, lastName } = splitName(borrower?.name ?? "");
  const status = mapStrategyStatus(strategy.status);

  return {
    id: strategy.externalId,
    lenderId: strategy.lenderExternalId,
    loanId: strategy.loanExternalId,
    borrowerId: loanData.borrowerId,
    action: strategy.recoveryAction ?? "email_reminder",
    status,
    priority: strategy.priority ?? 50,
    confidenceScore: strategy.confidenceScore ?? 0.5,
    riskLevel: loanData.riskLevel,
    title:
      strategy.recommendedAction ??
      (strategy.summary ?? "Recovery Strategy").slice(0, 80),
    summary: strategy.summary ?? (strategy.content ?? "").slice(0, 200),
    reasoning: strategy.summary ?? (strategy.content ?? "").slice(0, 500),
    expectedRecoveryAmount: strategy.expectedRecoveryAmount,
    expectedRecoveryRate: strategy.expectedRecoveryRate,
    aiModel: strategy.modelId ?? "amazon.nova-pro-v1:0",
    aiModelVersion: strategy.aiModelVersion ?? "v1:0",
    generatedAt: toIso(strategy.createdAt),
    reviewedAt: strategy.reviewedAt ? toIso(strategy.reviewedAt) : undefined,
    executedAt: strategy.executedAt ? toIso(strategy.executedAt) : undefined,
    expiresAt: toIso(
      strategy.expiresAt ?? strategy.createdAt + 30 * 86_400_000
    ),
    loan: {
      id: loanData.id,
      loanNumber: loanData.loanNumber,
      outstandingBalance: loanData.outstandingBalance,
      daysOverdue: loanData.daysOverdue,
      status: loanData.status,
    },
    borrower: {
      id: loanData.borrowerId,
      firstName,
      lastName,
      email: borrower?.email ?? "",
      phone: borrower?.phone ?? "",
      company: borrower?.company,
      riskLevel: borrower?.riskLevel ?? "low",
      riskScore: borrower?.riskScore ?? 0,
    },
  };
}

export const getLender = query({
  args: { lenderId: v.string() },
  handler: async (ctx, { lenderId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", lenderId))
      .first();

    if (!user || user.role !== "lender") return null;

    return {
      id: user.externalId,
      name: user.name,
      slug: (user.organization ?? "demo").toLowerCase().replace(/\s+/g, "-"),
      industry: "Financial Services",
      contactEmail: user.email,
      contactPhone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "Kenya",
      },
      settings: {
        timezone: "Africa/Nairobi",
        currency: "KES",
        businessHoursStart: "08:00",
        businessHoursEnd: "17:00",
        aiRecommendationsEnabled: true,
        autoApproveLowRiskActions: false,
        maxContactAttemptsPerWeek: 3,
      },
      createdAt: toIso(user.createdAt),
      updatedAt: toIso(user.updatedAt),
    };
  },
});

export const getDashboardStats = query({
  args: { lenderId: v.string() },
  handler: async (ctx, { lenderId }) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_lender", (q) => q.eq("lenderExternalId", lenderId))
      .collect();

    let totalOutstanding = 0;
    let activeLoans = 0;
    let overdueLoans = 0;

    for (const loan of loans) {
      const schedule = await getScheduleForLoan(ctx, loan.externalId);
      const payments = await getPaymentsForLoan(ctx, loan.externalId);
      const computed = computeLoanFields(loan, schedule, payments);
      totalOutstanding += computed.outstandingBalance;
      if (loan.status === "active" || loan.status === "overdue") {
        activeLoans += 1;
      }
      if (loan.status === "overdue" || loan.status === "default") {
        overdueLoans += 1;
      }
    }

    const borrowers = await ctx.db
      .query("users")
      .withIndex("by_lender_and_role", (q) =>
        q.eq("lenderExternalId", lenderId).eq("role", "borrower")
      )
      .collect();

    const highRiskAccounts = borrowers.filter(
      (b) => b.riskLevel === "high" || b.riskLevel === "critical"
    ).length;

    return {
      totalLoans: loans.length,
      activeLoans,
      overdueLoans,
      highRiskAccounts,
      totalOutstanding,
      recoveryRate: 0.73,
    };
  },
});

export const getBorrowers = query({
  args: { lenderId: v.string(), filters: v.optional(listFilters) },
  handler: async (ctx, { lenderId, filters }) => {
    const rows = await ctx.db
      .query("users")
      .withIndex("by_lender_and_role", (q) =>
        q.eq("lenderExternalId", lenderId).eq("role", "borrower")
      )
      .collect();

    let items = await Promise.all(
      rows.map(async (user) => {
        const aggregates = await loadBorrowerAggregates(ctx, user.externalId);
        return mapBorrower(user, aggregates);
      })
    );

    items.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (b) =>
          b.firstName.toLowerCase().includes(q) ||
          b.lastName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.company?.toLowerCase().includes(q)
      );
    }

    if (filters?.riskLevel) {
      items = items.filter((b) => b.riskLevel === filters.riskLevel);
    }

    return paginate(items, filters?.page, filters?.pageSize);
  },
});

export const getBorrowerById = query({
  args: { lenderId: v.string(), borrowerId: v.string() },
  handler: async (ctx, { lenderId, borrowerId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", borrowerId))
      .first();

    if (
      !user ||
      user.role !== "borrower" ||
      user.lenderExternalId !== lenderId
    ) {
      return null;
    }

    const aggregates = await loadBorrowerAggregates(ctx, borrowerId);
    const borrower = mapBorrower(user, aggregates);

    const loans = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerExternalId", borrowerId))
      .collect();

    const loanSummaries = await Promise.all(
      loans.map(async (loan) => {
        const schedule = await getScheduleForLoan(ctx, loan.externalId);
        const payments = await getPaymentsForLoan(ctx, loan.externalId);
        const computed = computeLoanFields(loan, schedule, payments);
        return {
          id: loan.externalId,
          loanNumber: loan.loanNumber,
          outstandingBalance: computed.outstandingBalance,
          status: loan.status,
          daysOverdue: computed.daysOverdue,
          riskLevel: loan.riskLevel,
        };
      })
    );

    return { ...borrower, loans: loanSummaries };
  },
});

export const getLoans = query({
  args: { lenderId: v.string(), filters: v.optional(listFilters) },
  handler: async (ctx, { lenderId, filters }) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_lender", (q) => q.eq("lenderExternalId", lenderId))
      .collect();

    loans.sort((a, b) => b.createdAt - a.createdAt);

    let items = await Promise.all(loans.map((loan) => mapLoanWithBorrower(ctx, loan)));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (l) =>
          l.loanNumber.toLowerCase().includes(q) ||
          l.borrower.firstName.toLowerCase().includes(q) ||
          l.borrower.lastName.toLowerCase().includes(q) ||
          l.borrower.company?.toLowerCase().includes(q)
      );
    }

    if (filters?.status) {
      items = items.filter((l) => l.status === filters.status);
    }

    if (filters?.riskLevel) {
      items = items.filter((l) => l.riskLevel === filters.riskLevel);
    }

    return paginate(items, filters?.page, filters?.pageSize);
  },
});

export const getLoanById = query({
  args: { lenderId: v.string(), loanId: v.string() },
  handler: async (ctx, { lenderId, loanId }) => {
    const loan = await ctx.db
      .query("loans")
      .withIndex("by_externalId", (q) => q.eq("externalId", loanId))
      .first();

    if (!loan || loan.lenderExternalId !== lenderId) return null;

    const enriched = await mapLoanWithBorrower(ctx, loan);

    const paymentRows = await getPaymentsForLoan(ctx, loanId);
    paymentRows.sort((a, b) => b.paymentDate - a.paymentDate);

    const payments = paymentRows.map((p) => ({
      id: p.externalId,
      lenderId,
      loanId,
      borrowerId: p.borrowerExternalId,
      amount: p.amount,
      scheduledDate: toIso(p.paymentDate),
      paidDate: toIso(p.paymentDate),
      status: p.status,
      paymentMethod: p.paymentMethod,
      confirmationNumber: p.confirmationNumber,
      notes: p.notes,
      createdAt: toIso(p.createdAt),
    }));

    const strategies = await ctx.db
      .query("strategies")
      .withIndex("by_loan", (q) => q.eq("loanExternalId", loanId))
      .collect();

    strategies.sort((a, b) => b.createdAt - a.createdAt);

    const recommendations = strategies.map((s) => ({
      id: s.externalId,
      action: s.recoveryAction ?? "email_reminder",
      status: mapStrategyStatus(s.status),
      title: s.recommendedAction ?? s.summary ?? "Recovery Strategy",
      confidenceScore: s.confidenceScore ?? 0.5,
      generatedAt: toIso(s.createdAt),
    }));

    return { ...enriched, payments, recommendations };
  },
});

export const getOverdueLoans = query({
  args: { lenderId: v.string() },
  handler: async (ctx, { lenderId }) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_lender", (q) => q.eq("lenderExternalId", lenderId))
      .collect();

    const overdue = loans.filter(
      (l) => l.status === "overdue" || l.status === "default"
    );

    const items = await Promise.all(
      overdue.map((loan) => mapLoanWithBorrower(ctx, loan))
    );

    items.sort((a, b) => b.daysOverdue - a.daysOverdue);
    return items;
  },
});

export const getMissedPayments = query({
  args: { lenderId: v.string() },
  handler: async (ctx, { lenderId }) => {
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_lender", (q) => q.eq("lenderExternalId", lenderId))
      .collect();

    const results: Array<{
      id: string;
      lenderId: string;
      loanId: string;
      borrowerId: string;
      amount: number;
      scheduledDate: string;
      status: "missed";
      createdAt: string;
    }> = [];

    for (const loan of loans) {
      const schedule = await getScheduleForLoan(ctx, loan.externalId);
      for (const row of schedule.filter((r) => r.status === "missed")) {
        results.push({
          id: row.externalId,
          lenderId,
          loanId: loan.externalId,
          borrowerId: loan.borrowerExternalId,
          amount: row.amountDue,
          scheduledDate: toIso(row.dueDate),
          status: "missed",
          createdAt: toIso(row.createdAt),
        });
      }
    }

    results.sort(
      (a, b) =>
        new Date(b.scheduledDate).getTime() -
        new Date(a.scheduledDate).getTime()
    );

    return results;
  },
});

export const getRecommendations = query({
  args: { lenderId: v.string(), filters: v.optional(listFilters) },
  handler: async (ctx, { lenderId, filters }) => {
    const strategies = await ctx.db
      .query("strategies")
      .withIndex("by_lender", (q) => q.eq("lenderExternalId", lenderId))
      .collect();

    strategies.sort((a, b) => b.createdAt - a.createdAt);

    let items = await Promise.all(
      strategies.map((s) => mapRecommendation(ctx, s))
    );

    if (filters?.status) {
      items = items.filter((r) => r.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.borrower.firstName.toLowerCase().includes(q) ||
          r.borrower.lastName.toLowerCase().includes(q)
      );
    }

    return paginate(items, filters?.page, filters?.pageSize);
  },
});

export const getRecommendationById = query({
  args: { lenderId: v.string(), recommendationId: v.string() },
  handler: async (ctx, { lenderId, recommendationId }) => {
    const strategy = await ctx.db
      .query("strategies")
      .withIndex("by_externalId", (q) => q.eq("externalId", recommendationId))
      .first();

    if (!strategy || strategy.lenderExternalId !== lenderId) return null;
    return mapRecommendation(ctx, strategy);
  },
});

export const getRecentRecommendations = query({
  args: { lenderId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { lenderId, limit = 5 }) => {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    const strategies = await ctx.db
      .query("strategies")
      .withIndex("by_lender", (q) => q.eq("lenderExternalId", lenderId))
      .collect();

    strategies.sort((a, b) => b.createdAt - a.createdAt);
    const slice = strategies.slice(0, safeLimit);
    return Promise.all(slice.map((s) => mapRecommendation(ctx, s)));
  },
});

export const getRules = query({
  args: { lenderId: v.string() },
  handler: async (ctx, { lenderId }) => {
    const rules = await ctx.db
      .query("lenderRules")
      .withIndex("by_lender", (q) => q.eq("lenderExternalId", lenderId))
      .collect();

    rules.sort((a, b) => a.priority - b.priority);

    return rules.map((r) => ({
      id: r.externalId,
      lenderId: r.lenderExternalId,
      name: r.name,
      description: r.description,
      trigger: r.trigger,
      operator: r.operator,
      threshold: r.threshold,
      action: r.action,
      priority: r.priority,
      isActive: r.isActive,
      autoExecute: r.autoExecute,
      cooldownDays: r.cooldownDays,
      createdAt: toIso(r.createdAt),
      updatedAt: toIso(r.updatedAt),
    }));
  },
});

export const getAuditLogs = query({
  args: { lenderId: v.string(), filters: v.optional(listFilters) },
  handler: async (ctx, { lenderId, filters }) => {
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_lender", (q) => q.eq("lenderExternalId", lenderId))
      .collect();

    logs.sort((a, b) => b.createdAt - a.createdAt);

    let items = logs.map((r) => ({
      id: r.externalId,
      lenderId: r.lenderExternalId,
      userId: r.userExternalId,
      userName: r.userName,
      userEmail: r.userEmail,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityExternalId,
      entityLabel: r.entityLabel,
      description: r.description,
      ipAddress: r.ipAddress ?? "",
      userAgent: r.userAgent ?? "",
      metadata: r.metadata as Record<string, unknown> | undefined,
      createdAt: toIso(r.createdAt),
    }));

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (a) =>
          a.description.toLowerCase().includes(q) ||
          a.userName.toLowerCase().includes(q) ||
          a.entityLabel.toLowerCase().includes(q)
      );
    }

    return paginate(items, filters?.page, filters?.pageSize);
  },
});

// ── AI / write helper queries ────────────────────────────────────────────────

export const getLoanForAi = query({
  args: {
    loanId: v.string(),
    lenderId: v.string(),
    borrowerId: v.optional(v.string()),
  },
  handler: async (ctx, { loanId, lenderId, borrowerId }) => {
    const loan = await ctx.db
      .query("loans")
      .withIndex("by_externalId", (q) => q.eq("externalId", loanId))
      .first();

    if (!loan || loan.lenderExternalId !== lenderId) return null;
    if (borrowerId && loan.borrowerExternalId !== borrowerId) return null;

    const borrower = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) =>
        q.eq("externalId", loan.borrowerExternalId)
      )
      .first();

    const schedule = await getScheduleForLoan(ctx, loanId);

    return {
      loan: {
        ...loan,
        borrower_name: borrower?.name,
        borrower_email: borrower?.email,
      },
      repaymentSchedule: schedule,
    };
  },
});

export const getStrategiesForLoan = query({
  args: { loanId: v.string(), lenderId: v.string() },
  handler: async (ctx, { loanId, lenderId }) => {
    const loan = await ctx.db
      .query("loans")
      .withIndex("by_externalId", (q) => q.eq("externalId", loanId))
      .first();

    if (!loan || loan.lenderExternalId !== lenderId) return [];

    const strategies = await ctx.db
      .query("strategies")
      .withIndex("by_loan", (q) => q.eq("loanExternalId", loanId))
      .collect();

    strategies.sort((a, b) => b.createdAt - a.createdAt);

    return strategies.map((s) => ({
      id: s.externalId,
      loan_id: s.loanExternalId,
      lender_id: s.lenderExternalId,
      content: s.content,
      status: s.status,
      model_id: s.modelId,
      risk_score_at_creation: s.riskScoreAtCreation,
      created_at: toIso(s.createdAt),
    }));
  },
});

export const appendAuditLog = mutation({
  args: {
    lenderId: v.string(),
    userId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    action: v.string(),
    entityType: v.string(),
    entityId: v.string(),
    entityLabel: v.string(),
    description: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const externalId = `audit_${now}_${Math.random().toString(36).slice(2, 9)}`;

    await ctx.db.insert("auditLogs", {
      externalId,
      lenderExternalId: args.lenderId,
      userExternalId: args.userId,
      userName: args.userName,
      userEmail: args.userEmail,
      action: args.action as Doc<"auditLogs">["action"],
      entityType: args.entityType as Doc<"auditLogs">["entityType"],
      entityExternalId: args.entityId,
      entityLabel: args.entityLabel,
      description: args.description,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: args.metadata,
      createdAt: now,
    });

    return externalId;
  },
});

export const createStrategyFromEngine = mutation({
  args: {
    lenderId: v.string(),
    loanId: v.string(),
    borrowerId: v.string(),
    action: v.string(),
    status: v.string(),
    priority: v.number(),
    confidenceScore: v.number(),
    riskLevel: v.string(),
    title: v.string(),
    summary: v.string(),
    reasoning: v.string(),
    expectedRecoveryAmount: v.number(),
    expectedRecoveryRate: v.number(),
    aiModel: v.string(),
    aiModelVersion: v.string(),
    generatedAt: v.string(),
    expiresAt: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const externalId = `rec_${now}_${args.loanId.slice(0, 8)}`;

    await ctx.db.insert("strategies", {
      externalId,
      loanExternalId: args.loanId,
      lenderExternalId: args.lenderId,
      riskScoreAtCreation: undefined,
      content: args.reasoning,
      summary: args.summary,
      recommendedAction: args.title,
      recoveryAction: args.action as Doc<"strategies">["recoveryAction"],
      confidenceScore: args.confidenceScore,
      priority: args.priority,
      expectedRecoveryAmount: args.expectedRecoveryAmount,
      expectedRecoveryRate: args.expectedRecoveryRate,
      status: args.status as Doc<"strategies">["status"],
      modelId: args.aiModel,
      aiModelVersion: args.aiModelVersion,
      expiresAt: new Date(args.expiresAt).getTime(),
      createdAt: new Date(args.generatedAt).getTime() || now,
      updatedAt: now,
    });

    return externalId;
  },
});

export const createBedrockStrategy = mutation({
  args: {
    loanId: v.string(),
    lenderId: v.string(),
    content: v.string(),
    modelId: v.string(),
    riskScore: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const externalId = `strat_${now}_${args.loanId.slice(0, 8)}`;

    await ctx.db.insert("strategies", {
      externalId,
      loanExternalId: args.loanId,
      lenderExternalId: args.lenderId,
      content: args.content,
      status: "draft",
      modelId: args.modelId,
      riskScoreAtCreation: args.riskScore,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: externalId,
      status: "draft",
      created_at: toIso(now),
    };
  },
});

export const updateStrategyStatus = mutation({
  args: {
    strategyId: v.string(),
    lenderId: v.string(),
    action: v.union(
      v.literal("approve"),
      v.literal("reject"),
      v.literal("execute")
    ),
    auditMeta: v.optional(
      v.object({
        userName: v.string(),
        userEmail: v.string(),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { strategyId, lenderId, action, auditMeta }) => {
    const strategy = await ctx.db
      .query("strategies")
      .withIndex("by_externalId", (q) => q.eq("externalId", strategyId))
      .first();

    if (!strategy || strategy.lenderExternalId !== lenderId) {
      return null;
    }

    const now = Date.now();
    const updates: Partial<Doc<"strategies">> = { updatedAt: now };

    if (action === "approve") {
      updates.status = "approved";
      updates.approvedAt = now;
      updates.reviewedAt = now;
    } else if (action === "reject") {
      updates.status = "rejected";
      updates.reviewedAt = now;
    } else {
      updates.status = "executed";
      updates.executedAt = now;
      updates.approvedAt = strategy.approvedAt ?? now;
      updates.reviewedAt = now;
    }

    await ctx.db.patch(strategy._id, updates);

    if (auditMeta) {
      const label = strategy.recommendedAction ?? "Recovery Strategy";
      const verbs = { approve: "Approved", reject: "Rejected", execute: "Executed" };
      await ctx.db.insert("auditLogs", {
        externalId: `audit_${now}_${Math.random().toString(36).slice(2, 9)}`,
        lenderExternalId: lenderId,
        userExternalId: lenderId,
        userName: auditMeta.userName,
        userEmail: auditMeta.userEmail,
        action,
        entityType: "recommendation",
        entityExternalId: strategyId,
        entityLabel: label,
        description: `${verbs[action]} AI recovery strategy "${label}"`,
        ipAddress: auditMeta.ipAddress,
        userAgent: auditMeta.userAgent,
        createdAt: now,
      });
    }

    return {
      id: strategy.externalId,
      status: updates.status,
      recommended_action: strategy.recommendedAction,
      approved_at: updates.approvedAt ? toIso(updates.approvedAt) : undefined,
      executed_at: updates.executedAt ? toIso(updates.executedAt) : undefined,
      reviewed_at: updates.reviewedAt ? toIso(updates.reviewedAt) : undefined,
      updated_at: toIso(now),
    };
  },
});

export const createAiInsight = mutation({
  args: {
    loanId: v.string(),
    lenderId: v.string(),
    riskScore: v.number(),
    reasoning: v.string(),
    modelId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const externalId = `insight_${now}_${args.loanId.slice(0, 8)}`;

    await ctx.db.insert("aiInsights", {
      externalId,
      loanExternalId: args.loanId,
      lenderExternalId: args.lenderId,
      riskScore: args.riskScore,
      reasoning: args.reasoning,
      modelId: args.modelId,
      createdAt: now,
    });

    const loan = await ctx.db
      .query("loans")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.loanId))
      .first();

    if (loan) {
      await ctx.db.patch(loan._id, {
        latestRiskScore: args.riskScore,
        updatedAt: now,
      });
    }
  },
});
