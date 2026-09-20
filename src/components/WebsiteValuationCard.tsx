import React, { useState, useEffect } from 'react';
import { RefreshCw, ExternalLink, Check, Edit2 } from 'lucide-react';
import { EquityLinkedInvestment, CheckValuationResponse } from '../types';
import { formatCurrency } from '../utils/formatters';

interface WebsiteValuationCardProps {
  investment: EquityLinkedInvestment;
  onUpdateSpotPrice: (newPrice: number, statusMsg?: string) => void;
  onUpdateInvestmentDetails?: (details: Partial<EquityLinkedInvestment>) => void;
  onEditUrl: () => void;
}

const COOLDOWN_SECONDS = 30;

export const WebsiteValuationCard: React.FC<WebsiteValuationCardProps> = ({
  investment,
  onUpdateSpotPrice,
  onUpdateInvestmentDetails,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(investment.websiteUrl || '');

  useEffect(() => {
    setUrlInput(investment.websiteUrl || '');
  }, [investment.websiteUrl]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  const handleSaveUrl = () => {
    const trimmed = urlInput.trim();
    if (onUpdateInvestmentDetails) {
      onUpdateInvestmentDetails({ websiteUrl: trimmed || undefined });
    }
    setIsEditingUrl(false);
  };

  const handleRefresh = async () => {
    const targetUrl = investment.websiteUrl || urlInput.trim();
    if (!targetUrl) {
      setIsEditingUrl(true);
      return;
    }

    if (cooldownRemaining > 0) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch('/api/check-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          ticker: investment.underlyingTicker,
          strikePrice: investment.strikePrice,
          currency: investment.currency || 'USD',
        }),
      });

      const data: CheckValuationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.statusText}`);
      }

      setCooldownRemaining(COOLDOWN_SECONDS);

      const todayStr = new Date().toISOString().split('T')[0];
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (onUpdateInvestmentDetails) {
        onUpdateInvestmentDetails({
          lastCheckedAt: `${todayStr} ${nowStr}`,
          lastCheckedDate: todayStr,
          lastCheckedPrice: data.price,
          lastCheckedStatus: 'success',
          websiteUrl: targetUrl,
        });
      }

      if (typeof data.price === 'number' && data.price > 0) {
        onUpdateSpotPrice(data.price);
        setSuccessMsg(`Price updated to ${formatCurrency(data.price, investment.currency || 'USD')} (${data.notes})`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to check price from website');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-white">Daily Valuation Source</span>
            {investment.lastCheckedAt && (
              <span className="text-[11px] text-slate-400">
                • Checked: {investment.lastCheckedAt}
              </span>
            )}
          </div>

          {isEditingUrl ? (
            <div className="mt-2 flex items-center gap-2 max-w-lg">
              <input
                type="url"
                placeholder="https://finance.yahoo.com/quote/SPY or issuer portal"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-hidden"
              />
              <button
                onClick={handleSaveUrl}
                className="inline-flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950"
              >
                <Check className="h-3 w-3" />
                Save
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 text-xs">
              {investment.websiteUrl ? (
                <>
                  <a
                    href={investment.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate max-w-sm text-slate-600 hover:text-slate-900 underline flex items-center gap-1 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <span className="truncate">{investment.websiteUrl}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                  <button
                    onClick={() => setIsEditingUrl(true)}
                    className="text-slate-400 hover:text-slate-600 text-[11px] ml-1 dark:hover:text-slate-200"
                  >
                    Edit
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditingUrl(true)}
                  className="text-slate-500 hover:text-slate-800 text-xs underline"
                >
                  + Add valuation website URL
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isLoading || cooldownRemaining > 0}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              cooldownRemaining > 0
                ? 'border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading
              ? 'Checking...'
              : cooldownRemaining > 0
              ? `Wait ${cooldownRemaining}s`
              : 'Refresh Price'}
          </button>
        </div>
      </div>

      {successMsg && (
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          ✓ {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">
          ✕ {errorMsg}
        </p>
      )}
    </div>
  );
};
