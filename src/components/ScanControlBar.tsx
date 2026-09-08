import React from 'react';
import { Search, Filter, Layers, Target, Shield, CheckCircle2 } from 'lucide-react';

interface ScanControlBarProps {
  universeType: string;
  setUniverseType: (val: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  strategyFilter: string;
  setStrategyFilter: (strat: string) => void;
  minScoreFilter: number;
  setMinScoreFilter: (score: number) => void;
  totalFound: number;
  onCustomTickerSubmit?: (ticker: string) => void;
}

export const ScanControlBar: React.FC<ScanControlBarProps> = ({
  universeType,
  setUniverseType,
  searchQuery,
  setSearchQuery,
  strategyFilter,
  setStrategyFilter,
  minScoreFilter,
  setMinScoreFilter,
  totalFound,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Universe Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-thin">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Universe:
          </span>
          {[
            { id: 'sp500', label: 'S&P 500 & ETFs' },
            { id: 'megacaps', label: 'Megacap Leaders' },
            { id: 'tech', label: 'Technology / Growth' },
            { id: 'financials', label: 'Financials' },
            { id: 'energy', label: 'Energy' },
          ].map(tab => (
            <button
              key={tab.id}
              id={`universe-tab-${tab.id}`}
              onClick={() => setUniverseType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                universeType === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-ticker"
              type="text"
              placeholder="Search ticker or name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Strategy Filter */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              id="filter-strat-all"
              onClick={() => setStrategyFilter('ALL')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                strategyFilter === 'ALL'
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Strategies
            </button>
            <button
              id="filter-strat-calls"
              onClick={() => setStrategyFilter('Straight Call')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                strategyFilter === 'Straight Call'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Calls
            </button>
            <button
              id="filter-strat-spreads"
              onClick={() => setStrategyFilter('Bull Call Spread')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                strategyFilter === 'Bull Call Spread'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Spreads
            </button>
          </div>

          {/* Min Score Filter */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Min Score:</span>
            <select
              id="select-min-score"
              value={minScoreFilter}
              onChange={e => setMinScoreFilter(Number(e.target.value))}
              className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="0" className="bg-slate-900 text-slate-200">Any Score</option>
              <option value="60" className="bg-slate-900 text-slate-200">≥ 60</option>
              <option value="75" className="bg-slate-900 text-slate-200">≥ 75</option>
              <option value="85" className="bg-slate-900 text-slate-200">≥ 85 (High Conviction)</option>
              <option value="90" className="bg-slate-900 text-slate-200">≥ 90 (Elite Top Tier)</option>
            </select>
          </div>
        </div>

      </div>

      {/* Hard Filter Badges Display */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Quantitative Hard Filters Active:
          </span>
          <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Price ≥ $20
          </span>
          <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Target 45–60 DTE
          </span>
          <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Open Interest ≥ 500
          </span>
          <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Spread ≤ 5.0%
          </span>
        </div>
        <div className="text-slate-400 text-xs">
          Showing <span className="font-bold text-emerald-400">{totalFound}</span> qualifying setups
        </div>
      </div>
    </div>
  );
};
