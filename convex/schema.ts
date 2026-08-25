import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const riskLevel = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("critical")
);

const userRole = v.union(
  v.literal("lender"),
  v.literal("borrower"),
  v.literal("admin")
);

const loanStatus = v.union(
  v.literal("active"),
  v.literal("overdue"),
  v.literal("default"),
  v.literal("paid_off"),
  v.literal("charged_off")
);

const paymentStatus = v.union(
  v.literal("scheduled"),
  v.literal("paid"),
  v.literal("missed"),
  v.literal("partial"),
  v.literal("failed")
);

const strategyStatus = v.union(
  v.literal("draft"),
  v.literal("pending"),
  v.literal("approved"),
  v.literal("rejected"),
  v.literal("executed"),
  v.literal("dispatched"),
  v.literal("expired")
);

const recoveryAction = v.union(
  v.literal("email_reminder"),
  v.literal("sms_reminder"),
  v.literal("phone_call"),
  v.literal("payment_plan"),
  v.literal("hardship_review"),
  v.literal("legal_notice"),
  v.literal("collections_referral")
);

const ruleTrigger = v.union(
  v.literal("days_overdue"),
  v.literal("missed_payments"),
  v.literal("risk_score"),
  v.literal("balance_threshold")
);

const ruleOperator = v.union(
  v.literal("gte"),
  v.literal("lte"),
  v.literal("eq"),
  v.literal("gt"),
  v.literal("lt")
);

const auditAction = v.union(
  v.literal("login"),
  v.literal("view"),
  v.literal("create"),
  v.literal("update"),
  v.literal("delete"),
  v.literal("approve"),
  v.literal("reject"),
  v.literal("execute"),
  v.literal("export")
);

const auditEntityType = v.union(
  v.literal("borrower"),
  v.literal("loan"),
  v.literal("payment"),
  v.literal("recommendation"),
  v.literal("rule"),
  v.literal("user"),
  v.literal("settings")
);

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    name: v.string(),
    email: v.string(),
    role: userRole,
    organization: v.optional(v.string()),
    lenderExternalId: v.optional(v.string()),
    company: v.optional(v.string()),
    referenceId: v.optional(v.string()),
    phone: v.optional(v.string()),
    addressStreet: v.optional(v.string()),
    addressCity: v.optional(v.string()),
    addressState: v.optional(v.string()),
    addressZip: v.optional(v.string()),
    riskScore: v.optional(v.number()),
    riskLevel: v.optional(riskLevel),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_lender_and_role", ["lenderExternalId", "role"])
    .index("by_email", ["email"]),

  loans: defineTable({
    externalId: v.string(),
    loanNumber: v.string(),
    borrowerExternalId: v.string(),
    lenderExternalId: v.string(),
    principal: v.number(),
    interestRate: v.number(),
    durationMonths: v.number(),
    purpose: v.string(),
    status: loanStatus,
    disbursementDate: v.number(),
    startDate: v.number(),
    latestRiskScore: v.optional(v.number()),
    riskLevel: riskLevel,
    collateral: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_lender", ["lenderExternalId"])
    .index("by_borrower", ["borrowerExternalId"]),

  repaymentSchedule: defineTable({
    externalId: v.string(),
    loanExternalId: v.string(),
    dueDate: v.number(),
    amountDue: v.number(),
    paidAt: v.optional(v.number()),
    status: paymentStatus,
    createdAt: v.number(),
  })
    .index("by_loan", ["loanExternalId"])
    .index("by_externalId", ["externalId"]),

  payments: defineTable({
    externalId: v.string(),
    loanExternalId: v.string(),
    borrowerExternalId: v.string(),
    amount: v.number(),
    paymentDate: v.number(),
    status: paymentStatus,
    paymentMethod: v.optional(v.string()),
    confirmationNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_loan", ["loanExternalId"])
    .index("by_externalId", ["externalId"]),

  lenderRules: defineTable({
    externalId: v.string(),
    lenderExternalId: v.string(),
    name: v.string(),
    description: v.string(),
    trigger: ruleTrigger,
    operator: ruleOperator,
    threshold: v.number(),
    action: recoveryAction,
    priority: v.number(),
    isActive: v.boolean(),
    autoExecute: v.boolean(),
    cooldownDays: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_lender", ["lenderExternalId"])
    .index("by_externalId", ["externalId"]),

  strategies: defineTable({
    externalId: v.string(),
    loanExternalId: v.string(),
    lenderExternalId: v.string(),
    riskScoreAtCreation: v.optional(v.number()),
    content: v.optional(v.string()),
    summary: v.optional(v.string()),
    recommendedAction: v.optional(v.string()),
    recoveryAction: v.optional(recoveryAction),
    confidenceScore: v.optional(v.number()),
    priority: v.optional(v.number()),
    expectedRecoveryAmount: v.optional(v.number()),
    expectedRecoveryRate: v.optional(v.number()),
    status: strategyStatus,
    modelId: v.optional(v.string()),
    aiModelVersion: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    executedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_externalId", ["externalId"])
    .index("by_lender", ["lenderExternalId"])
    .index("by_loan", ["loanExternalId"]),

  aiInsights: defineTable({
    externalId: v.string(),
    loanExternalId: v.string(),
    lenderExternalId: v.string(),
    riskScore: v.number(),
    reasoning: v.optional(v.string()),
    modelId: v.string(),
    inputParams: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_loan", ["loanExternalId"])
    .index("by_externalId", ["externalId"]),

  auditLogs: defineTable({
    externalId: v.string(),
    lenderExternalId: v.string(),
    userExternalId: v.string(),
    userName: v.string(),
    userEmail: v.string(),
    action: auditAction,
    entityType: auditEntityType,
    entityExternalId: v.string(),
    entityLabel: v.string(),
    description: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_lender", ["lenderExternalId"])
    .index("by_externalId", ["externalId"]),

  notifications: defineTable({
    externalId: v.string(),
    userExternalId: v.string(),
    loanExternalId: v.optional(v.string()),
    type: v.string(),
    title: v.string(),
    body: v.string(),
    read: v.boolean(),
    emailSent: v.boolean(),
    createdAt: v.number(),
  }).index("by_user", ["userExternalId"]),
});
