import React, { useState } from 'react';
import { X, Save, Shield, Calendar, Globe, DollarSign, TrendingUp } from 'lucide-react';
import { EquityLinkedInvestment, ProductStructureType } from '../types';
import { getCurrencySymbol } from '../utils/formatters';

interface EditInvestmentModalProps {
  isOpen: boolean;
  investment: EquityLinkedInvestment;
  onClose: () => void;
  onSave: (updated: EquityLinkedInvestment) => void;
}

const COMMON_CURRENCIES = [
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'AUD', label: 'AUD (A$) - Australian Dollar' },
  { code: 'CAD', label: 'CAD (C$) - Canadian Dollar' },
  { code: 'CHF', label: 'CHF - Swiss Franc' },
  { code: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  { code: 'SGD', label: 'SGD (S$) - Singapore Dollar' },
  { code: 'HKD', label: 'HKD (HK$) - Hong Kong Dollar' },
  { code: 'NZD', label: 'NZD (NZ$) - New Zealand Dollar' },
];

export const EditInvestmentModal: React.FC<EditInvestmentModalProps> = ({
  isOpen,
  investment,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<EquityLinkedInvestment>({ ...investment });
  const [customCurrency, setCustomCurrency] = useState(
    COMMON_CURRENCIES.some((c) => c.code === investment.currency) ? '' : investment.currency
  );

  if (!isOpen) return null;

  const handleChange = (field: keyof EquityLinkedInvestment, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCurrencySelect = (code: string) => {
    if (code === 'CUSTOM') {
      handleChange('currency', customCurrency || 'USD');
    } else {
      handleChange('currency', code);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const currSym = getCurrencySymbol(formData.currency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-950 border border-emerald-800 p-1.5 text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Investment Terms &amp; Parameters</h3>
              <p className="text-xs text-slate-400">Configure your equity-linked fixed term investment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5 text-xs">
          {/* Section 1: Note Identification & Currency */}
          <div>
            <span className="font-bold text-slate-200 block mb-2 text-[11px] uppercase tracking-wider">
              1. Note Identification &amp; Currency
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-slate-400 block mb-1">Product / Investment Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Issuer / Bank</label>
                <input
                  type="text"
                  required
                  value={formData.issuer}
                  onChange={(e) => handleChange('issuer', e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Currency</label>
                <select
                  value={COMMON_CURRENCIES.some((c) => c.code === formData.currency) ? formData.currency : 'CUSTOM'}
                  onChange={(e) => handleCurrencySelect(e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                >
                  {COMMON_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                  <option value="CUSTOM">Other / Custom Currency</option>
                </select>
                {!COMMON_CURRENCIES.some((c) => c.code === formData.currency) && (
                  <input
                    type="text"
                    placeholder="e.g. SEK, NOK, CHF"
                    value={formData.currency}
                    onChange={(e) => handleChange('currency', e.target.value.toUpperCase())}
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white uppercase font-bold"
                  />
                )}
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Structure Type</label>
                <select
                  value={formData.structureType}
                  onChange={(e) => handleChange('structureType', e.target.value as ProductStructureType)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                >
                  <option value="autocall_barrier">Autocallable Yield Note (Barrier Protection)</option>
                  <option value="reverse_convertible">Barrier Reverse Convertible (High Fixed Coupon)</option>
                  <option value="capital_protected">Capital-Protected Participation Note (100% Principal Guarantee)</option>
                  <option value="digital_barrier">Digital Coupon Fixed Term</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Invested Notional ({currSym})</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={formData.notional}
                  onChange={(e) => handleChange('notional', parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Underlying Equity Reference */}
          <div>
            <span className="font-bold text-slate-200 block mb-2 text-[11px] uppercase tracking-wider">
              2. Underlying Equity Reference
            </span>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Ticker</label>
                <input
                  type="text"
                  required
                  value={formData.underlyingTicker}
                  onChange={(e) => handleChange('underlyingTicker', e.target.value.toUpperCase())}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white font-bold uppercase"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Underlying Name</label>
                <input
                  type="text"
                  required
                  value={formData.underlyingName}
                  onChange={(e) => handleChange('underlyingName', e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Initial Strike Price ({currSym})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.strikePrice}
                  onChange={(e) => handleChange('strikePrice', parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Current Spot Price ({currSym})</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.currentUnderlyingPrice}
                  onChange={(e) => handleChange('currentUnderlyingPrice', parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Coupon & Fixed Term */}
          <div>
            <span className="font-bold text-slate-200 block mb-2 text-[11px] uppercase tracking-wider">
              3. Coupon Yield &amp; Fixed Term
            </span>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Coupon Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.couponRatePercent}
                  onChange={(e) => handleChange('couponRatePercent', parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Payment Frequency</label>
                <select
                  value={formData.couponFrequency}
                  onChange={(e) => handleChange('couponFrequency', e.target.value as any)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                >
                  <option value="Quarterly">Quarterly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Semi-Annual">Semi-Annual</option>
                  <option value="Annual">Annual</option>
                  <option value="At Maturity">At Maturity</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Issue Date</label>
                <input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleChange('issueDate', e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Maturity Date</label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => handleChange('maturityDate', e.target.value)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Protection Barrier & Call Levels */}
          <div>
            <span className="font-bold text-slate-200 block mb-2 text-[11px] uppercase tracking-wider">
              4. Protection Barrier &amp; Redemption Levels
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Downside Barrier (% of Strike)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={formData.barrierLevelPercent}
                  onChange={(e) => handleChange('barrierLevelPercent', parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white font-mono"
                />
                <p className="mt-1 text-[10px] text-slate-500 font-mono">
                  Barrier price: {currSym}{(formData.strikePrice * (formData.barrierLevelPercent / 100)).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Autocall Level (% of Strike)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.autocallLevelPercent || 100}
                  onChange={(e) => handleChange('autocallLevelPercent', parseFloat(e.target.value) || 100)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white font-mono"
                />
                <p className="mt-1 text-[10px] text-slate-500 font-mono">
                  Call price: {currSym}{(formData.strikePrice * ((formData.autocallLevelPercent || 100) / 100)).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Discount Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.discountRatePercent}
                  onChange={(e) => handleChange('discountRatePercent', parseFloat(e.target.value) || 4.5)}
                  className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white font-mono"
                />
                <p className="mt-1 text-[10px] text-slate-500">
                  Valuation hurdle rate
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Website URL & Daily Valuation Tracking */}
          <div className="rounded-lg border border-sky-900/40 bg-sky-950/20 p-3.5">
            <span className="font-bold text-sky-300 block mb-1.5 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-sky-400" />
              5. Website URL for Daily Valuation Checks
            </span>
            <p className="text-[11px] text-slate-400 mb-2">
              Enter the financial portal or issuer webpage URL where the asset or underlying is priced.
            </p>
            <div>
              <label className="text-slate-300 block mb-1">Website URL</label>
              <input
                type="url"
                placeholder="e.g. https://finance.yahoo.com/quote/SPY or https://issuer.com/product/123"
                value={formData.websiteUrl || ''}
                onChange={(e) => handleChange('websiteUrl', e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono text-xs focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div className="mt-2.5 flex items-center gap-2">
              <input
                type="checkbox"
                id="autoCheckDaily"
                checked={formData.autoCheckDaily ?? true}
                onChange={(e) => handleChange('autoCheckDaily', e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-sky-500 h-3.5 w-3.5"
              />
              <label htmlFor="autoCheckDaily" className="text-slate-300 text-[11px] select-none cursor-pointer">
                Automatically perform a valuation check from this URL once every day on app launch
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-emerald-600 hover:bg-emerald-500 px-5 py-2 font-bold text-white shadow-xs transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
