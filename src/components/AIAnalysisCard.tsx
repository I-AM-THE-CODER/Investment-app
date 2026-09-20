import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Send } from 'lucide-react';
import { EquityLinkedInvestment, InvestmentMetrics } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AIAnalysisCardProps {
  investment: EquityLinkedInvestment;
  metrics: InvestmentMetrics;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({ investment, metrics }) => {
  const currency = investment.currency || 'USD';
  const [isOpen, setIsOpen] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [qnaAnswer, setQnaAnswer] = useState<string | null>(null);

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuestion.trim()) return;

    const q = userQuestion.toLowerCase();
    let answer = '';

    if (q.includes('drop') || q.includes('fall') || q.includes('downside') || q.includes('breach')) {
      answer = `Under current terms, ${investment.underlyingTicker} can decline by up to ${((1 - investment.barrierLevelPercent / 100) * 100).toFixed(1)}% from strike (down to ${formatCurrency(metrics.barrierPrice, currency, 2)}) with 100% principal protection. If it closes below ${formatCurrency(metrics.barrierPrice, currency, 2)} at maturity, principal is repaid based on the final price relative to strike.`;
    } else if (q.includes('coupon') || q.includes('income') || q.includes('interest')) {
      answer = `You are scheduled to receive ${investment.couponRatePercent}% p.a. (${formatCurrency(metrics.annualIncomeDollar, currency, 0)} per year), paid ${investment.couponFrequency.toLowerCase()}. Over the full ${investment.tenorYears}-year term, cumulative coupons equal ${formatCurrency(metrics.totalTermIncomeDollar, currency, 0)}.`;
    } else if (q.includes('worst') || q.includes('risk') || q.includes('loss')) {
      answer = `The worst-case scenario occurs if the stock falls to 0 at maturity. You retain all coupons received (${formatCurrency(metrics.totalTermIncomeDollar, currency, 0)}), with a maximum net loss of ${formatCurrency(investment.notional - metrics.totalTermIncomeDollar, currency, 0)}.`;
    } else if (q.includes('breakeven') || q.includes('break-even')) {
      answer = `Accounting for the ${formatCurrency(metrics.totalTermIncomeDollar, currency, 0)} total coupon payments, your break-even stock price at maturity is ${formatCurrency(metrics.breakevenUnderlyingPrice, currency, 2)}.`;
    } else {
      answer = `For ${investment.name}: Invested principal is ${formatCurrency(investment.notional, currency, 0)}. Current spot is ${formatCurrency(investment.currentUnderlyingPrice, currency, 2)} (${metrics.distanceToBarrierPercent >= 0 ? '+' : ''}${metrics.distanceToBarrierPercent.toFixed(1)}% above barrier of ${formatCurrency(metrics.barrierPrice, currency, 2)}).`;
    }

    setQnaAnswer(answer);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors dark:hover:bg-slate-800/40"
      >
        <div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Contract Terms Assistant</span>
          <span className="text-xs text-slate-500 block sm:inline sm:ml-2">
            Ask questions about payoffs, barriers, or cash flow mechanics
          </span>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. What happens if the stock falls 25%? Or what is my break-even?"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950"
            >
              <Send className="h-3 w-3" />
              Ask
            </button>
          </form>

          {qnaAnswer && (
            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-200 leading-relaxed">
              {qnaAnswer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
