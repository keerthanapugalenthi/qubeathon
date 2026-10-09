import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  AlertOctagon,
  FileText,
  ExternalLink,
  ChevronRight,
  Printer,
  Copy,
  Info
} from 'lucide-react';

export default function ScreeningResult({ result, onOpenReport }) {
  if (!result) return null;

  const {
    case_id,
    created_at,
    product_name,
    risk_level,
    risk_label,
    summary,
    detected_claims,
    reasons,
    evidence,
    recommended_steps,
    is_synthetic,
    disclaimer,
    official_resources
  } = result;

  const getStatusBadgeConfig = () => {
    switch (risk_level) {
      case 'RED_FLAG_HIGH_DISCREPANCY':
        return {
          bg: 'bg-red-50 border-red-200 text-red-900',
          badge: 'bg-red-600 text-white',
          icon: AlertOctagon,
          titleColor: 'text-red-950',
          indicatorDesc: 'Discrepancy Indicator: High likelihood of non-compliance or deceptive terminology.'
        };
      case 'AMBER_FLAG_NEEDS_REVIEW':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-600 text-white',
          icon: AlertTriangle,
          titleColor: 'text-amber-950',
          indicatorDesc: 'Review Indicator: Incomplete information or missing accompanying licence details.'
        };
      case 'PLAUSIBLE_FORMAT_UNVERIFIED':
        return {
          bg: 'bg-sky-50 border-sky-200 text-govblue-900',
          badge: 'bg-govblue-700 text-white',
          icon: CheckCircle,
          titleColor: 'text-govblue-950',
          indicatorDesc: 'Format Indicator: Structure matches standards. Official verification is still mandatory.'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          badge: 'bg-slate-600 text-white',
          icon: HelpCircle,
          titleColor: 'text-slate-900',
          indicatorDesc: 'Neutral: No recognizable BIS standard marks or claims were detected.'
        };
    }
  };

  const statusConfig = getStatusBadgeConfig();
  const StatusIcon = statusConfig.icon;

  const copySummaryToClipboard = () => {
    const textToCopy = `[BIS VerifyLens Screening Report]\nCase ID: ${case_id}\nProduct: ${product_name || 'N/A'}\nIndicator: ${risk_label}\nSummary: ${summary}\n\nEvidence:\n${evidence.map(e => '- ' + e).join('\n')}\n\nNotice: Preliminary screening indicator only; not legal proof of a violation.`;
    navigator.clipboard.writeText(textToCopy);
    alert('Case findings copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 mb-8 transition-all">
      {/* Top Header Card */}
      <div className={`p-5 rounded-2xl border ${statusConfig.bg} mb-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${statusConfig.badge}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono-code font-bold tracking-wider uppercase opacity-75">
                Screening Assessment
              </span>
              <h3 className={`text-base sm:text-lg font-extrabold ${statusConfig.titleColor}`}>
                {risk_label}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {is_synthetic && (
              <span className="text-[11px] font-semibold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                Synthetic Sample
              </span>
            )}
            <span className="text-xs font-mono-code bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-slate-700">
              {case_id}
            </span>
          </div>
        </div>

        <p className="text-xs sm:text-sm font-medium leading-relaxed mb-3">
          {summary}
        </p>

        <div className="bg-white/70 rounded-xl p-3 border border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-2">
          <Info className="w-4 h-4 flex-shrink-0 text-slate-500 mt-0.5" />
          <span>
            <strong>Legal Safety Notice:</strong> {disclaimer}
          </span>
        </div>
      </div>

      {/* Grid: Detected Claims & Explainable Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Detected Claims */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-govblue-700" />
            Detected Standard Claims & Marks
          </h4>

          {detected_claims && detected_claims.length > 0 ? (
            <div className="space-y-2">
              {detected_claims.map((claim, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-govblue-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {claim.type}
                    </span>
                    <span className="text-xs font-mono-code font-bold text-slate-800">
                      {claim.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    {claim.detail}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-white rounded-xl border border-dashed border-slate-200">
              No specific Standard numbers or 7-digit CM/L licences identified.
            </p>
          )}
        </div>

        {/* Reasons & Evidence */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4.5">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Explainable Screening Findings
          </h4>

          <div className="space-y-2">
            {reasons && reasons.length > 0 ? (
              reasons.map((reason, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed shadow-2xs"
                >
                  {reason}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-white rounded-xl border border-dashed border-slate-200">
                No adverse rule triggers flagged.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Next Steps */}
      <div className="bg-sky-50/50 border border-sky-200/70 rounded-2xl p-5 mb-6">
        <h4 className="text-xs font-bold text-govblue-950 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <ChevronRight className="w-4 h-4 text-govblue-700" />
          Recommended Actions & Official Verification Guide
        </h4>

        <ul className="space-y-2 mb-4">
          {recommended_steps &&
            recommended_steps.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-slate-800 leading-relaxed"
              >
                <span className="w-4 h-4 rounded-full bg-govblue-700 text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
        </ul>

        {/* Official Resource Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-sky-200/60">
          {official_resources &&
            official_resources.map((res, idx) => (
              <a
                key={idx}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white border border-sky-200/80 hover:border-govblue-600 hover:shadow-xs transition group block"
              >
                <div className="flex items-center justify-between text-xs font-bold text-govblue-900 group-hover:text-govblue-700 mb-0.5">
                  <span>{res.name}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-govblue-700" />
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                  {res.description}
                </p>
              </a>
            ))}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <span className="text-[11px] text-slate-400">
          Screened at {new Date(created_at).toLocaleString()}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copySummaryToClipboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Summary
          </button>

          <button
            type="button"
            onClick={() => onOpenReport(result)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            View Printable Investigation Report
          </button>
        </div>
      </div>
    </div>
  );
}
