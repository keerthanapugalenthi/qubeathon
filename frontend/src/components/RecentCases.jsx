import React from 'react';
import { History, RefreshCw, Eye, AlertOctagon, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export default function RecentCases({ cases, onSelectCase, onRefresh, loading }) {
  const getBadge = (risk_level) => {
    switch (risk_level) {
      case 'RED_FLAG_HIGH_DISCREPANCY':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
            <AlertOctagon className="w-3 h-3 text-red-600" />
            High Discrepancy
          </span>
        );
      case 'AMBER_FLAG_NEEDS_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Needs Review
          </span>
        );
      case 'PLAUSIBLE_FORMAT_UNVERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-govblue-800 border border-sky-200">
            <CheckCircle className="w-3 h-3 text-govblue-600" />
            Format Plausible
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-500" />
            No Claims
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Recent Screened Cases (SQLite Archive)
            </h3>
            <p className="text-[11px] text-slate-500">
              Persisted screening history stored in local database
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
          No cases recorded in SQLite yet. Run a screening check above!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-2.5 px-3">Case ID</th>
                <th className="py-2.5 px-3">Product / Subject</th>
                <th className="py-2.5 px-3">Screening Status</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {cases.map((c) => (
                <tr key={c.case_id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono-code font-bold text-govblue-900">
                    {c.case_id}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate">
                    {c.product_name || 'Unspecified'}
                  </td>
                  <td className="py-2.5 px-3">
                    {getBadge(c.risk_level)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 capitalize">
                    {c.source_type?.replace('_', ' ') || 'Text'}
                    {c.is_synthetic === 1 && (
                      <span className="ml-1 text-[10px] text-amber-600 bg-amber-50 px-1 rounded">
                        Demo
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-[11px]">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectCase(c.case_id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-govblue-700 hover:text-govblue-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
