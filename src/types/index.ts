export type ProductStructureType = 
  | 'autocall_barrier' // Autocallable Yield Note with Downside Barrier
  | 'reverse_convertible' // Barrier Reverse Convertible
  | 'capital_protected' // Principal Protected Growth Note (Participation)
  | 'digital_barrier'; // Digital Coupon Fixed Term

export interface EquityLinkedInvestment {
  id: string;
  name: string; // e.g. "2-Year Equity-Linked Fixed Term Note"
  issuer: string; // e.g. "Barclays" or "Goldman Sachs"
  structureType: ProductStructureType;
  currency: string; // e.g. "USD"
  
  // Principal & Dates
  notional: number; // Principal invested, e.g. 50000
  issueDate: string; // e.g. "2025-10-15"
  maturityDate: string; // e.g. "2027-10-15"
  tenorYears: number; // e.g. 2.0
  
  // Underlying Equity
  underlyingTicker: string; // e.g. "SPY"
  underlyingName: string; // e.g. "S&P 500 Index ETF"
  strikePrice: number; // Initial reference / strike price, e.g. 500.00
  currentUnderlyingPrice: number; // Current spot price, e.g. 524.50
  
  // Coupon / Return Structure
  couponRatePercent: number; // Annual coupon rate %, e.g. 8.5
  couponFrequency: 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | 'At Maturity';
  isCouponGuaranteed: boolean; // Guaranteed vs contingent on coupon barrier
  couponBarrierPercent?: number; // Barrier level below which coupon is unpaid (e.g. 65%)
  
  // Downside Protection & Autocall Barriers
  barrierLevelPercent: number; // Capital protection barrier %, e.g. 70.0 (below which principal erodes)
  autocallLevelPercent?: number; // Early redemption barrier %, e.g. 100.0
  participationRatePercent?: number; // Upside participation %, e.g. 100.0
  capPercent?: number; // Maximum upside cap %, e.g. 20.0
  
  // Discounting & Valuation
  discountRatePercent: number; // Secondary discount hurdle rate %, e.g. 4.5%
  
  // Historical Underlying Price Checkpoints
  underlyingHistory?: { date: string; price: number }[];

  // Website Valuation URL & Tracking
  websiteUrl?: string; // e.g. "https://finance.yahoo.com/quote/SPY" or issuer valuation portal
  lastCheckedAt?: string; // Timestamp of last valuation check
  lastCheckedDate?: string; // YYYY-MM-DD to verify daily check
  lastCheckedPrice?: number | null; // Latest price scraped from website
  lastCheckedStatus?: string; // e.g. "Verified live via Gemini" or "Extracted from portal"
  autoCheckDaily?: boolean; // Automatically checks once per day on load

  notes?: string;
}

export interface CheckValuationResponse {
  success: boolean;
  price: number | null;
  currency: string;
  asOfDate: string;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
  sourceUrl: string;
  checkedAt: string;
  error?: string;
}

export interface PayoffScenario {
  label: string;
  underlyingPrice: number;
  performancePercent: number; // e.g. -30%, -20%, 0%, +20%
  barrierBreached: boolean;
  principalReturnedPercent: number;
  principalReturnedDollar: number;
  totalCouponsEarnedDollar: number;
  totalPayoutDollar: number;
  netReturnPercent: number;
  annualizedReturnPercent: number;
}

export interface InvestmentMetrics {
  currentPerformancePercent: number;
  barrierPrice: number;
  distanceToBarrierDollar: number;
  distanceToBarrierPercent: number;
  isBarrierBreached: boolean;
  autocallPrice: number;
  distanceToAutocallDollar: number;
  distanceToAutocallPercent: number;
  isAutocalled: boolean;
  daysRemaining: number;
  totalDays: number;
  termProgressPercent: number;
  estimatedFairValue: number;
  unrealizedGainDollar: number;
  unrealizedGainPercent: number;
  annualIncomeDollar: number;
  totalTermIncomeDollar: number;
  maxCapitalLossDollar: number;
  breakevenUnderlyingPrice: number;
}

export interface AIAnalysisResult {
  summary: string;
  riskRating: 'Low' | 'Moderate' | 'High' | 'Severe';
  bufferSafetyAssessment: string;
  payoffProfileDescription: string;
  strengths: string[];
  keyRisks: string[];
  breakEvenAssessment: string;
  generatedAt: string;
}
