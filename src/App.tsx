import React, { useState, useEffect, useRef } from 'react';
import { defaultInvestment } from './data/initialData';
import { EquityLinkedInvestment, CheckValuationResponse } from './types';
import { calculateInvestmentMetrics, calculatePayoffScenarios } from './utils/calculations';
import { Navbar } from './components/Navbar';
import { InvestmentHeader } from './components/InvestmentHeader';
import { UnderlyingSpotController } from './components/UnderlyingSpotController';
import { WebsiteValuationCard } from './components/WebsiteValuationCard';
import { PayoffMatrixTable } from './components/PayoffMatrixTable';
import { RiskMetricsPanel } from './components/RiskMetricsPanel';
import { AIAnalysisCard } from './components/AIAnalysisCard';
import { EditInvestmentModal } from './components/EditInvestmentModal';
import { NewInvestmentModal } from './components/NewInvestmentModal';

const STORAGE_KEY = 'equity_linked_investments_v1';

export default function App() {
  const [investments, setInvestments] = useState<EquityLinkedInvestment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved investments', e);
    }
    return [defaultInvestment];
  });

  const [activeId, setActiveId] = useState<string>(() => investments[0]?.id || defaultInvestment.id);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Ref to prevent duplicate auto-check runs in React StrictMode
  const hasTriggeredDailyCheck = useRef<Record<string, boolean>>({});

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [investments]);

  // Current active investment
  const activeInvestment = investments.find((i) => i.id === activeId) || investments[0] || defaultInvestment;

  // Real-time deterministic calculations
  const metrics = calculateInvestmentMetrics(activeInvestment);
  const scenarios = calculatePayoffScenarios(activeInvestment);

  // Automated Daily Check Logic
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const invId = activeInvestment.id;

    const shouldCheckDaily =
      activeInvestment.autoCheckDaily !== false &&
      !!activeInvestment.websiteUrl &&
      activeInvestment.lastCheckedDate !== todayStr &&
      !hasTriggeredDailyCheck.current[invId];

    if (!shouldCheckDaily) return;

    hasTriggeredDailyCheck.current[invId] = true;

    const performDailyCheck = async () => {
      try {
        const response = await fetch('/api/check-valuation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: activeInvestment.websiteUrl,
            ticker: activeInvestment.underlyingTicker,
            strikePrice: activeInvestment.strikePrice,
            currency: activeInvestment.currency || 'USD',
          }),
        });

        if (!response.ok) return;

        const data: CheckValuationResponse = await response.json();
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setInvestments((prev) =>
          prev.map((inv) => {
            if (inv.id !== invId) return inv;
            const updatedPrice =
              typeof data.price === 'number' && data.price > 0 ? data.price : inv.currentUnderlyingPrice;

            return {
              ...inv,
              currentUnderlyingPrice: updatedPrice,
              lastCheckedAt: `${todayStr} ${nowStr} (Auto)`,
              lastCheckedDate: todayStr,
              lastCheckedPrice: data.price,
              lastCheckedStatus: 'success',
            };
          })
        );
      } catch (err) {
        console.warn('Daily check could not reach endpoint:', err);
      }
    };

    performDailyCheck();
  }, [activeInvestment.id, activeInvestment.lastCheckedDate, activeInvestment.websiteUrl, activeInvestment.autoCheckDaily]);

  // Handlers
  const handleUpdateSpotPrice = (newPrice: number) => {
    setInvestments((prev) =>
      prev.map((inv) =>
        inv.id === activeInvestment.id ? { ...inv, currentUnderlyingPrice: newPrice } : inv
      )
    );
  };

  const handleUpdateInvestmentDetails = (details: Partial<EquityLinkedInvestment>) => {
    setInvestments((prev) =>
      prev.map((inv) => (inv.id === activeInvestment.id ? { ...inv, ...details } : inv))
    );
  };

  const handleResetToStrike = () => {
    setInvestments((prev) =>
      prev.map((inv) =>
        inv.id === activeInvestment.id ? { ...inv, currentUnderlyingPrice: inv.strikePrice } : inv
      )
    );
  };

  const handleSaveInvestment = (updated: EquityLinkedInvestment) => {
    setInvestments((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
  };

  const handleAddNewInvestment = (newInv: EquityLinkedInvestment) => {
    setInvestments((prev) => [newInv, ...prev]);
    setActiveId(newInv.id);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset to clean default Equity-Linked Note?')) {
      setInvestments([defaultInvestment]);
      setActiveId(defaultInvestment.id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans antialiased">
      {/* Streamlined Clean Navbar */}
      <Navbar
        investments={investments}
        activeId={activeId}
        onSelectInvestment={setActiveId}
        onNewInvestment={() => setIsNewModalOpen(true)}
        onEditActive={() => setIsEditModalOpen(true)}
        onResetToDefault={handleResetToDefault}
      />

      {/* Main Focused Workspace with Generous Padding and Low Noise */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 space-y-5">
        {/* 1. Header & Core Key Metrics */}
        <InvestmentHeader
          investment={activeInvestment}
          metrics={metrics}
          onEditTerms={() => setIsEditModalOpen(true)}
          onNewInvestment={() => setIsNewModalOpen(true)}
        />

        {/* 2. Interactive Spot Price Simulator & Barrier Scale */}
        <UnderlyingSpotController
          investment={activeInvestment}
          metrics={metrics}
          onUpdateSpotPrice={handleUpdateSpotPrice}
          onResetToStrike={handleResetToStrike}
        />

        {/* 3. Daily Website Valuation Source (Clean row) */}
        <WebsiteValuationCard
          investment={activeInvestment}
          onUpdateSpotPrice={handleUpdateSpotPrice}
          onUpdateInvestmentDetails={handleUpdateInvestmentDetails}
          onEditUrl={() => setIsEditModalOpen(true)}
        />

        {/* 4. Payoff Scenarios Matrix Table */}
        <PayoffMatrixTable
          investment={activeInvestment}
          scenarios={scenarios}
          currentSpotPrice={activeInvestment.currentUnderlyingPrice}
        />

        {/* 5. Downside Buffer & Break-Even Metrics */}
        <RiskMetricsPanel
          investment={activeInvestment}
          metrics={metrics}
        />

        {/* 6. Collapsible Assistant / Q&A */}
        <AIAnalysisCard
          investment={activeInvestment}
          metrics={metrics}
        />
      </main>

      {/* Minimal Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2">
          <span>
            Equity-Linked Investment Tracker • Currency: <strong className="text-slate-700 dark:text-slate-300">{activeInvestment.currency || 'USD'}</strong>
          </span>
          <span>Deterministic Cash Flow Engine</span>
        </div>
      </footer>

      {/* Edit Terms Modal */}
      <EditInvestmentModal
        isOpen={isEditModalOpen}
        investment={activeInvestment}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveInvestment}
      />

      {/* New Investment Modal */}
      <NewInvestmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onAdd={handleAddNewInvestment}
      />
    </div>
  );
}
