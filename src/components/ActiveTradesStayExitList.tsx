import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Plus, 
  Trash2, 
  Bot, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Layers,
  HelpCircle
} from 'lucide-react';
import { StayExitDecision, PlacedTrade, OptionCandidate } from '../types.ts';

interface ActiveTradesStayExitListProps {
  stayExitDecisions: StayExitDecision[];
  activeTrades: PlacedTrade[];
  candidates: OptionCandidate[];
  onOpenAgentChat: () => void;
  onIngestByRank: (ranks: number[]) => void;
  onCloseTrade: (tradeId: string, status: 'CLOSED_PROFIT' | 'CLOSED_STOP' | 'CLOSED_MANUAL') => void;
  onDeleteTrade: (tradeId: string) => void;
  onRefreshDecisions: () => void;
  isLoading?: boolean;
}

export const ActiveTradesStayExitList: React.FC<ActiveTradesStayExitListProps> = ({
  stayExitDecisions,
  activeTrades,
  candidates,
  onOpenAgentChat,
  onIngestByRank,
  onCloseTrade,
  onDeleteTrade,
  onRefreshDecisions,
  isLoading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quickRankInput, setQuickRankInput] = useState('');

  const exitCount = stayExitDecisions.filter(d => d.decision === 'EXIT').length;
  const stayCount = stayExitDecisions.filter(d => d.decision === 'STAY').length;

  const handleQuickRankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRankInput.trim()) return;
    const matches = quickRankInput.match(/\d+/g);
    if (matches) {
      const ranks = matches.map(Number).filter(n => n > 0 && n <= (candidates.length || 50));
      if (ranks.length > 0) {
        onIngestByRank(ranks);
        setQuickRankInput('');
      }
    }
  };

  const topSuggestions = candidates.slice(0, 3);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 shadow-2xl relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute top-0 right-0 w-96 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 w-80 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-bold text-white tracking-tight">
                Active Trades — Stay / Exit Directives
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                Top of Daily Report
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {activeTrades.length} Active {activeTrades.length === 1 ? 'Position' : 'Positions'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluated each morning at 8:00 AM CDT against live prices, -3.0% stop-losses, and +6.0% profit targets.
            </p>
          </div>
        </div>

        {/* Status Counters & Chat Action */}
        <div className="flex items-center gap-2 flex-wrap">
          {exitCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              {exitCount} Exit Action{exitCount > 1 ? 's' : ''} Required
            </span>
          )}
          {stayCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {stayCount} Stay (Hold)
            </span>
          )}
          <button
            id="btn-open-agent-chat-top"
            onClick={onOpenAgentChat}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5 shadow-md shadow-cyan-950"
          >
            <Bot className="w-3.5 h-3.5" />
            Trade Agent Chat
          </button>
        </div>
      </div>

      {/* When NO trades are currently logged, display a prominent, informative empty-state card with quick actions */}
      {activeTrades.length === 0 ? (
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 sm:p-6 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                No Active Trades Currently Monitored
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                When you execute one of today&apos;s suggested setups, log it by Rank Number or click <strong className="text-cyan-300">&quot;Log Trade&quot;</strong> in the candidates table below. The Trade Management Agent will continuously monitor underlying price action, delta changes, and issue daily Stay or Exit directives.
              </p>
            </div>

            {/* One-Click Quick Ingest from Today's Top Ranks */}
            {topSuggestions.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quick Track from Today&apos;s Ranked Setups:
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {topSuggestions.map((c, i) => {
                    const rank = i + 1;
                    return (
                      <button
                        key={c.Ticker}
                        onClick={() => onIngestByRank([rank])}
                        className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 text-xs font-medium text-slate-200 hover:text-white transition flex items-center gap-2 group"
                      >
                        <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center">
                          #{rank}
                        </span>
                        <span className="font-bold text-white">{c.Ticker}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {c.Strategy === 'Straight Call' ? `${c.FormattedLongStrike}C` : c.Strategy}
                        </span>
                        <span className="text-[11px] text-cyan-400 font-bold group-hover:translate-x-0.5 transition">
                          + Track
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Rank Form */}
            <form onSubmit={handleQuickRankSubmit} className="flex items-center justify-center gap-2 pt-2">
              <input
                type="text"
                placeholder="Or enter Rank # (e.g. 1, 2)"
                value={quickRankInput}
                onChange={(e) => setQuickRankInput(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 w-52 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Track Trade
              </button>
            </form>

            {/* Execution discipline notes */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left text-[11px] text-slate-400 border-t border-slate-800/60 mt-4">
              <div className="p-2 rounded bg-slate-900/50">
                <span className="text-slate-300 font-bold block">• Automated Stop:</span>
                Underlying breaches -3.0% threshold triggers an immediate EXIT directive.
              </div>
              <div className="p-2 rounded bg-slate-900/50">
                <span className="text-slate-300 font-bold block">• Profit Target:</span>
                Underlying moves +6.0% or premium doubles triggers profit-taking EXIT.
              </div>
              <div className="p-2 rounded bg-slate-900/50">
                <span className="text-slate-300 font-bold block">• 8:00 AM CDT Run:</span>
                Evaluated daily and emailed with attached CSV directly to your inbox.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Decision Cards List for Active Trades */
        <div className="space-y-3.5">
          {stayExitDecisions.length === 0 ? (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              Evaluating current Stay/Exit decisions for {activeTrades.length} active {activeTrades.length === 1 ? 'position' : 'positions'}...
            </div>
          ) : (
            stayExitDecisions.map((decision) => {
              const isExit = decision.decision === 'EXIT';
              const isExpanded = expandedId === decision.tradeId;
              const isProfit = decision.estimatedPnLDollars >= 0;
              const trade = activeTrades.find(t => t.id === decision.tradeId);

              return (
                <div
                  key={decision.tradeId}
                  id={`decision-card-${decision.ticker}`}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    isExit
                      ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/60'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Summary Bar */}
                  <div className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    
                    {/* Left: Ticker, Rank & Strategy */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isExit
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {decision.decision}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white font-sans">{decision.ticker}</span>
                          <span className="text-xs text-slate-400">({decision.companyName})</span>
                          {trade?.rankNumber && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                              Rank #{trade.rankNumber}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                            {decision.strategy}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono flex-wrap">
                          {trade?.longStrike && (
                            <span>Long: <strong className="text-slate-200">${trade.longStrike}C</strong> ({trade.longDelta}Δ)</span>
                          )}
                          {trade?.shortStrike && (
                            <span>Short: <strong className="text-slate-200">${trade.shortStrike}C</strong> ({trade.shortDelta}Δ)</span>
                          )}
                          {trade?.targetExpiration && (
                            <span>Exp: <strong className="text-slate-200">{trade.targetExpiration}</strong></span>
                          )}
                          {trade?.entryDate && (
                            <span>Entry Date: <strong className="text-slate-200">{trade.entryDate}</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Performance & Directive Indicator */}
                    <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">P&amp;L ({decision.contracts || 1} contract)</div>
                        <div className={`text-sm font-mono font-black flex items-center gap-1 justify-end ${
                          isProfit ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isProfit ? '+' : ''}${Math.abs(decision.estimatedPnLDollars).toFixed(0)} ({isProfit ? '+' : ''}{decision.stockChangePct.toFixed(2)}% on stock)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-slate-400">Directive</div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-extrabold ${
                          isExit
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                        }`}>
                          {isExit ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          {decision.decision === 'STAY' ? 'STAY (Hold Position)' : 'EXIT (Take Action)'}
                        </span>
                      </div>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : decision.tradeId)}
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title={isExpanded ? 'Collapse analysis' : 'Expand detailed risk & technical analysis'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-slate-800/80 bg-slate-950/90 font-sans text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block mb-1">Entry vs Live Stock Price</span>
                          <div className="font-mono text-xs text-slate-200">
                            Entry: <span className="font-bold text-white">${decision.entryStockPrice.toFixed(2)}</span> → Now: <span className="font-bold text-cyan-300">${decision.currentStockPrice.toFixed(2)}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Stop: <span className="text-rose-400 font-mono">${(decision.entryStockPrice * 0.97).toFixed(2)} (-3%)</span> | Target: <span className="text-emerald-400 font-mono">${(decision.entryStockPrice * 1.06).toFixed(2)} (+6%)</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-[11px] text-slate-400 block mb-1">Option Premium &amp; Value</span>
                          <div className="font-mono text-xs text-slate-200">
                            Paid: <span className="font-bold text-slate-300">${decision.entryNetDebit.toFixed(2)}</span> → Est Value: <span className="font-bold text-emerald-400">${decision.estimatedCurrentOptionValue.toFixed(2)}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Days Held: <span className="text-slate-300 font-mono">{decision.daysHeld}d</span> | Remaining DTE: <span className="text-cyan-300 font-mono">{decision.remainingDTE}d</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
                          <span className="text-[11px] text-slate-400 block">Agent Action Recommendation</span>
                          <p className="font-mono text-[11px] text-cyan-300 font-semibold mt-1">
                            {decision.suggestedAction}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => onCloseTrade(decision.tradeId, isProfit ? 'CLOSED_PROFIT' : 'CLOSED_STOP')}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                                isProfit
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                                  : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                              }`}
                            >
                              {isProfit ? 'Mark Closed (Profit)' : 'Mark Closed (Stop)'}
                            </button>
                            <button
                              onClick={() => onDeleteTrade(decision.tradeId)}
                              className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-900/30 text-slate-300 text-xs leading-relaxed">
                        <span className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Detailed Quantitative Risk Analysis
                        </span>
                        {decision.detailedAnalysis}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Quick Add Another Trade Footer */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <form onSubmit={handleQuickRankSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-400 text-xs">Did you place another suggested trade?</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Enter Rank # (e.g. 2)"
              value={quickRankInput}
              onChange={(e) => setQuickRankInput(e.target.value)}
              className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 w-36 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="submit"
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </form>

        <button
          onClick={onRefreshDecisions}
          disabled={isLoading}
          className="text-xs text-slate-400 hover:text-slate-200 transition font-medium"
        >
          {isLoading ? 'Re-evaluating...' : 'Refresh Stay/Exit Decisions'}
        </button>
      </div>
    </div>
  );
};
