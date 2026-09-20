import React from 'react';
import { EquityLinkedInvestment, InvestmentMetrics } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RiskMetricsPanelProps {
  investment: EquityLinkedInvestment;
  metrics: InvestmentMetrics;
}

export const RiskMetricsPanel: React.FC<RiskMetricsPanelProps> = ({ investment, metrics }) => {
  const currency = investment.currency || 'USD';
  const notional = investment.notional;
  const couponDollars = metrics.totalTermIncomeDollar;
  const maxNetLoss = Math.max(0, notional - couponDollars);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
        <span className="text-xs text-slate-500 block">Downside Buffer Before Risk</span>
        <div className="text-lg font-semibold font-mono text-slate-900 dark:text-white mt-1">
          {((1 - investment.barrierLevelPercent / 100) * 100).toFixed(0)}% Drop Allowed
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Stock can drop to {formatCurrency(metrics.barrierPrice, currency, 2)} before principal reduction occurs.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
        <span className="text-xs text-slate-500 block">Break-Even Stock Price</span>
        <div className="text-lg font-semibold font-mono text-slate-900 dark:text-white mt-1">
          {formatCurrency(metrics.breakevenUnderlyingPrice, currency, 2)}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          After {formatCurrency(couponDollars, currency, 0)} guaranteed coupons, any price above this yields a net profit.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
        <span className="text-xs text-slate-500 block">Total Contractual Income</span>
        <div className="text-lg font-semibold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
          {formatCurrency(couponDollars, currency, 0)}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Cumulative coupon payments over the {investment.tenorYears}-year term (Max loss if stock goes to 0: {formatCurrency(maxNetLoss, currency, 0)}).
        </p>
      </div>
    </div>
  );
};
