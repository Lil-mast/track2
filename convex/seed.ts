import { internalMutation } from "./_generated/server";

const DEMO_LENDER = "b0000001-0000-0000-0000-000000000001";
const DAY = 86_400_000;

function daysAgo(n: number): number {
  return Date.now() - n * DAY;
}

function daysFromNow(n: number): number {
  return Date.now() + n * DAY;
}

export const seedDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", DEMO_LENDER))
      .first();

    if (existing) {
      return { skipped: true, message: "Demo data already seeded" };
    }

    const now = Date.now();

    // Demo lender
    await ctx.db.insert("users", {
      externalId: DEMO_LENDER,
      name: "Demo Lender",
      email: "lender@demo.lendwise.app",
      role: "lender",
      organization: "Demo Bank",
      createdAt: now,
      updatedAt: now,
    });

    const borrowers = [
      {
        externalId: "b0000002-0000-0000-0000-000000000002",
        name: "Alice Wanjiru",
        email: "alice@demo.lendwise.app",
        company: "Wanjiru Enterprises",
        referenceId: "BRW-1001",
        phone: "+254 712 000 001",
        addressStreet: "14 Kimathi Street",
        addressCity: "Nairobi",
        addressState: "Nairobi County",
        addressZip: "00100",
        riskScore: 18,
        riskLevel: "low" as const,
      },
      {
        externalId: "b0000003-0000-0000-0000-000000000003",
        name: "James Otieno",
        email: "james@demo.lendwise.app",
        company: "Otieno Logistics Ltd",
        referenceId: "BRW-1002",
        phone: "+254 722 000 002",
        addressStreet: "7 Oginga Odinga Road",
        addressCity: "Kisumu",
        addressState: "Kisumu County",
        addressZip: "40100",
        riskScore: 82.5,
        riskLevel: "high" as const,
      },
      {
        externalId: "b0000004-0000-0000-0000-000000000004",
        name: "Grace Muthoni",
        email: "grace@demo.lendwise.app",
        company: "Muthoni Textiles",
        referenceId: "BRW-1003",
        phone: "+254 733 000 003",
        addressStreet: "23 Kenyatta Avenue",
        addressCity: "Nakuru",
        addressState: "Nakuru County",
        addressZip: "20100",
        riskScore: 95,
        riskLevel: "critical" as const,
      },
      {
        externalId: "b0000005-0000-0000-0000-000000000005",
        name: "David Kamau",
        email: "david@demo.lendwise.app",
        company: "Kamau Dairy Co.",
        referenceId: "BRW-1004",
        phone: "+254 744 000 004",
        addressStreet: "5 Moi Avenue",
        addressCity: "Mombasa",
        addressState: "Mombasa County",
        addressZip: "80100",
        riskScore: 5,
        riskLevel: "low" as const,
      },
    ];

    for (const b of borrowers) {
      await ctx.db.insert("users", {
        ...b,
        role: "borrower",
        lenderExternalId: DEMO_LENDER,
        createdAt: now,
        updatedAt: now,
      });
    }

    const loans = [
      {
        externalId: "c0000001-0000-0000-0000-000000000001",
        loanNumber: "LN-1001",
        borrowerExternalId: borrowers[0].externalId,
        principal: 15000,
        interestRate: 9.5,
        durationMonths: 12,
        purpose: "working_capital",
        status: "active" as const,
        disbursementDate: daysAgo(30),
        startDate: daysAgo(30),
        latestRiskScore: 18,
        riskLevel: "low" as const,
      },
      {
        externalId: "c0000002-0000-0000-0000-000000000002",
        loanNumber: "LN-1002",
        borrowerExternalId: borrowers[1].externalId,
        principal: 8500,
        interestRate: 12,
        durationMonths: 6,
        purpose: "inventory_purchase",
        status: "overdue" as const,
        disbursementDate: daysAgo(90),
        startDate: daysAgo(90),
        latestRiskScore: 82.5,
        riskLevel: "high" as const,
      },
      {
        externalId: "c0000003-0000-0000-0000-000000000003",
        loanNumber: "LN-1003",
        borrowerExternalId: borrowers[2].externalId,
        principal: 5000,
        interestRate: 18.5,
        durationMonths: 3,
        purpose: "equipment_financing",
        status: "default" as const,
        disbursementDate: daysAgo(180),
        startDate: daysAgo(180),
        latestRiskScore: 95,
        riskLevel: "critical" as const,
      },
      {
        externalId: "c0000004-0000-0000-0000-000000000004",
        loanNumber: "LN-1004",
        borrowerExternalId: borrowers[3].externalId,
        principal: 3000,
        interestRate: 7.2,
        durationMonths: 6,
        purpose: "working_capital",
        status: "paid_off" as const,
        disbursementDate: daysAgo(200),
        startDate: daysAgo(200),
        latestRiskScore: 5,
        riskLevel: "low" as const,
      },
    ];

    for (const loan of loans) {
      await ctx.db.insert("loans", {
        ...loan,
        lenderExternalId: DEMO_LENDER,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Alice schedule (12 installments)
    const aliceSchedule = [
      { due: daysAgo(30), amount: 1312.5, status: "paid" as const, paidAt: daysAgo(30) },
      { due: daysFromNow(0), amount: 1312.5, status: "scheduled" as const },
      ...Array.from({ length: 10 }, (_, i) => ({
        due: daysFromNow(30 * (i + 1)),
        amount: 1312.5,
        status: "scheduled" as const,
      })),
    ];

    for (let i = 0; i < aliceSchedule.length; i++) {
      const row = aliceSchedule[i];
      await ctx.db.insert("repaymentSchedule", {
        externalId: `rs-a001-${i}`,
        loanExternalId: loans[0].externalId,
        dueDate: row.due,
        amountDue: row.amount,
        paidAt: "paidAt" in row ? row.paidAt : undefined,
        status: row.status,
        createdAt: now,
      });
    }

    // James schedule (3 missed)
    const jamesSchedule = [
      { due: daysAgo(60), status: "missed" as const },
      { due: daysAgo(30), status: "missed" as const },
      { due: daysFromNow(0), status: "missed" as const },
      { due: daysFromNow(30), status: "scheduled" as const },
      { due: daysFromNow(60), status: "scheduled" as const },
      { due: daysFromNow(90), status: "scheduled" as const },
    ];

    for (let i = 0; i < jamesSchedule.length; i++) {
      const row = jamesSchedule[i];
      await ctx.db.insert("repaymentSchedule", {
        externalId: `rs-j002-${i}`,
        loanExternalId: loans[1].externalId,
        dueDate: row.due,
        amountDue: 1479.17,
        status: row.status,
        createdAt: now,
      });
    }

    // David schedule (all paid)
    const davidDueDates = [200, 170, 140, 110, 80, 50];
    for (let i = 0; i < davidDueDates.length; i++) {
      const due = daysAgo(davidDueDates[i]);
      await ctx.db.insert("repaymentSchedule", {
        externalId: `rs-d004-${i}`,
        loanExternalId: loans[3].externalId,
        dueDate: due,
        amountDue: 520,
        paidAt: due,
        status: "paid",
        createdAt: now,
      });
    }

    // Lender rules
    await ctx.db.insert("lenderRules", {
      externalId: "rule-001",
      lenderExternalId: DEMO_LENDER,
      name: "Auto Email at 7 Days Overdue",
      description:
        "Send automated email reminder when a loan is 7 or more days overdue.",
      trigger: "days_overdue",
      operator: "gte",
      threshold: 7,
      action: "email_reminder",
      priority: 10,
      isActive: true,
      autoExecute: true,
      cooldownDays: 7,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("lenderRules", {
      externalId: "rule-002",
      lenderExternalId: DEMO_LENDER,
      name: "Escalate After 3 Missed Payments",
      description:
        "Flag loan for collections referral after 3 or more missed payments.",
      trigger: "missed_payments",
      operator: "gte",
      threshold: 3,
      action: "collections_referral",
      priority: 20,
      isActive: true,
      autoExecute: false,
      cooldownDays: 30,
      createdAt: now,
      updatedAt: now,
    });

    // Strategies
    await ctx.db.insert("strategies", {
      externalId: "d0000001-0000-0000-0000-000000000001",
      loanExternalId: loans[1].externalId,
      lenderExternalId: DEMO_LENDER,
      riskScoreAtCreation: 82.5,
      content: `## Recovery Strategy — James Otieno\n\n**Risk Level:** High (82.5/100)\n**Trigger:** 3 missed payments, 60 days overdue`,
      summary:
        "Three missed payments on an overdue loan signals cash-flow stress. A restructuring call is recommended before escalating to collections.",
      recommendedAction: "Restructuring Call",
      recoveryAction: "payment_plan",
      confidenceScore: 0.87,
      priority: 10,
      expectedRecoveryAmount: 5500,
      expectedRecoveryRate: 64.71,
      status: "pending",
      modelId: "amazon.nova-pro-v1:0",
      aiModelVersion: "v1:0",
      expiresAt: daysFromNow(30),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("strategies", {
      externalId: "d0000002-0000-0000-0000-000000000002",
      loanExternalId: loans[2].externalId,
      lenderExternalId: DEMO_LENDER,
      riskScoreAtCreation: 95,
      content: `## Recovery Strategy — Grace Muthoni\n\n**Risk Level:** Critical (95/100)`,
      summary:
        "Loan has been defaulted for 180 days with no borrower response. A final settlement offer has been made and legal referral is pending.",
      recommendedAction: "Escalate to Collections",
      recoveryAction: "collections_referral",
      confidenceScore: 0.94,
      priority: 5,
      expectedRecoveryAmount: 3500,
      expectedRecoveryRate: 70,
      status: "approved",
      modelId: "amazon.nova-pro-v1:0",
      aiModelVersion: "v1:0",
      expiresAt: daysFromNow(14),
      reviewedAt: now,
      approvedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // AI insights
    const insights = [
      { loan: loans[1].externalId, score: 82.5 },
      { loan: loans[1].externalId, score: 74 },
      { loan: loans[2].externalId, score: 95 },
      { loan: loans[0].externalId, score: 18 },
    ];

    for (let i = 0; i < insights.length; i++) {
      await ctx.db.insert("aiInsights", {
        externalId: `insight-seed-${i}`,
        loanExternalId: insights[i].loan,
        lenderExternalId: DEMO_LENDER,
        riskScore: insights[i].score,
        modelId: "amazon.nova-pro-v1:0",
        createdAt: now - i * 3600_000,
      });
    }

    // Audit logs
    const auditEntries = [
      {
        externalId: "audit-seed-1",
        entityExternalId: "d0000002-0000-0000-0000-000000000002",
        entityLabel: "Grace Muthoni — Defaulted Loan",
        action: "approve" as const,
        entityType: "recommendation" as const,
        description:
          "Approved escalation-to-collections strategy for Grace Muthoni.",
      },
      {
        externalId: "audit-seed-2",
        entityExternalId: borrowers[1].externalId,
        entityLabel: "James Otieno",
        action: "view" as const,
        entityType: "borrower" as const,
        description: "Viewed borrower profile and loan detail.",
      },
      {
        externalId: "audit-seed-3",
        entityExternalId: "rule-001",
        entityLabel: "Auto Email at 7 Days Overdue",
        action: "create" as const,
        entityType: "rule" as const,
        description: "Created new automation rule for email reminders.",
      },
    ];

    for (const entry of auditEntries) {
      await ctx.db.insert("auditLogs", {
        ...entry,
        lenderExternalId: DEMO_LENDER,
        userExternalId: DEMO_LENDER,
        userName: "Demo Lender",
        userEmail: "lender@demo.lendwise.app",
        ipAddress: "127.0.0.1",
        createdAt: now,
      });
    }

    // Payments
    await ctx.db.insert("payments", {
      externalId: "pay-a001",
      loanExternalId: loans[0].externalId,
      borrowerExternalId: borrowers[0].externalId,
      amount: 1312.5,
      paymentDate: daysAgo(30),
      status: "paid",
      paymentMethod: "M-Pesa",
      confirmationNumber: "MPE-A001-0001",
      notes: "First instalment paid on time via M-Pesa.",
      createdAt: now,
    });

    await ctx.db.insert("payments", {
      externalId: "pay-j001",
      loanExternalId: loans[1].externalId,
      borrowerExternalId: borrowers[1].externalId,
      amount: 800,
      paymentDate: daysAgo(88),
      status: "partial",
      paymentMethod: "M-Pesa",
      confirmationNumber: "MPE-J002-0001",
      notes:
        "Partial payment — borrower cited cash flow issues. Remaining KES 679.17 unpaid.",
      createdAt: now,
    });

    const davidPayments = [
      { days: 200, conf: "BNK-D001-0001", note: "Instalment 1 of 6" },
      { days: 169, conf: "BNK-D001-0002", note: "Instalment 2 of 6" },
      { days: 140, conf: "BNK-D001-0003", note: "Instalment 3 of 6" },
      { days: 110, conf: "BNK-D001-0004", note: "Instalment 4 of 6" },
      { days: 79, conf: "BNK-D001-0005", note: "Instalment 5 of 6" },
      { days: 50, conf: "BNK-D001-0006", note: "Final instalment — loan fully repaid." },
    ];

    for (let i = 0; i < davidPayments.length; i++) {
      const p = davidPayments[i];
      await ctx.db.insert("payments", {
        externalId: `pay-d00${i}`,
        loanExternalId: loans[3].externalId,
        borrowerExternalId: borrowers[3].externalId,
        amount: 520,
        paymentDate: daysAgo(p.days),
        status: "paid",
        paymentMethod: "Bank Transfer",
        confirmationNumber: p.conf,
        notes: p.note,
        createdAt: now,
      });
    }

    return { skipped: false, message: "Demo portfolio seeded successfully" };
  },
});

export const clearDemo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "notifications",
      "auditLogs",
      "aiInsights",
      "strategies",
      "lenderRules",
      "payments",
      "repaymentSchedule",
      "loans",
      "users",
    ] as const;

    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }

    return { message: "All data cleared" };
  },
});
