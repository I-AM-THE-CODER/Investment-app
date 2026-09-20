import React from 'react';
import { EquityLinkedInvestment, PayoffScenario } from '../types';
import { formatCurrency } from '../utils/formatters';

interface PayoffMatrixTableProps {
  investment: EquityLinkedInvestment;
  scenarios: PayoffScenario[];
  currentSpotPrice: number;
}

export const PayoffMatrixTable: React.FC<PayoffMatrixTableProps> = ({
  investment,
  scenarios,
  currentSpotPrice,
}) => {
  const currency = investment.currency || 'USD';

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Maturity Payoff Table
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Contractual cash flows at maturity based on underlying performance
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono">
          Strike: {formatCurrency(investment.strikePrice, currency, 2)} • Barrier: {formatCurrency(investment.strikePrice * (investment.barrierLevelPercent / 100), currency, 2)} ({investment.barrierLevelPercent}%)
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <th className="py-2 px-3 font-medium">Underlying Move</th>
              <th className="py-2 px-3 font-medium">Final Stock Price</th>
              <th className="py-2 px-3 font-medium">Principal Status</th>
              <th className="py-2 px-3 font-medium text-right">Principal Repaid</th>
              <th className="py-2 px-3 font-medium text-right">Coupons Earned</th>
              <th className="py-2 px-3 font-medium text-right">Total Payout</th>
              <th className="py-2 px-3 font-medium text-right">Net Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono dark:divide-slate-800">
            {scenarios.map((sc, idx) => {
              const isCurrentRange =
                Math.abs(sc.underlyingPrice - currentSpotPrice) <= investment.strikePrice * 0.05;

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isCurrentRange
                      ? 'bg-amber-50/70 font-semibold dark:bg-amber-950/20'
                      : sc.barrierBreached
                      ? 'hover:bg-rose-50/40 dark:hover:bg-rose-950/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-2 px-3">
                    <span className="font-sans font-medium text-slate-700 dark:text-slate-300">
                      {sc.label}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                    {formatCurrency(sc.underlyingPrice, currency, 2)}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`inline-block text-[11px] font-medium font-sans ${
                        sc.barrierBreached
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {sc.barrierBreached ? 'Capital at Risk' : '100% Protected'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-800 dark:text-slate-200">
                    {formatCurrency(sc.principalReturnedDollar, currency, 0)}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">
                    +{formatCurrency(sc.totalCouponsEarnedDollar, currency, 0)}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-slate-900 dark:text-white">
                    {formatCurrency(sc.totalPayoutDollar, currency, 0)}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-semibold ${
                      sc.netReturnPercent >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {sc.netReturnPercent >= 0 ? '+' : ''}
                    {sc.netReturnPercent.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
