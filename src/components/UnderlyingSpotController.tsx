import React from 'react';
import { RefreshCw } from 'lucide-react';
import { EquityLinkedInvestment, InvestmentMetrics } from '../types';
import { formatCurrency, getCurrencySymbol } from '../utils/formatters';

interface UnderlyingSpotControllerProps {
  investment: EquityLinkedInvestment;
  metrics: InvestmentMetrics;
  onUpdateSpotPrice: (newPrice: number) => void;
  onResetToStrike: () => void;
}

export const UnderlyingSpotController: React.FC<UnderlyingSpotControllerProps> = ({
  investment,
  metrics,
  onUpdateSpotPrice,
  onResetToStrike,
}) => {
  const currency = investment.currency || 'USD';
  const currSym = getCurrencySymbol(currency);
  const strike = investment.strikePrice || 100;
  const currentPrice = investment.currentUnderlyingPrice || strike;
  const barrierPrice = metrics.barrierPrice;

  // Percentage position on a 0% to 140% visual scale
  const maxScalePrice = strike * 1.4;
  const getPercentPos = (val: number) => {
    return Math.min(100, Math.max(0, (val / maxScalePrice) * 100));
  };

  const spotPercentPos = getPercentPos(currentPrice);
  const barrierPercentPos = getPercentPos(barrierPrice);
  const strikePercentPos = getPercentPos(strike);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Spot Price &amp; Barrier Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Adjust the spot price of {investment.underlyingTicker} to test barrier safety and maturity outcome
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 text-[11px] mr-1">Quick Scenarios:</span>
          <button
            onClick={() => onUpdateSpotPrice(Number((barrierPrice * 0.95).toFixed(2)))}
            className="rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Breach (-5%)
          </button>
          <button
            onClick={() => onUpdateSpotPrice(barrierPrice)}
            className="rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            At Barrier
          </button>
          <button
            onClick={onResetToStrike}
            className="rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Strike (Par)
          </button>
          <button
            onClick={() => onUpdateSpotPrice(Number((strike * 1.10).toFixed(2)))}
            className="rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2 py-0.5 text-slate-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            +10% Upside
          </button>
        </div>
      </div>

      {/* Spot Price Input + Slider + Scale */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Spot Price Input */}
        <div className="md:col-span-1">
          <label className="text-xs text-slate-500 font-medium block mb-1">
            Spot Price ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-mono">
              {currSym}
            </span>
            <input
              type="number"
              step="0.01"
              value={currentPrice}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) onUpdateSpotPrice(val);
              }}
              className="w-full rounded-md border border-slate-200 bg-slate-50 pl-7 pr-2.5 py-1.5 text-xs font-mono font-semibold text-slate-900 focus:border-slate-400 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Visual Range Slider and Barrier Map */}
        <div className="md:col-span-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>0.00</span>
            <span className="text-rose-500 font-medium">Barrier: {formatCurrency(barrierPrice, currency, 0)} ({investment.barrierLevelPercent}%)</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">Strike: {formatCurrency(strike, currency, 0)} (100%)</span>
            <span>{formatCurrency(maxScalePrice, currency, 0)}</span>
          </div>

          <div className="relative pt-1">
            {/* Range Input */}
            <input
              type="range"
              min={0}
              max={maxScalePrice}
              step={strike * 0.005}
              value={currentPrice}
              onChange={(e) => onUpdateSpotPrice(parseFloat(e.target.value))}
              aria-label="Adjust underlying spot price"
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-slate-900 dark:accent-slate-100"
            />

            {/* Visual Markers for Barrier & Strike */}
            <div
              className="absolute top-1 bottom-0 w-0.5 bg-rose-500 pointer-events-none h-2"
              style={{ left: `${barrierPercentPos}%` }}
              title={`Barrier Level: ${formatCurrency(barrierPrice, currency, 2)}`}
            />
            <div
              className="absolute top-1 bottom-0 w-0.5 bg-slate-400 pointer-events-none h-2"
              style={{ left: `${strikePercentPos}%` }}
              title={`Strike: ${formatCurrency(strike, currency, 2)}`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Distance to Barrier:{' '}
              <strong className={metrics.isBarrierBreached ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                {metrics.distanceToBarrierPercent >= 0 ? '+' : ''}{metrics.distanceToBarrierPercent.toFixed(1)}%
              </strong>
            </span>
            <span>
              {metrics.isBarrierBreached
                ? 'Barrier breached: Capital repayment is linked 1:1 to final spot'
                : 'Barrier intact: 100% of invested principal will be protected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
