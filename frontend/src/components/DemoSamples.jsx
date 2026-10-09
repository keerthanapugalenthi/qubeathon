import React from 'react';
import { FlaskConical, ArrowRight, Sparkles } from 'lucide-react';

export default function DemoSamples({ samples, onSelectSample, loading }) {
  if (!samples || samples.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
            <FlaskConical className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            Synthetic Demo Test Scenarios
          </h2>
        </div>
        <span className="text-[11px] font-medium bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-200 self-start sm:self-auto">
          ⚠️ Synthetic Data for Hackathon Evaluation Only
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3.5">
        Click any pre-configured test case below to populate the screening tool and observe the explainable evaluation engine:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {samples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            disabled={loading}
            onClick={() => onSelectSample(sample)}
            className="group text-left p-3 rounded-xl border border-slate-200 hover:border-govblue-600 hover:bg-govblue-50/40 transition-all flex flex-col justify-between bg-slate-50/50 hover:shadow-xs disabled:opacity-50"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                <span className="text-govblue-700 font-mono-code">{sample.id}</span>
                <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded">
                  Synthetic
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-800 group-hover:text-govblue-900 transition line-clamp-1 mb-1">
                {sample.title}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2">
                {sample.product_name}
              </p>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-medium text-govblue-700 group-hover:text-govblue-900">
              <span>Load Test Case</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
