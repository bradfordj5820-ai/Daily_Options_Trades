import React from 'react';
import { X, TrendingUp, ShieldAlert, Target, Info, Check, ArrowUpRight, DollarSign } from 'lucide-react';
import { OptionCandidate } from '../types.ts';

interface PayoffModalProps {
  candidate: OptionCandidate | null;
  onClose: () => void;
}

export const PayoffModal: React.FC<PayoffModalProps> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  const {
    Ticker,
    CompanyName,
    StockPrice,
    Strategy,
    TargetDTE,
    TargetExpiration,
    LongStrike,
    ShortStrike,
    EstNetDebit,
    MaxProfitPotential,
    RSI,
    SpreadPct,
    OpenInterest,
    SMA20,
    SMA50,
    SMA200,
    Return20d,
    TotalScore,
    ScoreBreakdown,
  } = candidate;

  // Calculate Payoff Curve Points
  const longK = LongStrike;
  const shortK = ShortStrike || longK * 1.15;
  const debit = EstNetDebit;
  const breakeven = longK + debit;

  const minX = Math.max(1, Math.round(longK * 0.85));
  const maxX = Math.round((ShortStrike || longK * 1.25) * 1.15);
  const step = (maxX - minX) / 100;

  const points: { price: number; pl: number }[] = [];
  let maxPL = 0;
  let minPL = -debit * 100;

  for (let p = minX; p <= maxX; p += step) {
    let plPerShare = 0;
    if (Strategy === 'Straight Call') {
      const longVal = Math.max(0, p - longK);
      plPerShare = longVal - debit;
    } else {
      const longVal = Math.max(0, p - longK);
      const shortVal = Math.max(0, p - shortK);
      plPerShare = (longVal - shortVal) - debit;
    }

    const totalPL = plPerShare * 100;
    points.push({ price: p, pl: totalPL });
    if (totalPL > maxPL) maxPL = totalPL;
    if (totalPL < minPL) minPL = totalPL;
  }

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };

  const effectiveMaxPL = Math.max(maxPL, debit * 100 * 1.5, 100);
  const effectiveMinPL = Math.min(minPL, -debit * 100);

  const scaleX = (val: number) =>
    padding.left + ((val - minX) / (maxX - minX)) * (svgWidth - padding.left - padding.right);

  const scaleY = (val: number) =>
    padding.top +
    ((effectiveMaxPL - val) / (effectiveMaxPL - effectiveMinPL)) *
      (svgHeight - padding.top - padding.bottom);

  const zeroY = scaleY(0);

  // Generate SVG path
  const pathD = points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(pt.price).toFixed(1)} ${scaleY(pt.pl).toFixed(1)}`)
    .join(' ');

  const areaGreenD = `${pathD} L ${scaleX(maxX)} ${zeroY} L ${scaleX(breakeven)} ${zeroY} Z`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-lg">
              {Ticker}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{Ticker} Options Strategy Payoff</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  Strategy === 'Straight Call'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {Strategy}
                </span>
              </div>
              <p className="text-xs text-slate-400">{CompanyName} • Current Price: <span className="text-white font-semibold">${StockPrice.toFixed(2)}</span></p>
            </div>
          </div>

          <button
            id="btn-close-payoff-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Key Strategy Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Est. Net Debit / Risk</span>
              <span className="text-base font-bold text-rose-400">${EstNetDebit.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block">(${(EstNetDebit * 100).toFixed(0)} max loss/ctr)</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Breakeven Stock Price</span>
              <span className="text-base font-bold text-amber-300">${breakeven.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500 block">
                {(((breakeven - StockPrice) / StockPrice) * 100).toFixed(1)}% from current
              </span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Max Profit Potential</span>
              <span className="text-base font-bold text-emerald-400">{MaxProfitPotential}</span>
              <span className="text-[10px] text-slate-500 block">At expiration</span>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">Target Horizon</span>
              <span className="text-base font-bold text-cyan-300">{TargetDTE} DTE</span>
              <span className="text-[10px] text-slate-500 block">{TargetExpiration}</span>
            </div>
          </div>

          {/* 10-Contract Standard Lot Sizing Projection */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-cyan-950/40 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                10x
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">10-Contract Lot Standard Basis</span>
                <span className="text-[11px] text-slate-400">Total Net Premium Outlay: <strong className="text-white">${(EstNetDebit * 1000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">+50% Target ROI</span>
                <span className="text-emerald-400 font-bold">+${(EstNetDebit * 1000 * 0.5).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">-3% Stock Stop</span>
                <span className="text-rose-400 font-bold">-$${(EstNetDebit * 1000 * 0.35).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Payoff Chart Canvas */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Expiration P/L Payoff Diagram (1 Contract = 100 Shares)
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Profit Zone
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> Max Loss Zone
                </span>
              </div>
            </div>

            {/* SVG Visualizer */}
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto text-xs font-mono">
                {/* Zero line */}
                <line
                  x1={padding.left}
                  y1={zeroY}
                  x2={svgWidth - padding.right}
                  y2={zeroY}
                  stroke="#475569"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                
                {/* Breakeven line */}
                <line
                  x1={scaleX(breakeven)}
                  y1={padding.top}
                  x2={scaleX(breakeven)}
                  y2={svgHeight - padding.bottom}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={scaleX(breakeven)}
                  y={padding.top + 10}
                  fill="#fbbf24"
                  fontSize="10"
                  textAnchor="middle"
                >
                  B/E ${breakeven.toFixed(1)}
                </text>

                {/* Current Price Line */}
                <line
                  x1={scaleX(StockPrice)}
                  y1={padding.top}
                  x2={scaleX(StockPrice)}
                  y2={svgHeight - padding.bottom}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={scaleX(StockPrice)}
                  y={svgHeight - padding.bottom + 25}
                  fill="#38bdf8"
                  fontSize="10"
                  textAnchor="middle"
                >
                  Current ${StockPrice.toFixed(1)}
                </text>

                {/* Payoff Curve */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Y Axis Labels */}
                <text x={padding.left - 8} y={padding.top + 5} fill="#94a3b8" fontSize="10" textAnchor="end">
                  +${effectiveMaxPL.toFixed(0)}
                </text>
                <text x={padding.left - 8} y={zeroY + 3} fill="#94a3b8" fontSize="10" textAnchor="end">
                  $0
                </text>
                <text x={padding.left - 8} y={svgHeight - padding.bottom} fill="#f43f5e" fontSize="10" textAnchor="end">
                  -${(debit * 100).toFixed(0)}
                </text>

                {/* X Axis Range */}
                <text x={scaleX(minX)} y={svgHeight - padding.bottom + 14} fill="#64748b" fontSize="10">
                  ${minX}
                </text>
                <text x={scaleX(maxX)} y={svgHeight - padding.bottom + 14} fill="#64748b" fontSize="10" textAnchor="end">
                  ${maxX}
                </text>
              </svg>
            </div>
          </div>

          {/* Quantitative 100-Point Score Breakdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-400" />
                100-Point Quantitative Scoring Breakdown ({TotalScore}/100)
              </h4>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {TotalScore >= 85 ? 'High Conviction Setup' : 'Qualifying Candidate'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                ScoreBreakdown.priceAboveSMA20
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>Price &gt; 20-Day SMA (${SMA20})</span>
                <span className="font-bold">{ScoreBreakdown.priceAboveSMA20 ? '+15 pts' : '0 pts'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                ScoreBreakdown.priceAboveSMA50
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>Price &gt; 50-Day SMA (${SMA50})</span>
                <span className="font-bold">{ScoreBreakdown.priceAboveSMA50 ? '+15 pts' : '0 pts'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                ScoreBreakdown.priceAboveSMA200
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>Price &gt; 200-Day SMA (${SMA200})</span>
                <span className="font-bold">{ScoreBreakdown.priceAboveSMA200 ? '+10 pts' : '0 pts'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                ScoreBreakdown.rsiInTargetRange
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>RSI in 50–70 Bullish Zone ({RSI})</span>
                <span className="font-bold">{ScoreBreakdown.rsiInTargetRange ? '+15 pts' : '0 pts'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                ScoreBreakdown.highOpenInterest
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>High Liquidity (OI {OpenInterest.toLocaleString()} ≥ 2500)</span>
                <span className="font-bold">{ScoreBreakdown.highOpenInterest ? '+15 pts' : '0 pts'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center justify-between ${
                ScoreBreakdown.tightSpread
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>Ultra-Tight Spread ({SpreadPct}% ≤ 2.0%)</span>
                <span className="font-bold">{ScoreBreakdown.tightSpread ? '+15 pts' : '0 pts'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center justify-between sm:col-span-2 ${
                ScoreBreakdown.positive20dReturn
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>Positive 20-Day Momentum Return (+{Return20d}%)</span>
                <span className="font-bold">{ScoreBreakdown.positive20dReturn ? '+15 pts' : '0 pts'}</span>
              </div>
            </div>
          </div>

          {/* Trade Management Rules Box */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <h5 className="font-bold text-slate-200">Recommended Institutional Trade Management:</h5>
              <p className="text-slate-400">
                • <strong className="text-rose-400">Stop Loss:</strong> Set underlying stock stop at <strong className="text-slate-200">${(StockPrice * 0.97).toFixed(2)}</strong> (-3.0%).
              </p>
              <p className="text-slate-400">
                • <strong className="text-emerald-400">Take Profit:</strong> Target underlying stock move to <strong className="text-slate-200">${(StockPrice * 1.06).toFixed(2)}</strong> (+6.0%) or +50% to +75% premium return.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
