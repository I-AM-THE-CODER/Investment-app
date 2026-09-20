import { EquityLinkedInvestment, InvestmentMetrics, PayoffScenario } from '../types';

/**
 * Calculates comprehensive deterministic metrics for an Equity-Linked Fixed Term Investment.
 */
export function calculateInvestmentMetrics(inv: EquityLinkedInvestment): InvestmentMetrics {
  const notional = inv.notional || 10000;
  const strike = inv.strikePrice || 100;
  const currentPrice = inv.currentUnderlyingPrice || strike;
  const tenor = inv.tenorYears || 2;
  const couponRate = inv.couponRatePercent || 0;
  const barrierPercent = inv.barrierLevelPercent || 70;
  const autocallPercent = inv.autocallLevelPercent || 100;

  // Underlying performance
  const currentPerformancePercent = Number((((currentPrice - strike) / strike) * 100).toFixed(2));

  // Downside barrier
  const barrierPrice = Number(((strike * barrierPercent) / 100).toFixed(2));
  const distanceToBarrierDollar = Number((currentPrice - barrierPrice).toFixed(2));
  const distanceToBarrierPercent = barrierPrice > 0
    ? Number((((currentPrice - barrierPrice) / barrierPrice) * 100).toFixed(2))
    : 0;
  const isBarrierBreached = currentPrice < barrierPrice;

  // Autocall level
  const autocallPrice = Number(((strike * autocallPercent) / 100).toFixed(2));
  const distanceToAutocallDollar = Number((autocallPrice - currentPrice).toFixed(2));
  const distanceToAutocallPercent = autocallPrice > 0
    ? Number((((currentPrice - autocallPrice) / autocallPrice) * 100).toFixed(2))
    : 0;
  const isAutocalled = autocallPrice > 0 && currentPrice >= autocallPrice;

  // Dates & Term progress
  let totalDays = Math.max(1, Math.round(tenor * 365.25));
  let daysRemaining = Math.round(totalDays * 0.55); // reasonable default
  try {
    if (inv.issueDate && inv.maturityDate) {
      const issueTime = new Date(inv.issueDate).getTime();
      const matTime = new Date(inv.maturityDate).getTime();
      const nowTime = Date.now();
      if (!isNaN(issueTime) && !isNaN(matTime) && matTime > issueTime) {
        totalDays = Math.max(1, Math.round((matTime - issueTime) / (1000 * 60 * 60 * 24)));
        daysRemaining = Math.max(0, Math.round((matTime - nowTime) / (1000 * 60 * 60 * 24)));
      }
    }
  } catch (e) {
    // fallback to tenor calculation
  }

  const daysElapsed = Math.max(0, totalDays - daysRemaining);
  const termProgressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));

  // Income metrics
  const annualIncomeDollar = Number(((notional * (couponRate / 100))).toFixed(2));
  const totalTermIncomeDollar = Number((annualIncomeDollar * tenor).toFixed(2));

  // Breakeven underlying price at maturity
  // If barrier is breached, Principal Return = Notional * (ST / Strike)
  // Total Payout = Notional * (ST / Strike) + TotalCoupons
  // Breakeven is when Total Payout = Notional:
  // Notional * (ST / Strike) = Notional - TotalCoupons
  // ST = Strike * (1 - TotalCoupons / Notional)
  const breakevenFactor = Math.max(0, 1 - (totalTermIncomeDollar / notional));
  const breakevenUnderlyingPrice = Number((strike * breakevenFactor).toFixed(2));

  // Max capital loss
  const maxCapitalLossDollar = notional;

  // Deterministic Fair Value Estimation
  // Secondary market fair value calculation:
  // Present value of earned/remaining coupons + probability-weighted terminal principal
  const r = (inv.discountRatePercent || 4.5) / 100;
  const yearsRemaining = Math.max(0.05, daysRemaining / 365.25);

  let expectedTerminalValue = notional;
  if (inv.structureType === 'capital_protected') {
    const part = (inv.participationRatePercent || 100) / 100;
    const cap = inv.capPercent ? inv.capPercent / 100 : 999;
    const upside = Math.min(cap, Math.max(0, (currentPrice - strike) / strike * part));
    expectedTerminalValue = notional * (1 + upside);
  } else {
    // Barrier or autocall note
    if (isBarrierBreached) {
      // Linear principal impairment
      expectedTerminalValue = notional * (currentPrice / strike);
    } else {
      // Above barrier: Full principal expectation
      expectedTerminalValue = notional;
    }
  }

  // Add remaining coupon stream
  const remainingCoupons = annualIncomeDollar * yearsRemaining;
  const discountedTerminal = expectedTerminalValue / Math.pow(1 + r, yearsRemaining);
  const discountedCoupons = remainingCoupons / (1 + r * (yearsRemaining / 2));
  const accruedCouponSoFar = annualIncomeDollar * (daysElapsed / 365.25);

  const estimatedFairValue = Number((discountedTerminal + discountedCoupons).toFixed(2));
  const unrealizedGainDollar = Number((estimatedFairValue - notional).toFixed(2));
  const unrealizedGainPercent = Number(((unrealizedGainDollar / notional) * 100).toFixed(2));

  return {
    currentPerformancePercent,
    barrierPrice,
    distanceToBarrierDollar,
    distanceToBarrierPercent,
    isBarrierBreached,
    autocallPrice,
    distanceToAutocallDollar,
    distanceToAutocallPercent,
    isAutocalled,
    daysRemaining,
    totalDays,
    termProgressPercent,
    estimatedFairValue,
    unrealizedGainDollar,
    unrealizedGainPercent,
    annualIncomeDollar,
    totalTermIncomeDollar,
    maxCapitalLossDollar,
    breakevenUnderlyingPrice,
  };
}

