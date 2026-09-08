import React, { useState } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  Mail, 
  Download, 
  Send, 
  FileText, 
  AlertCircle,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { OptionCandidate } from '../types.ts';
import { exportCandidatesToCsv } from '../utils/exportCsv.ts';

interface ExecutiveBriefingViewProps {
  briefing: { content: string; generatedAt: string; totalCandidatesAnalyzed: number } | null;
  candidates: OptionCandidate[];
  isGenerating: boolean;
  onGenerateBriefing: () => void;
}

export const ExecutiveBriefingView: React.FC<ExecutiveBriefingViewProps> = ({
  briefing,
  candidates,
  isGenerating,
  onGenerateBriefing,
}) => {
  const [copied, setCopied] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const handleCopy = () => {
    if (!briefing?.content) return;
    navigator.clipboard.writeText(briefing.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateEmail = async () => {
    setIsDispatching(true);
    setDispatchStatus(null);
    try {
      const res = await fetch('/api/dispatch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: `Executive Morning Briefing: Top Options Trades (${new Date().toLocaleDateString('en-US')})`,
        }),
      });
      const data = await res.json();
      setDispatchStatus(data.message || 'Email dispatch completed.');
    } catch (err) {
      setDispatchStatus('Email dispatch request failed.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">Institutional Morning Strategy Briefing</h2>
          </div>
          <p className="text-xs text-slate-400">
            Synthesizing top quantitative options candidates into an actionable executive report with -3% stop loss and +6% profit target guidelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-copy-briefing-md"
            onClick={handleCopy}
            disabled={!briefing}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied MD' : 'Copy Markdown'}
          </button>

          <button
            id="btn-simulate-email-dispatch"
            onClick={handleSimulateEmail}
            disabled={isDispatching || !briefing}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5" />
            {isDispatching ? 'Dispatching...' : 'Simulate Email Dispatch'}
          </button>

          <button
            id="btn-generate-ai-briefing"
            onClick={onGenerateBriefing}
            disabled={isGenerating || candidates.length === 0}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating Strategy...' : 'Regenerate Briefing'}
          </button>
        </div>
      </div>

      {/* Dispatch notification status */}
      {dispatchStatus && (
        <div className="bg-slate-900 border border-cyan-500/40 p-4 rounded-xl flex items-center justify-between text-xs text-cyan-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{dispatchStatus}</span>
          </div>
          <button
            id="btn-dismiss-dispatch-status"
            onClick={() => setDispatchStatus(null)}
            className="text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* Briefing Document Paper Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl relative">
        <div className="max-w-4xl mx-auto">
          {briefing ? (
            <div>
              {/* Header meta */}
              <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">Autonomous Pre-Market Options Report</span>
                  <span>•</span>
                  <span>{new Date(briefing.generatedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                    Gemini 3.7 Flash
                  </span>
                  <span>•</span>
                  <span>{candidates.length} Scored Setups</span>
                </div>
              </div>

              {/* Markdown Content */}
              <div className="prose prose-invert prose-slate max-w-none text-slate-200 text-sm leading-relaxed space-y-4">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-extrabold text-white border-b border-slate-800 pb-2 mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold text-cyan-300 mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-bold text-emerald-400 mt-5 mb-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-semibold text-slate-100 mt-4 mb-2">{children}</h4>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1.5 text-slate-300 my-3">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1.5 text-slate-300 my-3">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-300 text-xs sm:text-sm">{children}</li>,
                    strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                    p: ({ children }) => <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{children}</p>,
                    code: ({ children }) => <code className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs border border-slate-800">{children}</code>,
                    hr: () => <hr className="border-slate-800 my-6" />,
                  }}
                >
                  {briefing.content}
                </ReactMarkdown>
              </div>

              {/* Quick Action Footer */}
              <div className="border-t border-slate-800 pt-6 mt-8 flex items-center justify-between">
                <button
                  id="btn-footer-download-csv"
                  onClick={() => exportCandidatesToCsv(candidates)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Associated CSV Data (pre_market_options_report.csv)
                </button>
                <button
                  id="btn-footer-copy"
                  onClick={handleCopy}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied' : 'Copy Full Report'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Executive Briefing Not Yet Generated</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
                Click below to synthesize the current top-ranked quantitative options opportunities into an institutional morning report using Gemini 3.7 Flash.
              </p>
              <button
                id="btn-empty-generate-briefing"
                onClick={onGenerateBriefing}
                disabled={isGenerating || candidates.length === 0}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-2 mx-auto shadow-lg shadow-cyan-500/20"
              >
                <Sparkles className="w-4 h-4" />
                Generate Morning Briefing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
