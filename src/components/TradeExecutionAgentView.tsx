import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  TrendingUp, 
  Layers, 
  DollarSign, 
  Trash2, 
  Clock, 
  CheckSquare, 
  ArrowRight,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { OptionCandidate, PlacedTrade } from '../types.ts';

interface TradeExecutionAgentViewProps {
  candidates: OptionCandidate[];
  placedTrades: PlacedTrade[];
  onLogTrade: (tradeRank: number, customFillPrice?: number, notes?: string) => Promise<boolean>;
  onDeleteTrade: (tradeId: string) => Promise<void>;
  onNavigateToStayExit: () => void;
  snapshotDate: string;
}

export const TradeExecutionAgentView: React.FC<TradeExecutionAgentViewProps> = ({
  candidates,
  placedTrades,
  onLogTrade,
  onDeleteTrade,
  onNavigateToStayExit,
  snapshotDate,
}) => {
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [tradeNotes, setTradeNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Conversational input state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: 'agent' | 'user'; text: string; time: string }[]>([
    {
      sender: 'agent',
      text: `Good morning! I am your Trade Execution Agent. Have any of today's suggested trades for ${snapshotDate} been placed? Please specify the Trade Rank (e.g. Rank #1, #2, #3...) below. Whenever a trade is placed, I will automatically generate its complete execution details strictly on the basis of 10 contracts bought and/or sold.`,
      time: '8:00 AM',
    },
  ]);

  const selectedCandidate = candidates[selectedRank - 1] || candidates[0];

  // Sizing calculations for 10 contracts
  const CONTRACTS = 10;
  const netDebitPerShare = customPrice && !isNaN(parseFloat(customPrice)) 
    ? parseFloat(customPrice) 
    : (selectedCandidate ? selectedCandidate.EstNetDebit : 2.50);
  
  const totalOutlay = netDebitPerShare * 100 * CONTRACTS;
  const isSpread = selectedCandidate?.Strategy === 'Bull Call Spread';
  const longStrike = selectedCandidate ? selectedCandidate.LongStrike : 0;
  const shortStrike = selectedCandidate ? selectedCandidate.ShortStrike : null;
  
  const maxSpreadValue = isSpread && shortStrike ? (shortStrike - longStrike) * 100 * CONTRACTS : 0;
  const maxProfitTotal = isSpread && shortStrike ? Math.max(0, maxSpreadValue - totalOutlay) : totalOutlay * 1.5;
  const maxProfitPct = totalOutlay > 0 ? (maxProfitTotal / totalOutlay) * 100 : 0;
  const breakeven = longStrike + netDebitPerShare;
  const stockStopLoss = selectedCandidate ? selectedCandidate.StockPrice * 0.97 : 0;
  const stockProfitTarget = selectedCandidate ? selectedCandidate.StockPrice * 1.06 : 0;
  const optionTargetDollar = totalOutlay * 0.50; // +50%
  const optionStopDollar = totalOutlay * 0.40; // -40%

  const handleConfirmLog = async () => {
    if (!selectedCandidate) return;
    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const fill = customPrice ? parseFloat(customPrice) : undefined;
      const success = await onLogTrade(selectedRank, fill, tradeNotes);
      if (success) {
        setFeedbackMsg({
          type: 'success',
          text: `Logged Trade Rank #${selectedRank} (${selectedCandidate.Ticker}) on the basis of 10 contracts ($${totalOutlay.toLocaleString('en-US', { minimumFractionDigits: 2 })} total outlay).`,
        });
        setTradeNotes('');
        setCustomPrice('');
        
        // Append to agent chat
        setChatMessages(prev => [
          ...prev,
          {
            sender: 'user',
            text: `I placed Trade Rank #${selectedRank} (${selectedCandidate.Ticker}).`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
          {
            sender: 'agent',
            text: `Confirmed! I have logged Rank #${selectedRank} (${selectedCandidate.Ticker} ${selectedCandidate.Strategy}) on the basis of exactly 10 contracts. Total capital outlay: $${totalOutlay.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Stop-loss established at $${stockStopLoss.toFixed(2)} (-3.0%) and +50% profit target at +$${optionTargetDollar.toFixed(2)}. The Stay/Exit Determination Agent is now actively tracking this position.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      } else {
        setFeedbackMsg({ type: 'error', text: 'Failed to log trade. Please check server.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error logging trade' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput('');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: timeNow }]);

    // Parse rank number from user message (e.g. "#1", "rank 2", "trade 3", "1")
    const match = userText.match(/(?:rank|trade|#|\b)\s*(\d{1,2})\b/i);
    if (match && match[1]) {
      const parsedRank = parseInt(match[1], 10);
      if (parsedRank >= 1 && parsedRank <= candidates.length) {
        setSelectedRank(parsedRank);
        const cand = candidates[parsedRank - 1];
        const candOutlay = cand.EstNetDebit * 100 * 10;
        
        // Auto log or prompt
        const success = await onLogTrade(parsedRank, undefined, `Logged via agent message: "${userText}"`);
        if (success) {
          setChatMessages(prev => [
            ...prev,
            {
              sender: 'agent',
              text: `Understood! I recognized Trade Rank #${parsedRank} (${cand.Ticker} - ${cand.Strategy}). I have generated the trade details for 10 contracts with total net debit of $${candOutlay.toLocaleString('en-US', { minimumFractionDigits: 2 })}. Position is now active and being tracked by the Stay/Exit Determination Agent.`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
        return;
      }
    }

    // Default conversational response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'agent',
          text: `I received your message. To log a trade execution on the standard 10-contract basis, please specify the Trade Rank number (e.g. "I placed Rank #1" or "Trade 2 placed") or use the interactive rank selector on the left.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 500);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Trade Execution Agent</h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Section 1 • 10-Contract Basis
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                Asks and verifies if any suggested trades for the day have been placed (by Trade Rank). Sizing is strictly computed on the basis of <strong>10 contracts bought and/or sold</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-goto-stay-exit"
              onClick={onNavigateToStayExit}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2"
            >
              <span>View Stay/Exit Monitor</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive 10-Contract Trade Entry */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Log Placed Trade (10 Contracts)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Select the Trade Rank from today's quantitative scan</p>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700">
                10x Fixed Lot Size
              </span>
            </div>

            {/* Quick Rank Selector Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Placed Trade by Rank:
              </label>
              <div className="flex flex-wrap gap-2">
                {candidates.slice(0, 8).map((c, idx) => {
                  const rankNum = idx + 1;
                  const isSelected = selectedRank === rankNum;
                  const isAlreadyPlaced = placedTrades.some(t => t.tradeRank === rankNum && t.status === 'OPEN');
                  return (
                    <button
                      key={c.Ticker}
                      id={`btn-rank-chip-${rankNum}`}
                      onClick={() => setSelectedRank(rankNum)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                          : isAlreadyPlaced
                          ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <span>Rank #{rankNum}</span>
                      <span className="font-mono">{c.Ticker}</span>
                      {isAlreadyPlaced && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Trade Specifications Card */}
            {selectedCandidate && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Rank #{selectedRank}
                      </span>
                      <span className="text-lg font-black text-white font-mono">{selectedCandidate.Ticker}</span>
                      <span className="text-xs text-slate-400">{selectedCandidate.CompanyName}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Stock Price: <span className="font-mono font-semibold text-slate-200">${selectedCandidate.StockPrice.toFixed(2)}</span> • Strategy: <span className="text-emerald-400 font-semibold">{selectedCandidate.Strategy}</span> ({selectedCandidate.TargetDTE} DTE)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Quantitative Score</span>
                    <div className="text-lg font-mono font-black text-emerald-400">{selectedCandidate.TotalScore}/100</div>
                  </div>
                </div>

                {/* 10-Contract Structure Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Long Leg</span>
                    <span className="text-xs font-mono font-bold text-white">BUY 10x {selectedCandidate.FormattedLongStrike}C</span>
                    <span className="text-[10px] text-emerald-400 block font-mono">~{selectedCandidate.LongDelta}Δ</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Short Leg</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {selectedCandidate.ShortStrike ? `SELL 10x ${selectedCandidate.FormattedShortStrike}C` : 'None (Straight)'}
                    </span>
                    <span className="text-[10px] text-cyan-400 block font-mono">
                      {selectedCandidate.ShortDelta ? `~${selectedCandidate.ShortDelta}Δ` : '100% Delta'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Total 10x Outlay</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${totalOutlay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">${netDebitPerShare.toFixed(2)}/share</span>
                  </div>

                  <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Max Profit</span>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {isSpread ? `$${maxProfitTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })} (+${maxProfitPct.toFixed(0)}%)` : 'Unlimited'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">Breakeven: ${breakeven.toFixed(2)}</span>
                  </div>
                </div>

                {/* Risk Guidelines for the 10 contracts */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Stop-Loss (-3% Stock): <strong className="text-rose-300 font-mono">${stockStopLoss.toFixed(2)}</strong> (Max Risk: -${optionStopDollar.toFixed(0)})</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Profit Target (+6% Stock): <strong className="text-emerald-300 font-mono">${stockProfitTarget.toFixed(2)}</strong> (Target Gain: +${optionTargetDollar.toFixed(0)})</span>
                  </div>
                </div>

                {/* Optional Custom Fill Price & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Actual Fill Net Debit / Share (Optional):
                    </label>
                    <input
                      id="input-actual-fill-price"
                      type="number"
                      step="0.01"
                      placeholder={`Default: $${selectedCandidate.EstNetDebit.toFixed(2)}`}
                      value={customPrice}
                      onChange={e => setCustomPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Broker / Execution Notes (Optional):
                    </label>
                    <input
                      id="input-trade-notes"
                      type="text"
                      placeholder="e.g. Filled via IBKR at market open"
                      value={tradeNotes}
                      onChange={e => setTradeNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Position will be automatically handed over to the Stay/Exit Engine.</span>
                  </div>

                  <button
                    id="btn-confirm-log-trade"
                    onClick={handleConfirmLog}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Placed Trade (10 Contracts)</span>
                  </button>
                </div>

                {feedbackMsg && (
                  <div className={`p-3 rounded-lg text-xs font-medium ${
                    feedbackMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}>
                    {feedbackMsg.text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Conversational Agent Dialogue */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="text-xs font-bold text-white">Execution Dialogue Agent</span>
              </div>
              <span className="text-[11px] text-slate-400">Natural Language Trade Intake</span>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[90%] p-3 rounded-xl ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-medium'
                      : 'bg-slate-950 border border-slate-800 text-slate-200'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                    <span className={`text-[9px] block mt-1 ${msg.sender === 'user' ? 'text-slate-800 text-right' : 'text-slate-500'}`}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Chat Form */}
            <form onSubmit={handleSendChat} className="pt-3 border-t border-slate-800 flex gap-2">
              <input
                id="input-agent-chat"
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type e.g. 'I placed Rank #1' or 'Logged Trade 3'..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                id="btn-send-agent-chat"
                type="submit"
                className="p-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Section: Active Entered Positions (10-Contract units) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Active Entered Trades ({placedTrades.length} Positions • 10-Contract Basis)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These positions are monitored daily by the Stay/Exit Determination Agent.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span>Total Capital Deployed:</span>
            <strong className="text-emerald-400 font-bold">
              ${placedTrades.reduce((sum, t) => sum + (t.status === 'OPEN' ? t.totalNetDebit : 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {placedTrades.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>No trades have been logged yet for today.</p>
            <p className="text-slate-500 mt-1">Select a Trade Rank above or use the chat agent to record your 10-contract positions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Trade Rank</th>
                  <th className="py-2.5 px-3">Ticker / Strategy</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Long / Short Strikes</th>
                  <th className="py-2.5 px-3">Entry Net Debit</th>
                  <th className="py-2.5 px-3">Total 10x Outlay</th>
                  <th className="py-2.5 px-3">Entry Stock Price</th>
                  <th className="py-2.5 px-3">Risk Boundaries</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {placedTrades.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3">
                      <span className="font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]">
                        Rank #{t.tradeRank}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-sm">{t.ticker}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{t.strategy}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        10 Contracts
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-white">${t.longStrike} Call ({t.longDelta}Δ)</div>
                      <div className="text-slate-400 text-[10px]">
                        {t.shortStrike ? `Short $${t.shortStrike} Call (${t.shortDelta || 0.30}Δ)` : 'Straight Call'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      ${t.actualNetDebitPerShare.toFixed(2)}/sh
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      ${t.totalNetDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      ${t.entryStockPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 font-sans text-[11px]">
                      <div className="text-rose-400">Stop: ${t.stockStopLossPrice.toFixed(2)} (-3%)</div>
                      <div className="text-emerald-400">Target: ${t.stockProfitTargetPrice.toFixed(2)} (+6%)</div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        t.status === 'OPEN'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        id={`btn-delete-trade-${t.id}`}
                        onClick={() => onDeleteTrade(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Remove position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
