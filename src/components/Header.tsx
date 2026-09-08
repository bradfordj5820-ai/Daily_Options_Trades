import React from 'react';
import { TrendingUp, Sparkles, Clock, Download, RefreshCw, Cpu, ShieldCheck, Bot, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { OptionCandidate, PlacedTrade } from '../types.ts';
import { exportCandidatesToCsv } from '../utils/exportCsv.ts';

interface HeaderProps {
  candidates: OptionCandidate[];
  placedTrades: PlacedTrade[];
  lastUpdated: string | null;
  snapshotDate: string;
  isScanning: boolean;
  onScan: () => void;
  onOpenAutomation: () => void;
  activeTab: 'scanner' | 'trade-execution' | 'stay-exit' | 'briefing';
  setActiveTab: (tab: 'scanner' | 'trade-execution' | 'stay-exit' | 'briefing') => void;
}

export const Header: React.FC<HeaderProps> = ({
  candidates,
  placedTrades,
  lastUpdated,
  snapshotDate,
  isScanning,
  onScan,
  onOpenAutomation,
  activeTab,
  setActiveTab,
}) => {
  const openTradesCount = placedTrades.filter(t => t.status === 'OPEN').length;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Brand & Market Status */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black shrink-0">
              <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Daily Options Trades
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Pre-Market Quantitative Pipeline
                  </span>
                </h1>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  Daily Run @ 8:00 AM CDT/CST (Mon–Fri)
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center flex-wrap gap-2 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Saved Snapshot: <strong className="text-slate-200">{snapshotDate}</strong></span>
                {lastUpdated && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Actions */}
          <div className="flex items-center flex-wrap gap-2">
            {/* 4 Main Navigation Tabs */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center flex-wrap gap-1">
              <button
                id="btn-tab-scanner"
                onClick={() => setActiveTab('scanner')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'scanner'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Opportunities</span>
                <span className="font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {candidates.length}
                </span>
              </button>

              <button
                id="btn-tab-trade-execution"
                onClick={() => setActiveTab('trade-execution')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'trade-execution'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Trade Execution Agent</span>
                {openTradesCount > 0 && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    activeTab === 'trade-execution' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {openTradesCount}
                  </span>
                )}
              </button>

              <button
                id="btn-tab-stay-exit"
                onClick={() => setActiveTab('stay-exit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'stay-exit'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Stay / Exit Agent</span>
              </button>

              <button
                id="btn-tab-briefing"
                onClick={() => setActiveTab('briefing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'briefing'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>AI Briefing</span>
              </button>
            </div>

            {/* CSV Download */}
            <button
              id="btn-download-csv"
              onClick={() => exportCandidatesToCsv(candidates)}
              disabled={candidates.length === 0}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Download pre_market_options_report.csv"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Pipeline Config Modal */}
            <button
              id="btn-open-automation-modal"
              onClick={onOpenAutomation}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/80 transition flex items-center gap-1.5"
              title="Pipeline Schedule & Credentials Configuration"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Schedule</span>
            </button>

            {/* Run Scan Manual Trigger (Preserved) */}
            <button
              id="btn-trigger-scan"
              onClick={onScan}
              disabled={isScanning}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Screening...' : 'Run Scan'}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
