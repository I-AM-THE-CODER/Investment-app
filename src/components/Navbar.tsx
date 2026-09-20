import React from 'react';
import { Plus, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { EquityLinkedInvestment } from '../types';

interface NavbarProps {
  investments: EquityLinkedInvestment[];
  activeId: string;
  onSelectInvestment: (id: string) => void;
  onNewInvestment: () => void;
  onEditActive: () => void;
  onResetToDefault: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  investments,
  activeId,
  onSelectInvestment,
  onNewInvestment,
  onEditActive,
  onResetToDefault,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 h-14">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs">
            EQ
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Equity-Linked Note Tracker
            </span>
          </div>
        </div>

        {/* Investment Switcher & Clean Actions */}
        <div className="flex items-center gap-2">
          {investments.length > 1 && (
            <select
              value={activeId}
              onChange={(e) => onSelectInvestment(e.target.value)}
              aria-label="Select active investment note"
              className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-slate-400 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              {investments.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.underlyingTicker})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onEditActive}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Edit Terms</span>
          </button>

          <button
            onClick={onNewInvestment}
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 transition-colors dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Note</span>
          </button>

          <button
            onClick={onResetToDefault}
            title="Reset to default sample note"
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-200 ml-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
