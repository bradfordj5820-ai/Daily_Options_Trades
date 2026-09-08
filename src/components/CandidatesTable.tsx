import React, { useState } from 'react';
import { 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Sparkles, 
  Activity, 
  ArrowUpRight, 
  Layers, 
  CheckCircle2, 
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { OptionCandidate } from '../types.ts';

interface CandidatesTableProps {
  candidates: OptionCandidate[];
  onSelectCandidate: (candidate: OptionCandidate) => void;
  onLogTradeDirect?: (rank: number) => void;
}

export const CandidatesTable: React.FC<CandidatesTableProps> = ({
  candidates,
  onSelectCandidate,
  onLogTradeDirect,
}) => {
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  if (candidates.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Candidates Passed Filters</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Capital preservation mode is active. Adjust your search criteria, change the scanned sector universe, or trigger a new pre-market scan.
        </p>
      </div>
    );
  }

  const toggleExpand = (ticker: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTicker(expandedTicker === ticker ? null : ticker);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          
          {/* Table Header */}
          <thead className="bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 w-12 text-center">Rank</th>
              <th className="py-3.5 px-4">Ticker & Setup</th>
              <th className="py-3.5 px-4 text-center">Composite Score</th>
              <th className="py-3.5 px-4">Strategy & DTE</th>
              <th className="py-3.5 px-4">Strike Selection</th>
              <th className="py-3.5 px-4">Net Debit / Risk</th>
              <th className="py-3.5 px-4">Profit Potential</th>
              <th className="py-3.5 px-4">Technicals (RSI/20D)</th>
              <th className="py-3.5 px-4">Liquidity</th>
              <th className="py-3.5 px-4 text-right">Payoff</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {candidates.map((c, idx) => {
              const isExpanded = expandedTicker === c.Ticker;
              const isTopTier = c.TotalScore >= 85;

              return (
                <React.Fragment key={c.Ticker}>
                  <tr
                    id={`candidate-row-${c.Ticker}`}
                    onClick={() => onSelectCandidate(c)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                        idx === 0
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : idx === 1
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                          : 'text-slate-500'
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>

                    {/* Ticker & Price */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm tracking-tight">{c.Ticker}</span>
                            <span className="text-xs text-slate-400 font-mono font-semibold">${c.StockPrice.toFixed(2)}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">
                            {c.CompanyName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Composite Score */}
                    <td className="py-3.5 px-4 text-center font-sans">
                      <div className="inline-flex flex-col items-center">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 border ${
                          isTopTier
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                            : c.TotalScore >= 70
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          <Sparkles className="w-3 h-3" />
                          <span>{c.TotalScore}</span>
                          <span className="text-[10px] opacity-70">/100</span>
                        </div>
                        <button
                          id={`btn-expand-score-${c.Ticker}`}
                          onClick={(e) => toggleExpand(c.Ticker, e)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-0.5 mt-1 transition"
                        >
                          {isExpanded ? 'Hide' : 'Factors'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Strategy & DTE */}
                    <td className="py-3.5 px-4 font-sans">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.Strategy === 'Straight Call'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                            : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/20'
                        }`}>
                          {c.Strategy}
                        </span>
                        <span className="text-slate-400 text-[11px] block mt-0.5 font-mono">
                          {c.TargetDTE} DTE ({c.TargetExpiration})
                        </span>
                      </div>
                    </td>

                    {/* Strike Selection */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-1 text-slate-200">
                          <span className="text-emerald-400 font-bold">{c.FormattedLongStrike}C</span>
                          <span className="text-[10px] text-slate-500">({c.LongDelta}Δ)</span>
                        </div>
                        {c.ShortStrike && (
                          <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                            <span>Short {c.FormattedShortStrike}C</span>
                            <span className="text-[10px] text-slate-500">({c.ShortDelta}Δ)</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Est Net Debit */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-rose-300">{c.FormattedEstNetDebit}</span>
                      <span className="text-[10px] text-slate-500 block">(${(c.EstNetDebit * 100).toFixed(0)}/ctr)</span>
                    </td>

                    {/* Profit Potential */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-400">{c.MaxProfitPotential}</span>
                    </td>

                    {/* Technicals */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px]">RSI:</span>
                          <span className={`font-mono font-bold text-xs ${
                            c.RSI >= 50 && c.RSI <= 70 ? 'text-emerald-400' : 'text-slate-300'
                          }`}>
                            {c.RSI}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px]">20D:</span>
                          <span className={`font-mono font-bold text-xs ${
                            c.Return20d > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {c.Return20d > 0 ? `+${c.Return20d}%` : `${c.Return20d}%`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Liquidity */}
                    <td className="py-3.5 px-4 font-sans">
                      <div className="space-y-0.5">
                        <div className="text-slate-300 text-xs">
                          <span className="text-slate-500 text-[11px]">OI: </span>
                          <span className="font-mono font-bold text-slate-200">{c.OpenInterest.toLocaleString()}</span>
                        </div>
                        <div className="text-slate-300 text-xs">
                          <span className="text-slate-500 text-[11px]">Spread: </span>
                          <span className="font-mono text-emerald-400 font-semibold">{c.FormattedSpreadPct}</span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {onLogTradeDirect && (
                          <button
                            id={`btn-quick-log-${c.Ticker}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onLogTradeDirect(idx + 1);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/30 transition flex items-center gap-1"
                            title={`Log 10x Contracts for Rank #${idx + 1}`}
                          >
                            <span>10x</span> Trade
                          </button>
                        )}
                        <button
                          id={`btn-view-payoff-${c.Ticker}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCandidate(c);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition flex items-center gap-1"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          Payoff
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Score Factors Row */}
                  {isExpanded && (
                    <tr className="bg-slate-950/70 border-b border-slate-800">
                      <td colSpan={10} className="p-4 font-sans">
                        <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                            <span className="font-bold text-slate-200 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              Detailed Scoring Audit for {c.Ticker} ({c.TotalScore}/100 Total Points)
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Base Liquidity: OI ≥ 500 ✓ | Spread ≤ 5% ✓ | Price ≥ $20 ✓
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div className={`p-2 rounded border flex items-center justify-between ${
                              c.ScoreBreakdown.priceAboveSMA20 ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              <span>&gt; 20-Day SMA (${c.SMA20})</span>
                              <span className="font-bold">{c.ScoreBreakdown.priceAboveSMA20 ? '+15' : '0'}</span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between ${
                              c.ScoreBreakdown.priceAboveSMA50 ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              <span>&gt; 50-Day SMA (${c.SMA50})</span>
                              <span className="font-bold">{c.ScoreBreakdown.priceAboveSMA50 ? '+15' : '0'}</span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between ${
                              c.ScoreBreakdown.priceAboveSMA200 ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              <span>&gt; 200-Day SMA (${c.SMA200})</span>
                              <span className="font-bold">{c.ScoreBreakdown.priceAboveSMA200 ? '+10' : '0'}</span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between ${
                              c.ScoreBreakdown.rsiInTargetRange ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              <span>50≤RSI≤70 ({c.RSI})</span>
                              <span className="font-bold">{c.ScoreBreakdown.rsiInTargetRange ? '+15' : '0'}</span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between ${
                              c.ScoreBreakdown.highOpenInterest ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              <span>OI ≥ 2,500</span>
                              <span className="font-bold">{c.ScoreBreakdown.highOpenInterest ? '+15' : '0'}</span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between ${
                              c.ScoreBreakdown.tightSpread ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              <span>Spread ≤ 2.0%</span>
                              <span className="font-bold">{c.ScoreBreakdown.tightSpread ? '+15' : '0'}</span>
                            </div>

                            <div className={`p-2 rounded border flex items-center justify-between sm:col-span-2 ${
                              c.ScoreBreakdown.positive20dReturn ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}>
                              <span>20D Return &gt; 0% (+{c.Return20d}%)</span>
                              <span className="font-bold">{c.ScoreBreakdown.positive20dReturn ? '+15' : '0'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
};
