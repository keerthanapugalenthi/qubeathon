import React from 'react';
import { X, Printer, Shield, AlertCircle, FileCheck, CheckSquare } from 'lucide-react';

export default function ReportModal({ caseData, onClose }) {
  if (!caseData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Top Control Bar (Hidden during Print) */}
        <div className="no-print p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-govblue-800" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Investigation Screening Dossier
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-govblue-800 hover:bg-govblue-900 text-white text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-8 sm:p-10 overflow-y-auto font-sans space-y-6">
          {/* Official Report Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-govblue-800 bg-sky-50 px-2.5 py-1 rounded border border-sky-200">
                  CONFIDENTIAL • SCREENING AUDIT DOSSIER
                </span>
                <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-2">
                  BIS VerifyLens Screening Report
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Qubeathon PS01: Automated Detection of Potential BIS Standard Mark Misuse
                </p>
              </div>

              <div className="text-right text-xs">
                <div className="font-mono-code font-bold text-slate-900">
                  {caseData.case_id}
                </div>
                <div className="text-slate-500 text-[11px]">
                  {new Date(caseData.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Regulatory Warning */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 text-xs text-amber-950 rounded-r-xl">
            <p className="font-bold mb-0.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              REGULATORY LIMITATION NOTICE
            </p>
            <p className="text-[11px] leading-relaxed text-amber-900">
              This dossier contains automated preliminary screening findings based on syntactic format analysis
              and claim discrepancy evaluation. A suspicious indicator is <strong>NOT legal proof of a violation</strong>.
              A correct format is <strong>NOT proof of genuine certification</strong>. Official verification through
              the Bureau of Indian Standards (BIS Care App / Manakonline) is mandatory.
            </p>
          </div>

          {/* Product & Case Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Product Subject</span>
              <span className="font-bold text-slate-800">{caseData.product_name || 'Unspecified'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assessment</span>
              <span className="font-bold text-slate-900">{caseData.risk_label}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Source Channel</span>
              <span className="font-bold text-slate-800 capitalize">{caseData.source_type?.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Data Classification</span>
              <span className="font-bold text-slate-800">
                {caseData.is_synthetic ? 'Synthetic Demo Record' : 'User Submitted'}
              </span>
            </div>
          </div>

          {/* Assessment Summary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              1. Executive Screening Assessment
            </h3>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs leading-relaxed text-slate-800 font-medium">
              {caseData.summary}
            </div>
          </div>

          {/* Detected Elements & Evidence */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              2. Detected Claims & Corroborating Evidence
            </h3>
            <div className="space-y-2">
              {caseData.evidence && caseData.evidence.length > 0 ? (
                caseData.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <FileCheck className="w-3.5 h-3.5 text-govblue-700 mt-0.5 flex-shrink-0" />
                    <span>{ev}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No evidence items recorded.</p>
              )}
            </div>
          </div>

          {/* Detailed Regulatory Findings */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              3. Regulatory Rule Evaluation & Reasons
            </h3>
            <div className="space-y-2">
              {caseData.reasons && caseData.reasons.length > 0 ? (
                caseData.reasons.map((r, i) => (
                  <div key={i} className="text-xs text-slate-800 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                    <strong>Finding {i + 1}:</strong> {r}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No specific rule violations detected.</p>
              )}
            </div>
          </div>

          {/* Official Verification Status Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              4. Genuine Certification Verification Status
            </h3>
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Live BIS Registry API:</span>
                <span className="font-mono-code font-bold text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  NOT PUBLICLY AVAILABLE
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                The Bureau of Indian Standards does not offer a public automated API for third-party automated lookups.
                Official verification must be performed through user-authenticated BIS portals or the BIS Care App.
              </p>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-govblue-900 font-medium text-[11px]">
                <strong>Official Route:</strong> Use BIS Care Mobile App ('Verify Licence Details' / 'Verify R-Number') or ManakOnline (www.manakonline.in).
              </div>
            </div>
          </div>

          {/* Recommended Investigation Protocols */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              5. Recommended Human Verification Protocols
            </h3>
            <ol className="space-y-1.5 list-decimal list-inside text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {caseData.recommended_steps &&
                caseData.recommended_steps.map((st, i) => (
                  <li key={i} className="leading-relaxed">
                    {st}
                  </li>
                ))}
            </ol>
          </div>

          {/* Signoff & Regulatory Footer */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-slate-400 gap-2">
            <span>
              Generated by BIS VerifyLens Screening Assistant • Problem Statement PS01
            </span>
            <span>
              Official Verification Portals: manakonline.in • crsbis.in • bis.gov.in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
