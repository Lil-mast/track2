export interface Lender {
  id: string;
  name: string;
  slug: string;
  industry: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  settings: LenderSettings;
  createdAt: string;
  updatedAt: string;
}

export interface LenderSettings {
  timezone: string;
  currency: string;
  businessHoursStart: string;
  businessHoursEnd: string;
  aiRecommendationsEnabled: boolean;
  autoApproveLowRiskActions: boolean;
  maxContactAttemptsPerWeek: number;
}