/**
 * Generates deterministic maturity payoff scenarios across a spectrum of underlying moves.
 */
export function calculatePayoffScenarios(inv: EquityLinkedInvestment): PayoffScenario[] {
  const notional = inv.notional || 10000;
  const strike = inv.strikePrice || 100;
  const tenor = inv.tenorYears || 2;
  const couponRate = inv.couponRatePercent || 0;
  const barrierPercent = inv.barrierLevelPercent || 70;
  const barrierPrice = Number(((strike * barrierPercent) / 100).toFixed(2));
  const totalCoupons = (notional * (couponRate / 100)) * tenor;

  // Key performance shifts to evaluate:
  // -40%, -30% (often the barrier), -20%, -10%, 0% (Flat), +10%, +20%, +30%
  // Plus exact barrier boundary if not in list
  const shifts = [-0.40, -0.30, -0.20, -0.10, 0.0, 0.10, 0.20, 0.30];
  const barrierShift = Number(((barrierPercent - 100) / 100).toFixed(2));
  if (!shifts.includes(barrierShift)) {
    shifts.push(barrierShift);
    shifts.sort((a, b) => a - b);
  }

  return shifts.map((shift) => {
    const perfPercent = Number((shift * 100).toFixed(1));
    const underlyingPrice = Number((strike * (1 + shift)).toFixed(2));
    const isBelowBarrier = underlyingPrice < barrierPrice;

    let principalReturnedPercent = 100;
    let principalReturnedDollar = notional;

    if (inv.structureType === 'capital_protected') {
      principalReturnedPercent = 100;
      const part = (inv.participationRatePercent || 100) / 100;
      const cap = inv.capPercent ? inv.capPercent / 100 : 999;
      const upside = Math.min(cap, Math.max(0, shift * part));
      principalReturnedDollar = notional * (1 + upside);
    } else {
      // Autocall or reverse convertible
      if (isBelowBarrier) {
        principalReturnedPercent = Number(((underlyingPrice / strike) * 100).toFixed(2));
        principalReturnedDollar = Number((notional * (underlyingPrice / strike)).toFixed(2));
      } else {
        principalReturnedPercent = 100;
        principalReturnedDollar = notional;
      }
    }

    const totalPayoutDollar = Number((principalReturnedDollar + totalCoupons).toFixed(2));
    const netReturnPercent = Number((((totalPayoutDollar - notional) / notional) * 100).toFixed(2));
    const annualizedReturnPercent = tenor > 0 ? Number((netReturnPercent / tenor).toFixed(2)) : netReturnPercent;

    let label = `${perfPercent >= 0 ? '+' : ''}${perfPercent}%`;
    if (Math.abs(shift - barrierShift) < 0.001) {
      label += ' (Barrier)';
    } else if (shift === 0) {
      label += ' (Unchanged)';
    }

    return {
      label,
      underlyingPrice,
      performancePercent: perfPercent,
      barrierBreached: isBelowBarrier,
      principalReturnedPercent,
      principalReturnedDollar,
      totalCouponsEarnedDollar: Number(totalCoupons.toFixed(2)),
      totalPayoutDollar,
      netReturnPercent,
      annualizedReturnPercent,
    };
  });
}
