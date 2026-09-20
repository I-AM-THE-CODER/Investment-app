import React, { useState } from 'react';
import { X, Plus, Shield, Globe } from 'lucide-react';
import { EquityLinkedInvestment, ProductStructureType } from '../types';
import { getCurrencySymbol } from '../utils/formatters';

interface NewInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newInv: EquityLinkedInvestment) => void;
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

export const NewInvestmentModal: React.FC<NewInvestmentModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('My Equity-Linked Fixed Term Note');
  const [issuer, setIssuer] = useState('Investment Bank');
  const [structureType, setStructureType] = useState<ProductStructureType>('autocall_barrier');
  const [currency, setCurrency] = useState('USD');
  const [customCurrency, setCustomCurrency] = useState('');
  const [notional, setNotional] = useState<number>(25000);
  const [underlyingTicker, setUnderlyingTicker] = useState('NVDA');
  const [underlyingName, setUnderlyingName] = useState('NVIDIA Corporation');
  const [strikePrice, setStrikePrice] = useState<number>(115.00);
  const [currentPrice, setCurrentPrice] = useState<number>(118.50);
  const [couponRate, setCouponRate] = useState<number>(9.00);
  const [couponFrequency, setCouponFrequency] = useState<'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual' | 'At Maturity'>('Quarterly');
  const [tenorYears, setTenorYears] = useState<number>(2.0);
  const [barrierPercent, setBarrierPercent] = useState<number>(70);
  const [autocallPercent, setAutocallPercent] = useState<number>(100);
  const [websiteUrl, setWebsiteUrl] = useState('https://finance.yahoo.com/quote/NVDA');
  const [autoCheckDaily, setAutoCheckDaily] = useState(true);

  if (!isOpen) return null;

  const effectiveCurrency = currency === 'CUSTOM' ? (customCurrency || 'USD') : currency;
  const currSym = getCurrencySymbol(effectiveCurrency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const today = new Date();
    const issueDateStr = today.toISOString().split('T')[0];
    const matDate = new Date(today);
    matDate.setFullYear(today.getFullYear() + Math.round(tenorYears));
    const maturityDateStr = matDate.toISOString().split('T')[0];

    const newInvestment: EquityLinkedInvestment = {
      id: 'inv-' + Date.now(),
      name,
      issuer,
      structureType,
      currency: effectiveCurrency.toUpperCase(),
      notional,
      issueDate: issueDateStr,
      maturityDate: maturityDateStr,
      tenorYears,
      underlyingTicker: underlyingTicker.toUpperCase(),
      underlyingName,
      strikePrice,
      currentUnderlyingPrice: currentPrice,
      couponRatePercent: couponRate,
      couponFrequency,
      isCouponGuaranteed: true,
      barrierLevelPercent: barrierPercent,
      autocallLevelPercent: autocallPercent,
      discountRatePercent: 4.5,
      websiteUrl: websiteUrl.trim() || undefined,
      autoCheckDaily,
      notes: `Custom Equity-Linked Fixed Term Investment on ${underlyingTicker}.`,
    };

    onAdd(newInvestment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-emerald-950 border border-emerald-800 p-1.5 text-emerald-400">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Equity-Linked Fixed Term Investment</h3>
              <p className="text-xs text-slate-400">Enter the terms of your investment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Investment Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-white"
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
                <option value="CUSTOM">Custom Currency</option>
              </select>
              {currency === 'CUSTOM' && (
                <input
                  type="text"
                  placeholder="e.g. SEK, CHF"
                  value={customCurrency}
                  onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-white uppercase font-bold"
                />
              )}
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Issuer / Bank</label>
              <input
                type="text"
                required
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Notional Invested ({currSym})</label>
              <input
                type="number"
                step="100"
                required
                value={notional}
                onChange={(e) => setNotional(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Underlying Ticker</label>
              <input
                type="text"
                required
                value={underlyingTicker}
                onChange={(e) => setUnderlyingTicker(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-bold uppercase"
              />
            </div>
            <div className="col-span-2">
              <label className="text-slate-400 block mb-1">Underlying Asset Name</label>
              <input
                type="text"
                required
                value={underlyingName}
                onChange={(e) => setUnderlyingName(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Initial Strike Price ({currSym})</label>
              <input
                type="number"
                step="0.1"
                required
                value={strikePrice}
                onChange={(e) => setStrikePrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Current Spot Price ({currSym})</label>
              <input
                type="number"
                step="0.1"
                required
                value={currentPrice}
                onChange={(e) => setCurrentPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Coupon Rate (% p.a.)</label>
              <input
                type="number"
                step="0.1"
                required
                value={couponRate}
                onChange={(e) => setCouponRate(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Payment Frequency</label>
              <select
                value={couponFrequency}
                onChange={(e) => setCouponFrequency(e.target.value as any)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white"
              >
                <option value="Quarterly">Quarterly</option>
                <option value="Monthly">Monthly</option>
                <option value="Semi-Annual">Semi-Annual</option>
                <option value="Annual">Annual</option>
                <option value="At Maturity">At Maturity</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Fixed Term (Years)</label>
              <input
                type="number"
                step="0.5"
                required
                value={tenorYears}
                onChange={(e) => setTenorYears(parseFloat(e.target.value) || 1)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">Downside Barrier (% of Strike)</label>
              <input
                type="number"
                step="1"
                required
                value={barrierPercent}
                onChange={(e) => setBarrierPercent(parseFloat(e.target.value) || 70)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                Barrier price: {currSym}{(strikePrice * (barrierPercent / 100)).toFixed(2)}
              </span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Autocall Level (% of Strike)</label>
              <input
                type="number"
                step="1"
                value={autocallPercent}
                onChange={(e) => setAutocallPercent(parseFloat(e.target.value) || 100)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                Call price: {currSym}{(strikePrice * (autocallPercent / 100)).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Website URL Section */}
          <div className="rounded-lg border border-sky-900/40 bg-sky-950/20 p-3">
            <span className="font-bold text-sky-300 block mb-1 text-[11px] flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-sky-400" />
              Website URL for Daily Worth Checks
            </span>
            <input
              type="url"
              placeholder="https://finance.yahoo.com/quote/NVDA or issuer valuation portal"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-white font-mono text-xs focus:border-sky-500 focus:outline-hidden"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="newAutoDaily"
                checked={autoCheckDaily}
                onChange={(e) => setAutoCheckDaily(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-sky-500"
              />
              <label htmlFor="newAutoDaily" className="text-slate-300 text-[11px] select-none cursor-pointer">
                Check valuation automatically once every day
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-emerald-600 hover:bg-emerald-500 px-5 py-2 font-bold text-white shadow-xs"
            >
              Save Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
