import React from 'react';
import { EquityLinkedInvestment, InvestmentMetrics } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';

interface InvestmentHeaderProps {
  investment: EquityLinkedInvestment;
  metrics: InvestmentMetrics;
  onEditTerms: () => void;
  onNewInvestment: () => void;
}

export const InvestmentHeader: React.FC<InvestmentHeaderProps> = ({
  investment,
  metrics,
}) => {
  const currency = investment.currency || 'USD';
  const currSym = getCurrencySymbol(currency);

  const getStructureLabel = (type: string) => {
    switch (type) {
      case 'autocall_barrier':
        return 'Autocallable Yield Note';
      case 'reverse_convertible':
        return 'Barrier Reverse Convertible';
      case 'capital_protected':
        return 'Capital-Protected Participation Note';
      default:
        return 'Equity-Linked Note';
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Core Details Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {investment.name}
            </h1>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {getStructureLabel(investment.structureType)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Issuer: <span className="text-slate-700 font-medium dark:text-slate-300">{investment.issuer}</span>
            {' • '}
            Maturity: <span className="text-slate-700 font-medium dark:text-slate-300">{investment.maturityDate}</span>
            {' • '}
            <span className="font-mono text-slate-500">{metrics.daysRemaining} days left ({metrics.termProgressPercent}% completed)</span>
          </p>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 block">Invested Principal</span>
          <span className="text-lg font-semibold font-mono text-slate-900 dark:text-white">
            {formatCurrency(investment.notional, currency, 0)}
          </span>
        </div>
      </div>

      {/* 4 Clean Essential Metric Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Spot vs Strike */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-xs text-slate-500 block">Underlying Spot ({investment.underlyingTicker})</span>
          <div className="text-base font-semibold font-mono text-slate-900 dark:text-white mt-0.5">
            {formatCurrency(investment.currentUnderlyingPrice, currency, 2)}
          </div>
          <div className="text-xs mt-1 font-mono">
            <span className={metrics.currentPerformancePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {metrics.currentPerformancePercent >= 0 ? '+' : ''}{metrics.currentPerformancePercent.toFixed(2)}%
            </span>
            <span className="text-slate-400 text-[11px] ml-1">vs {formatCurrency(investment.strikePrice, currency, 2)} strike</span>
          </div>
        </div>

        {/* Metric 2: Barrier Cushion */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-xs text-slate-500 block">Protection Barrier</span>
          <div className="text-base font-semibold font-mono text-slate-900 dark:text-white mt-0.5">
            {formatCurrency(metrics.barrierPrice, currency, 2)}
          </div>
          <div className="text-xs mt-1 font-mono">
            <span className={metrics.isBarrierBreached ? 'text-rose-600 font-medium dark:text-rose-400' : 'text-emerald-600 font-medium dark:text-emerald-400'}>
              {metrics.isBarrierBreached ? 'Breached' : 'Protected'} ({metrics.distanceToBarrierPercent >= 0 ? '+' : ''}{metrics.distanceToBarrierPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Metric 3: Coupon Yield */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-xs text-slate-500 block">Guaranteed Coupon</span>
          <div className="text-base font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {investment.couponRatePercent.toFixed(2)}% p.a.
          </div>
          <div className="text-xs text-slate-400 mt-1 font-mono">
            {formatCurrency(metrics.annualIncomeDollar, currency, 0)}/yr ({investment.couponFrequency})
          </div>
        </div>

        {/* Metric 4: Est. Fair Value */}
        <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
          <span className="text-xs text-slate-500 block">Est. Market Value</span>
          <div className="text-base font-semibold font-mono text-slate-900 dark:text-white mt-0.5">
            {formatCurrency(metrics.estimatedFairValue, currency, 0)}
          </div>
          <div className="text-xs mt-1 font-mono">
            <span className={metrics.unrealizedGainDollar >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {metrics.unrealizedGainDollar >= 0 ? '+' : ''}{formatCurrency(metrics.unrealizedGainDollar, currency, 0)} ({metrics.unrealizedGainPercent >= 0 ? '+' : ''}{metrics.unrealizedGainPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
