import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bot, 
  Sparkles, 
  DollarSign, 
  Zap, 
  Layers, 
  ArrowRight,
  Info,
  Calendar
} from 'lucide-react';
import { TradeEvaluation, PlacedTrade } from '../types.ts';

interface StayExitAgentViewProps {
  evaluations: TradeEvaluation[];
  summary: {
    totalOutlay: number;
    totalCurrentVal: number;
    totalUnrealizedPnL: number;
    totalUnrealizedPct: number;
    stayCount: number;
    exitCount: number;
  };
  isLoading: boolean;
  onRefreshEvaluations: () => Promise<void>;
  onClosePosition: (tradeId: string) => Promise<void>;
  onNavigateToExecutionAgent: () => void;
  snapshotDate: string;
}

export const StayExitAgentView: React.FC<StayExitAgentViewProps> = ({
  evaluations,
  summary,
  isLoading,
  onRefreshEvaluations,
  onClosePosition,
  onNavigateToExecutionAgent,
  snapshotDate,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'STAY' | 'EXIT'>('ALL');

  const filteredEvals = evaluations.filter(e => {
    if (selectedFilter === 'ALL') return true;
    return e.determination === selectedFilter;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Section Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Stay / Exit Determination Agent</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  Section 2 • Daily Position Monitor
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Continuously tracks all entered 10-contract trades from Section 1 and generates authoritative <strong>Stay</strong> vs. <strong>Exit</strong> determinations as of the daily 8:00 AM snapshot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-refresh-evaluations"
              onClick={onRefreshEvaluations}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Recalculate Today's Marks</span>
            </button>
            <button
              id="btn-goto-log-trade"
              onClick={onNavigateToExecutionAgent}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <span>+ Log Another Trade</span>
            </button>
          </div>
        </div>
      </div>

      {/* Portfolio Overview Summary Bar (10-Contract Basis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* Total Capital Outlay */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total 10x Outlay</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-black text-white font-mono">
            ${summary.totalOutlay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">Across {evaluations.length} active positions</span>
        </div>

        {/* Current Position Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Current 10x Mark</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-cyan-300 font-mono">
            ${summary.totalCurrentVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400">Estimated mark-to-market</span>
        </div>

        {/* Total Unrealized P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Unrealized P&L</span>
            {summary.totalUnrealizedPnL >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className={`text-xl font-black font-mono flex items-baseline gap-1.5 ${
            summary.totalUnrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            <span>{summary.totalUnrealizedPnL >= 0 ? '+' : ''}${summary.totalUnrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="text-xs font-bold">({summary.totalUnrealizedPct >= 0 ? '+' : ''}{summary.totalUnrealizedPct.toFixed(1)}%)</span>
          </div>
          <span className="text-[11px] text-slate-400">Portfolio net return</span>
        </div>

        {/* Stay Decisions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="text-emerald-400 font-bold">STAY Determinations</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {summary.stayCount}
          </div>
          <span className="text-[11px] text-slate-400">Positions running on track</span>
        </div>

        {/* Exit Decisions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="text-rose-400 font-bold">EXIT Determinations</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-400 font-mono">
            {summary.exitCount}
          </div>
          <span className="text-[11px] text-slate-400">Action required (Target / Stop)</span>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            id="filter-evals-all"
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              selectedFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Positions ({evaluations.length})
          </button>
          <button
            id="filter-evals-stay"
            onClick={() => setSelectedFilter('STAY')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedFilter === 'STAY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            STAY ({summary.stayCount})
          </button>
          <button
            id="filter-evals-exit"
            onClick={() => setSelectedFilter('EXIT')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              selectedFilter === 'EXIT'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            EXIT ({summary.exitCount})
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Evaluated as of Daily Snapshot: <strong className="text-slate-200">{snapshotDate}</strong></span>
        </div>
      </div>

      {/* Position Cards Grid */}
      {filteredEvals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <Bot className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No active positions matching filter</h3>
            <p className="text-xs text-slate-400 mt-1">
              {evaluations.length === 0
                ? "You haven't logged any placed trades yet. Head to the Trade Execution Agent to record your 10-contract positions."
                : "No positions match the selected filter category."}
            </p>
          </div>
          {evaluations.length === 0 && (
            <button
              onClick={onNavigateToExecutionAgent}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
            >
              Go to Trade Execution Agent
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvals.map((evaluation) => {
            const isStay = evaluation.determination === 'STAY';
            const isProfit = evaluation.unrealizedPnLDollar >= 0;

            return (
              <div 
                key={evaluation.tradeId}
                className={`bg-slate-900 border rounded-2xl p-6 transition-all space-y-5 ${
                  isStay
                    ? 'border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                    : 'border-rose-500/40 hover:border-rose-500/60 shadow-lg shadow-rose-500/5 bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-900'
                }`}
              >
                {/* Header: Trade Rank, Ticker, Determination Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-mono">
                      Rank #{evaluation.tradeRank}
                    </span>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white font-mono">{evaluation.ticker}</span>
                        <span className="text-xs text-slate-400 font-semibold">{evaluation.strategy} (10 Contracts)</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {evaluation.companyName} • Entry: <span className="text-slate-300 font-mono">${evaluation.entryStockPrice.toFixed(2)}</span> ({evaluation.entryDate})
                      </p>
                    </div>
                  </div>

                  {/* High-Impact Determination Badge */}
                  <div className="flex items-center gap-2">
                    <div className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase flex items-center gap-2 border shadow-md ${
                      isStay
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-rose-500/10'
                    }`}>
                      {isStay ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>{evaluation.determination}: {evaluation.subVerdict}</span>
                    </div>

                    <button
                      id={`btn-close-pos-${evaluation.tradeId}`}
                      onClick={() => onClosePosition(evaluation.tradeId)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      title="Mark position as closed in portfolio"
                    >
                      Close / Archive
                    </button>
                  </div>
                </div>

                {/* 10-Contract Performance & Market Position Ledger */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono">
                  
                  {/* Initial 10x Outlay */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold block">
                      Initial 10x Outlay
                    </span>
                    <span className="text-sm font-bold text-white mt-0.5 block">
                      ${evaluation.entryNetDebitTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">Basis: 10 contracts</span>
                  </div>

                  {/* Current Estimated Value */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold block">
                      Current 10x Value
                    </span>
                    <span className="text-sm font-bold text-cyan-300 mt-0.5 block">
                      ${evaluation.currentEstimatedPositionValueTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">Market mark estimate</span>
                  </div>

                  {/* Unrealized 10x P&L */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold block">
                      10x Unrealized P&L
                    </span>
                    <span className={`text-sm font-black mt-0.5 block ${
                      isProfit ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isProfit ? '+' : ''}${evaluation.unrealizedPnLDollar.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isProfit ? '+' : ''}{evaluation.unrealizedPnLPct.toFixed(1)}%)
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">Net on 10 contracts</span>
                  </div>

                  {/* Underlying Stock Movement */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold block">
                      Underlying Stock
                    </span>
                    <span className={`text-sm font-bold mt-0.5 block ${
                      evaluation.stockPriceChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      ${evaluation.currentStockPrice.toFixed(2)} ({evaluation.stockPriceChangePct >= 0 ? '+' : ''}{evaluation.stockPriceChangePct.toFixed(2)}%)
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">vs Entry ${evaluation.entryStockPrice.toFixed(2)}</span>
                  </div>

                  {/* Time Horizon & DTE */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold block">
                      Time Horizon
                    </span>
                    <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                      {evaluation.remainingDTE} DTE
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">{evaluation.daysInTrade} days held</span>
                  </div>

                  {/* Delta Share Exposure */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-sans font-semibold block">
                      Delta Exposure
                    </span>
                    <span className="text-sm font-bold text-slate-200 mt-0.5 block">
                      {evaluation.keyMetrics.deltaStatus}
                    </span>
                    <span className="text-[10px] text-slate-500 font-sans">Net position gamma</span>
                  </div>

                </div>

                {/* Agent Institutional Rationale & Recommended Order Action */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isStay ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Agent Determination Analysis ({evaluation.determination})
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Confidence: {evaluation.confidenceScore}%</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {evaluation.rationale}
                      </p>
                    </div>
                  </div>

                  {/* Direct Broker Order Ticket Directive */}
                  <div className={`p-3 rounded-lg border text-xs font-mono flex items-center gap-3 ${
                    isStay
                      ? 'bg-emerald-950/30 border-emerald-500/20 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-200 font-semibold'
                  }`}>
                    <Zap className={`w-4 h-4 shrink-0 ${isStay ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <div className="flex-1">
                      <span className="text-[10px] uppercase tracking-wider block text-slate-400 font-sans">Broker Action Ticket</span>
                      <span>{evaluation.recommendedAction}</span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
