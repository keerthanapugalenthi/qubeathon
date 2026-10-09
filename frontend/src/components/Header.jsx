import React from 'react';
import { ShieldCheck, AlertCircle, FileSearch, Sparkles } from 'lucide-react';

export default function Header({ backendOnline, activeNav, setActiveNav }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
      {/* Top Regulatory Alert Bar */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-medium flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-slate-900" />
          <span>
            <strong>SCREENING NOTICE:</strong> Automated screening indicators highlight discrepancies for review. 
            They are <strong>not proof of a violation</strong>. Always verify against official BIS registries.
          </span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-govblue-800 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                BIS VerifyLens
              </h1>
              <span className="bg-sky-100 text-govblue-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-sky-200">
                Qubeathon PS01
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Automated Standard Mark Screening & Compliance Analysis Assistant
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveNav('screening')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeNav === 'screening'
                ? 'bg-white text-govblue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🔍</span> Screening & Investigation
          </button>
          <button
            type="button"
            onClick={() => setActiveNav('intelligence')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeNav === 'intelligence'
                ? 'bg-govblue-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📊</span> VerifyLens Intelligence
          </button>
        </div>

        {/* Status Indicator */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-slate-600 font-medium">
              {backendOnline ? 'Flask + SQLite Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
