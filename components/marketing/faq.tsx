"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is RecoveryAI?",
    answer:
      "RecoveryAI is a B2B SaaS platform for financial institutions and lending companies to optimize their debt recovery processes. It uses generative AI to provide context-aware, empathetic, and effective recovery strategies instead of rigid, rule-based systems.",
  },
  {
    question: "How does the AI generate recommendations?",
    answer:
      "The recommendation engine, powered by AWS Bedrock, analyzes borrower behavior, repayment history, and loan terms to suggest the most effective next step — whether that is a restructured payment plan, an automated reminder, or a personal outreach call.",
  },
  {
    question: "What is risk scoring?",
    answer:
      "Instead of simple overdue flags, RecoveryAI dynamically assesses each account's probability of default based on live borrower data, so your team can prioritize the accounts that need attention most.",
  },
  {
    question: "Where is my data stored?",
    answer:
      "Loan and borrower data is stored in Amazon Aurora PostgreSQL, providing relational data integrity with enterprise-grade performance and scaling.",
  },
  {
    question: "How is authentication handled?",
    answer:
      "Authentication uses AWS Cognito — fully native AWS identity management with built-in email verification and secure user flows for your team.",
  },
  {
    question: "Does RecoveryAI contact borrowers automatically?",
    answer:
      "RecoveryAI recommends actions and can schedule automated reminders, but your team stays in control. Escalations and personal outreach calls are always executed by your staff.",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-border bg-card/40 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">FAQ</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Your questions, clearly answered
          </h2>
        </div>

        <div className="mt-12 flex flex-col gap-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={faq.question} className="rounded-xl border border-border bg-background">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium">{faq.question}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
