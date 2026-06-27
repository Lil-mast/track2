import type { Lender } from "@/types/lender";
import { DEFAULT_LENDER_ID } from "@/lib/constants";

export const mockLenders: Lender[] = [
  {
    id: DEFAULT_LENDER_ID,
    name: "Meridian Capital Partners",
    slug: "meridian-capital",
    industry: "Commercial Lending",
    contactEmail: "operations@meridiancapital.com",
    contactPhone: "+1 (212) 555-0142",
    address: {
      street: "350 Park Avenue, 18th Floor",
      city: "New York",
      state: "NY",
      zip: "10022",
      country: "US",
    },
    settings: {
      timezone: "America/New_York",
      currency: "USD",
      businessHoursStart: "09:00",
      businessHoursEnd: "17:00",
      aiRecommendationsEnabled: true,
      autoApproveLowRiskActions: false,
      maxContactAttemptsPerWeek: 3,
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2025-05-01T14:30:00Z",
  },
  {
    id: "lender_002",
    name: "Pacific Horizon Finance",
    slug: "pacific-horizon",
    industry: "Asset-Based Lending",
    contactEmail: "support@pacifichorizon.com",
    contactPhone: "+1 (415) 555-0198",
    address: {
      street: "555 California Street, Suite 3200",
      city: "San Francisco",
      state: "CA",
      zip: "94104",
      country: "US",
    },
    settings: {
      timezone: "America/Los_Angeles",
      currency: "USD",
      businessHoursStart: "08:00",
      businessHoursEnd: "18:00",
      aiRecommendationsEnabled: true,
      autoApproveLowRiskActions: true,
      maxContactAttemptsPerWeek: 5,
    },
    createdAt: "2024-03-20T08:00:00Z",
    updatedAt: "2025-04-18T11:00:00Z",
  },
];
