import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Layers,
  Repeat,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  Info,
  RefreshCw,
  ExternalLink,
  Filter,
  CheckCircle,
  AlertOctagon,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function IntelligenceDashboard() {
  const [scope, setScope] = useState('real_only'); // Default is real_only
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIntelligence = async (selectedScope) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/intelligence?scope=${selectedScope}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
      setError(`Failed to load intelligence data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence(scope);
  }, [scope]);

  const summary = data?.summary || {};
  const categories = data?.category_intelligence || [];
  const phrases = data?.recurring_phrases || [];
  const repeats = data?.repeat_detection || [];
  const geo = data?.geographic_intelligence || {};

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Header & Data Ethics Warning */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-govblue-800 text-white rounded-xl shadow-xs">
                <BarChart3 className="w-5 h-5 text-sky-300" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                VerifyLens Intelligence
              </h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live SQLite Telemetry
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Cross-case analytics, product category clustering, recurring misleading phrasing, 
              and repeat-identifier detection computed strictly from SQLite records.
            </p>
          </div>

          {/* Scope Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Active View:
            </span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScope('real_only')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  scope === 'real_only'
                    ? 'bg-govblue-800 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ★ User Submissions ({summary.real_count ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setScope('synthetic_only')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  scope === 'synthetic_only'
                    ? 'bg-white text-govblue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Synthetic Demo ({summary.synthetic_count ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  scope === 'all'
                    ? 'bg-white text-govblue-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Records ({summary.total_in_db ?? 0})
              </button>
            </div>

            <button
              type="button"
              onClick={() => fetchIntelligence(scope)}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Data Ethics & Methodology Banner */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 flex-shrink-0 text-amber-700 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              Research Ethics & Analytical Limitations
            </p>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              {data?.disclaimer ||
                'A screening flag is not a confirmed violation, and repeated reports do not prove duplicate submissions or wrongdoing. Synthetic demonstration records are explicitly partitioned and cannot be used to infer real-world statistical significance.'}
            </p>
          </div>
        </div>
      </div>

      {/* Error View */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs">
          {error}
        </div>
      )}

      {/* 2. Key Intelligence Metric Cards (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Sample Analyzed
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {summary.sample_size ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">cases</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block font-mono-code">
            Scope: {scope}
          </span>
        </div>

        {/* Flagged Submissions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Flagged Submissions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-red-600">
              {summary.flagged_count ?? 0}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ({summary.flag_rate_percent ?? 0}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            {summary.high_discrepancy_count ?? 0} High • {summary.needs_review_count ?? 0} Review
          </span>
        </div>

        {/* Recurring Phrases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Recurring Patterns
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-govblue-900">
              {summary.recurring_phrases_count ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">patterns</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Tracked across dataset
          </span>
        </div>

        {/* Repeat Identifiers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Repeat Identifiers
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">
              {summary.repeat_groups_count ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">groups</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Exact & possible matches
          </span>
        </div>
      </div>

      {/* 3. Category Intelligence (Ranked List with Flag Rates) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-govblue-800" />
              Product Category Intelligence
            </h3>
            <p className="text-xs text-slate-500">
              Classification based on documented Indian Standards (e.g. IS 14543, IS 4151) and transparent keyword rules.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {categories.length} Categories Identified
          </span>
        </div>

        {categories.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            No categorized records found in this dataset filter.
          </p>
        ) : (
          <div className="space-y-4">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:border-govblue-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                      {cat.category}
                    </h4>
                    <span className="text-[11px] text-govblue-700 font-medium">
                      Rule Basis: {cat.standard_ref}
                    </span>
                  </div>

                  <div className="text-right self-start sm:self-auto">
                    <span className="text-xs font-bold text-slate-900">
                      {cat.denominator_str}
                    </span>
                    <span className="text-[11px] text-red-600 font-semibold block">
                      {cat.flag_rate_percent}% Flag Rate
                    </span>
                  </div>
                </div>

                {/* Horizontal Progress Bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-red-500 h-2.5 rounded-l-full transition-all duration-500"
                    style={{ width: `${cat.flag_rate_percent}%` }}
                    title={`${cat.flagged_reports} Flagged Reports`}
                  />
                  <div
                    className="bg-emerald-500 h-2.5 rounded-r-full transition-all duration-500"
                    style={{ width: `${100 - cat.flag_rate_percent}%` }}
                    title={`${cat.total_reports - cat.flagged_reports} Unflagged Reports`}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span>
                    Linked Case IDs: {cat.case_ids.slice(0, 4).join(', ')}
                    {cat.case_ids.length > 4 ? ` +${cat.case_ids.length - 4} more` : ''}
                  </span>
                  <span>Total: {cat.total_reports} cases</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Recurring Phrase Intelligence */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-govblue-800" />
              Recurring Phrase & Marketing Claim Intelligence
            </h3>
            <p className="text-xs text-slate-500">
              Frequencies of specific BIS compliance terms and deceptive phrasing counted across distinct cases.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {phrases.length} Tracked Phrases
          </span>
        </div>

        {phrases.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            No recurring phrase occurrences detected in this filter scope.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-2.5 px-3">Phrase / Pattern</th>
                  <th className="py-2.5 px-3">Nature</th>
                  <th className="py-2.5 px-3">Distinct Cases</th>
                  <th className="py-2.5 px-3">Flag Rate</th>
                  <th className="py-2.5 px-3">Supporting Evidence Snippets</th>
                  <th className="py-2.5 px-3">Regulatory Significance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {phrases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {p.phrase}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.nature === 'Misleading Marketing' || p.nature === 'Unauthorized Claim'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : p.nature === 'Syntactic Discrepancy'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-sky-100 text-govblue-800 border border-sky-200'
                        }`}
                      >
                        {p.nature}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {p.denominator_str}
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({p.percentage_of_dataset}% of sample)
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-red-600 whitespace-nowrap">
                      {p.flag_rate_percent}%
                      <span className="text-[10px] text-slate-400 block font-normal">
                        {p.flagged_cases_count} flagged
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600 max-w-xs">
                      {p.evidence_snippets && p.evidence_snippets.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {p.evidence_snippets.map((snip, i) => (
                            <li key={i} className="truncate" title={snip}>
                              {snip}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">Identified in corpus</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-500 max-w-xs leading-normal">
                      {p.regulatory_note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Repeat-Report Detection */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-amber-600" />
              Repeat-Report & Identifier Linkage Detection
            </h3>
            <p className="text-xs text-slate-500">
              Clusters cases that share identical licence numbers, CRS registrations, or matching product names.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {repeats.length} Clusters Found
          </span>
        </div>

        {repeats.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">
            No repeat identifiers or shared product reports detected in this filter scope.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repeats.map((group) => (
              <div
                key={group.group_id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-govblue-300 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-code font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                    {group.group_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      group.match_tier === 'Exact Match'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {group.match_tier}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 font-mono-code">
                    {group.key}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                    {group.evidence_label}
                  </p>
                </div>

                <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span>Distinct Linked Reports:</span>
                    <span className="text-govblue-800">{group.distinct_reports_count}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Case IDs: {group.case_ids.join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Products: {group.products.join(', ')}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[10px] text-amber-900 leading-normal">
                  <strong>Notice:</strong> {group.caution_note}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Geographic Intelligence (Transparent Empty State) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Geographic Distribution Intelligence
            </h3>
            <p className="text-xs text-slate-500">
              Regional incident density and manufacturing location mapping.
            </p>
          </div>
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            Data Integrity Guard Active
          </span>
        </div>

        {/* Honest Empty State */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-200/80 text-slate-500 mx-auto flex items-center justify-center">
            <MapPin className="w-6 h-6 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Insufficient Verified Geolocation Data
          </h4>
          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
            {geo.message ||
              'Current submissions contain packaging images and advertisement copy without verified physical distribution coordinates. Simulated coordinates are never generated.'}
          </p>
          <p className="text-[11px] text-govblue-700 font-semibold pt-1">
            {geo.guidance ||
              'Physical retailer addresses or regional manufacturing zones can only be added when corroborated by verified field inspection reports.'}
          </p>
        </div>
      </div>
    </div>
  );
}
