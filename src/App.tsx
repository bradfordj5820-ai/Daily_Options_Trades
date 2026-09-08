import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { ScanControlBar } from './components/ScanControlBar.tsx';
import { CandidatesTable } from './components/CandidatesTable.tsx';
import { PayoffModal } from './components/PayoffModal.tsx';
import { ExecutiveBriefingView } from './components/ExecutiveBriefingView.tsx';
import { AutomationModal } from './components/AutomationModal.tsx';
import { TradeExecutionAgentView } from './components/TradeExecutionAgentView.tsx';
import { StayExitAgentView } from './components/StayExitAgentView.tsx';
import { OptionCandidate, PlacedTrade, TradeEvaluation, DailyDatasetInfo } from './types.ts';
import { 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  ArrowUpRight, 
  Flame, 
  Target, 
  Zap, 
  Award,
  Bot,
  Calendar,
  Layers
} from 'lucide-react';

export default function App() {
  const [candidates, setCandidates] = useState<OptionCandidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<OptionCandidate[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [snapshotDate, setSnapshotDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Placed Trades (Section 1) & Evaluations (Section 2)
  const [placedTrades, setPlacedTrades] = useState<PlacedTrade[]>([]);
  const [evaluations, setEvaluations] = useState<TradeEvaluation[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalOutlay: 0,
    totalCurrentVal: 0,
    totalUnrealizedPnL: 0,
    totalUnrealizedPct: 0,
    stayCount: 0,
    exitCount: 0,
  });
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);

  // Tab state: 'scanner' | 'trade-execution' | 'stay-exit' | 'briefing'
  const [activeTab, setActiveTab] = useState<'scanner' | 'trade-execution' | 'stay-exit' | 'briefing'>('scanner');
  
  // Modals
  const [selectedCandidate, setSelectedCandidate] = useState<OptionCandidate | null>(null);
  const [isAutomationOpen, setIsAutomationOpen] = useState(false);

  // Filters
  const [universeType, setUniverseType] = useState<string>('sp500');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [strategyFilter, setStrategyFilter] = useState<string>('ALL');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  // Loading states
  const [isScanning, setIsScanning] = useState(false);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [briefing, setBriefing] = useState<{ content: string; generatedAt: string; totalCandidatesAnalyzed: number } | null>(null);

  // 1. Initial Load: Fetch Saved Daily Dataset (Delta Access requirement)
  useEffect(() => {
    loadDailySavedDataset();
    fetchPlacedTrades();
    fetchEvaluations();
  }, []);

  const loadDailySavedDataset = async () => {
    try {
      const res = await fetch('/api/daily-dataset');
      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
        setSnapshotDate(data.date || new Date().toISOString().split('T')[0]);
        setLastUpdated(data.timestamp || new Date().toISOString());
        if (data.briefing) {
          setBriefing(data.briefing);
        }
      } else {
        // Fallback to fetch candidates / initial scan if no daily dataset exists
        fetchCandidates();
      }
    } catch (err) {
      console.error('Fetch daily-dataset error:', err);
      fetchCandidates();
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await fetch('/api/candidates');
      const data = await res.json();
      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
        setLastUpdated(data.timestamp || new Date().toISOString());
      } else {
        // Trigger initial scan if cache is empty
        handleScan('sp500');
      }
    } catch (err) {
      console.error('Fetch candidates error:', err);
    }
  };

  const fetchPlacedTrades = async () => {
    try {
      const res = await fetch('/api/placed-trades');
      const data = await res.json();
      if (data.trades) {
        setPlacedTrades(data.trades);
      }
    } catch (err) {
      console.error('Fetch placed trades error:', err);
    }
  };

  const fetchEvaluations = async () => {
    setIsLoadingEvaluations(true);
    try {
      const res = await fetch('/api/stay-exit-evaluations');
      const data = await res.json();
      if (data.evaluations) {
        setEvaluations(data.evaluations);
      }
      if (data.summary) {
        setPortfolioSummary(data.summary);
      }
    } catch (err) {
      console.error('Fetch evaluations error:', err);
    } finally {
      setIsLoadingEvaluations(false);
    }
  };

  const fetchBriefing = async () => {
    try {
      const res = await fetch('/api/briefing');
      const data = await res.json();
      if (data.briefing) {
        setBriefing(data.briefing);
      }
    } catch (err) {
      console.error('Fetch briefing error:', err);
    }
  };

  // Run Scan (Manual trigger preserved)
  const handleScan = async (selectedUniverse: string = universeType) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          universeType: selectedUniverse,
          minScore: 0,
        }),
      });
      const data = await res.json();
      if (data.success && data.candidates) {
        setCandidates(data.candidates);
        setLastUpdated(data.timestamp || new Date().toISOString());
      }
    } catch (err) {
      console.error('Scan execution error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Section 1: Log Placed Trade (always 10 contracts)
  const handleLogTrade = async (tradeRank: number, customFillPrice?: number, notes?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/placed-trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeRank,
          actualNetDebitPerShare: customFillPrice,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success && data.trade) {
        await fetchPlacedTrades();
        await fetchEvaluations();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error logging placed trade:', err);
      return false;
    }
  };

  // Section 1: Delete / Remove Placed Trade
  const handleDeleteTrade = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/placed-trades/${tradeId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchPlacedTrades();
        await fetchEvaluations();
      }
    } catch (err) {
      console.error('Error deleting trade:', err);
    }
  };

  // Section 2: Close Position
  const handleClosePosition = async (tradeId: string) => {
    try {
      const res = await fetch(`/api/placed-trades/${tradeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CLOSED',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchPlacedTrades();
        await fetchEvaluations();
      }
    } catch (err) {
      console.error('Error closing position:', err);
    }
  };

  // Generate Executive AI Briefing
  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const res = await fetch('/api/generate-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidates: candidates.slice(0, 25),
        }),
      });
      const data = await res.json();
      if (data.success && data.briefing) {
        setBriefing(data.briefing);
      }
    } catch (err) {
      console.error('Generate briefing error:', err);
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  // Direct table jump to Trade Execution Agent
  const handleDirectLogFromTable = (rank: number) => {
    setActiveTab('trade-execution');
  };

  // Filter candidates based on user selections
  useEffect(() => {
    let result = [...candidates];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        c =>
          c.Ticker.toLowerCase().includes(q) ||
          (c.CompanyName && c.CompanyName.toLowerCase().includes(q)) ||
          (c.Sector && c.Sector.toLowerCase().includes(q))
      );
    }

    if (strategyFilter !== 'ALL') {
      result = result.filter(c => c.Strategy === strategyFilter);
    }

    if (minScoreFilter > 0) {
      result = result.filter(c => c.TotalScore >= minScoreFilter);
    }

    setFilteredCandidates(result);
  }, [candidates, searchQuery, strategyFilter, minScoreFilter]);

  // Highlight stats
  const topCandidate = candidates.length > 0 ? candidates[0] : null;
  const straightCallCount = candidates.filter(c => c.Strategy === 'Straight Call').length;
  const spreadCount = candidates.filter(c => c.Strategy === 'Bull Call Spread').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Navigation Header */}
      <Header
        candidates={candidates}
        placedTrades={placedTrades}
        lastUpdated={lastUpdated}
        snapshotDate={snapshotDate}
        isScanning={isScanning}
        onScan={() => handleScan(universeType)}
        onOpenAutomation={() => setIsAutomationOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Quick Highlights / Banner Bar (Visible on Scanner & Briefing) */}
        {(activeTab === 'scanner' || activeTab === 'briefing') && topCandidate && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Top Setup Card */}
            <div 
              onClick={() => setSelectedCandidate(topCandidate)}
              className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-4 cursor-pointer hover:border-emerald-500/50 transition group"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <Award className="w-3.5 h-3.5" />
                  #1 Highest Ranked Trade
                </span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm">{topCandidate.TotalScore}/100</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white">{topCandidate.Ticker}</span>
                <span className="text-xs text-slate-400 font-mono">${topCandidate.StockPrice.toFixed(2)}</span>
                <span className="text-[11px] font-semibold text-emerald-400 ml-auto">{topCandidate.Strategy}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Long {topCandidate.FormattedLongStrike}C ({topCandidate.LongDelta}Δ) • Net Debit: {topCandidate.FormattedEstNetDebit}
              </p>
            </div>

            {/* Total Screened Opportunities */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Passing Setups</span>
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-white">
                {candidates.length} <span className="text-xs text-slate-400 font-normal">candidates</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Passed Price ≥ $20, OI ≥ 500, Spread ≤ 5%
              </p>
            </div>

            {/* Strategy Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Strategy Distribution</span>
                <Target className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-white">
                <span className="text-emerald-400">{straightCallCount} Calls</span>
                <span className="text-slate-600">/</span>
                <span className="text-cyan-300">{spreadCount} Spreads</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Targeting 45–60 DTE Delta horizons
              </p>
            </div>

            {/* Placed 10-Contract Positions Status */}
            <div 
              onClick={() => setActiveTab('trade-execution')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 cursor-pointer hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>10-Contract Positions</span>
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <span className="text-emerald-400 font-mono">{placedTrades.filter(t => t.status === 'OPEN').length} Active</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300 font-mono font-normal text-xs">
                  ${portfolioSummary.totalOutlay.toLocaleString('en-US', { maximumFractionDigits: 0 })} Outlay
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 text-emerald-400">
                <span>Click to log / track trades →</span>
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Scanner Opportunities */}
        {activeTab === 'scanner' && (
          <div className="space-y-4">
            <ScanControlBar
              universeType={universeType}
              setUniverseType={setUniverseType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              strategyFilter={strategyFilter}
              setStrategyFilter={setStrategyFilter}
              minScoreFilter={minScoreFilter}
              setMinScoreFilter={setMinScoreFilter}
              totalFound={filteredCandidates.length}
            />

            <CandidatesTable
              candidates={filteredCandidates}
              onSelectCandidate={setSelectedCandidate}
              onLogTradeDirect={handleDirectLogFromTable}
            />
          </div>
        )}

        {/* Tab 2: Section 1 - Trade Execution Agent (10-Contract Logger) */}
        {activeTab === 'trade-execution' && (
          <TradeExecutionAgentView
            candidates={candidates}
            placedTrades={placedTrades}
            onLogTrade={handleLogTrade}
            onDeleteTrade={handleDeleteTrade}
            onNavigateToStayExit={() => setActiveTab('stay-exit')}
            snapshotDate={snapshotDate}
          />
        )}

        {/* Tab 3: Section 2 - Stay / Exit Determination Agent */}
        {activeTab === 'stay-exit' && (
          <StayExitAgentView
            evaluations={evaluations}
            summary={portfolioSummary}
            isLoading={isLoadingEvaluations}
            onRefreshEvaluations={fetchEvaluations}
            onClosePosition={handleClosePosition}
            onNavigateToExecutionAgent={() => setActiveTab('trade-execution')}
            snapshotDate={snapshotDate}
          />
        )}

        {/* Tab 4: AI Morning Briefing */}
        {activeTab === 'briefing' && (
          <ExecutiveBriefingView
            briefing={briefing}
            candidates={candidates}
            isGenerating={isGeneratingBriefing}
            onGenerateBriefing={handleGenerateBriefing}
          />
        )}

      </main>

      {/* Payoff Diagram Modal */}
      <PayoffModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />

      {/* Pipeline Automation Modal */}
      <AutomationModal
        isOpen={isAutomationOpen}
        onClose={() => setIsAutomationOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Daily Options Trades • Autonomous Pre-Market Quantitative Pipeline (8:00 AM CDT/CST Mon–Fri)</span>
          <span className="text-slate-600 font-mono text-[11px]">Delta Screened 45–60 DTE • 10-Contract Sizing • Stay/Exit Agent</span>
        </div>
      </footer>

    </div>
  );
}

