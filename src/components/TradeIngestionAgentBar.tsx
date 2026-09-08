import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Check, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Layers, 
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { OptionCandidate, PlacedTrade } from '../types.ts';

interface TradeIngestionAgentBarProps {
  candidates: OptionCandidate[];
  activeTrades: PlacedTrade[];
  onIngestRanks: (ranks: number[], contracts?: number) => void;
  onOpenAgentChat: () => void;
  isIngesting?: boolean;
}

export const TradeIngestionAgentBar: React.FC<TradeIngestionAgentBarProps> = ({
  candidates,
  activeTrades,
  onIngestRanks,
  onOpenAgentChat,
  isIngesting = false,
}) => {
  const [rankInput, setRankInput] = useState('');
  const [contractsCount, setContractsCount] = useState('1');
  const [justIngestedRanks, setJustIngestedRanks] = useState<number[]>([]);

  // Get placed rank numbers for visual badge
  const placedRankSet = new Set(activeTrades.map(t => t.rankNumber));

  const handleRankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rankInput.trim() || isIngesting) return;

    const matches = rankInput.match(/\d+/g);
    if (matches) {
      const parsed = matches.map(Number).filter(n => n > 0 && n <= (candidates.length || 50));
      if (parsed.length > 0) {
        onIngestRanks(parsed, Number(contractsCount) || 1);
        setJustIngestedRanks(parsed);
        setRankInput('');
        setTimeout(() => setJustIngestedRanks([]), 3500);
      }
    }
  };

  const handlePillClick = (rankNum: number) => {
    onIngestRanks([rankNum], Number(contractsCount) || 1);
    setJustIngestedRanks([rankNum]);
    setTimeout(() => setJustIngestedRanks([]), 3500);
  };

  const topCandidates = candidates.slice(0, 5);

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 mb-8 shadow-xl shadow-cyan-950/20 relative overflow-hidden">
      {/* Decorative accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400" />
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        
        {/* Left Agent Prompt */}
        <div className="flex items-start gap-3.5 max-w-xl">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                Daily Trade Management Agent
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active
              </span>
            </div>
            <h3 className="text-sm md:text-base font-bold text-white mt-0.5">
              Did you execute any of today&apos;s suggested trade setups?
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Enter the <span className="text-cyan-300 font-bold">Rank Number(s)</span> below. The agent will ingest the exact strikes, deltas, 3% stop-loss &amp; 6% target, and run daily Stay/Exit evaluations.
            </p>
          </div>
        </div>

        {/* Right Ingestion Controls */}
        <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-2.5">
          <form onSubmit={handleRankSubmit} className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-56">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500 font-mono text-xs">
                Rank #
              </span>
              <input
                id="trade-rank-input"
                type="text"
                value={rankInput}
                onChange={(e) => setRankInput(e.target.value)}
                placeholder="e.g. 1 or 1, 3"
                className="w-full pl-16 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono font-bold"
              />
            </div>

            <div className="w-24">
              <select
                id="trade-contracts-select"
                value={contractsCount}
                onChange={(e) => setContractsCount(e.target.value)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
                title="Number of Contracts"
              >
                <option value="1">1 Ctr</option>
                <option value="2">2 Ctrs</option>
                <option value="3">3 Ctrs</option>
                <option value="5">5 Ctrs</option>
                <option value="10">10 Ctrs</option>
              </select>
            </div>

            <button
              id="btn-ingest-trade-ranks"
              type="submit"
              disabled={isIngesting || !rankInput.trim()}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-md ${
                rankInput.trim() && !isIngesting
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black cursor-pointer shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isIngesting ? (
                'Ingesting...'
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Log Placed Trade
                </>
              )}
            </button>

            <button
              id="btn-open-agent-chat-bar"
              type="button"
              onClick={onOpenAgentChat}
              className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
              title="Open Conversational Agent Chat"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Rank Ingestion Pills from Current Candidates */}
          {topCandidates.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 font-medium mr-1">Quick Add:</span>
              {topCandidates.map((candidate, idx) => {
                const rankNum = idx + 1;
                const isAlreadyPlaced = placedRankSet.has(rankNum);
                const isJustIngested = justIngestedRanks.includes(rankNum);

                return (
                  <button
                    key={candidate.Ticker}
                    type="button"
                    onClick={() => handlePillClick(rankNum)}
                    disabled={isAlreadyPlaced || isIngesting}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition flex items-center gap-1 border ${
                      isJustIngested
                        ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 font-bold animate-bounce'
                        : isAlreadyPlaced
                        ? 'bg-slate-800/40 text-slate-500 border-slate-800 cursor-default line-through'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border-slate-800 hover:border-cyan-500/40'
                    }`}
                    title={isAlreadyPlaced ? `Rank #${rankNum} (${candidate.Ticker}) already in portfolio` : `Quick ingest Rank #${rankNum} (${candidate.Ticker})`}
                  >
                    <span className="text-cyan-400 font-bold">#{rankNum}</span>
                    <span>{candidate.Ticker}</span>
                    {isAlreadyPlaced && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Success Notification message */}
      {justIngestedRanks.length > 0 && (
        <div className="mt-3 pt-3 border-t border-cyan-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            Successfully ingested Rank #{justIngestedRanks.join(', #')}! Position added to active tracking with -3% stop loss and +6% profit target.
          </span>
        </div>
      )}
    </div>
  );
};
