export interface OptionCandidate {
  Ticker: string;
  CompanyName?: string;
  Sector?: string;
  TotalScore: number;
  StockPrice: number;
  FormattedStockPrice: string;
  Strategy: 'Straight Call' | 'Bull Call Spread';
  TargetDTE: number;
  TargetExpiration: string;
  LongStrike: number;
  FormattedLongStrike: string;
  LongDelta: number;
  ShortStrike: number | null;
  FormattedShortStrike: string;
  ShortDelta: number | null;
  EstNetDebit: number;
  FormattedEstNetDebit: string;
  MaxProfitPotential: string;
  MaxProfitValue?: number;
  RSI: number;
  SpreadPct: number;
  FormattedSpreadPct: string;
  OpenInterest: number;
  SMA20: number;
  SMA50: number;
  SMA200: number;
  Return20d: number;
  IV: number;
  ScoreBreakdown: {
    priceAboveSMA20: boolean; // +15
    priceAboveSMA50: boolean; // +15
    priceAboveSMA200: boolean; // +10
    rsiInTargetRange: boolean; // 50-70 -> +15
    highOpenInterest: boolean; // >= 2500 -> +15
    tightSpread: boolean; // <= 2% -> +15
    positive20dReturn: boolean; // >0% -> +15
  };
  PassingFilters: {
    priceMin20: boolean;
    oiMin500: boolean;
    spreadMax5: boolean;
    validOptionsChain: boolean;
  };
}

export interface UniverseItem {
  symbol: string;
  name: string;
  sector: string;
  isMegacap?: boolean;
}

export interface DriveSaveResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  folderId?: string;
  webViewLink?: string;
  serviceAccountEmail?: string;
  message: string;
  timestamp: string;
  simulated?: boolean;
}

export interface ScanProgress {
  status: 'idle' | 'scanning' | 'scoring' | 'generating_briefing' | 'completed' | 'error';
  currentTicker: string;
  currentName?: string;
  currentIndex: number;
  totalTickers: number;
  passedCount: number;
  failedCount: number;
  message: string;
  driveSaveResult?: DriveSaveResult | null;
}

export interface PlacedTrade {
  id: string;
  tradeRank: number;
  ticker: string;
  companyName: string;
  sector?: string;
  strategy: 'Straight Call' | 'Bull Call Spread';
  contractsCount: number; // Always 10
  entryDate: string; // YYYY-MM-DD
  entryTime: string;
  entryStockPrice: number;
  targetExpiration: string;
  targetDTE: number;
  longStrike: number;
  longDelta: number;
  shortStrike: number | null;
  shortDelta: number | null;
  estNetDebitPerShare: number;
  actualNetDebitPerShare: number;
  totalNetDebit: number; // actualNetDebitPerShare * 100 * 10
  maxRisk: number; // totalNetDebit
  maxProfit: number; // for spreads: ((shortStrike - longStrike) * 100 * 10) - totalNetDebit; for calls: estimated target
  breakevenPrice: number;
  stockStopLossPrice: number; // -3% underlying stop
  stockProfitTargetPrice: number; // +6% underlying target
  optionsProfitTargetDollar: number; // +50% ROI dollar value
  optionsStopLossDollar: number; // -40% risk limit
  executionDetails: string;
  status: 'OPEN' | 'CLOSED';
  closedDate?: string;
  closedPricePerShare?: number;
  closedTotalPnL?: number;
  closedPnLPct?: number;
  notes?: string;
  loggedVia: 'agent_prompt' | 'rank_selection' | 'quick_trigger' | 'manual';
}

export interface TradeEvaluation {
  tradeId: string;
  tradeRank: number;
  ticker: string;
  companyName: string;
  strategy: 'Straight Call' | 'Bull Call Spread';
  contractsCount: number; // Always 10
  entryDate: string;
  entryStockPrice: number;
  currentStockPrice: number;
  stockPriceChangePct: number;
  entryNetDebitTotal: number; // 10 contracts initial outlay
  currentEstimatedPositionValueTotal: number; // 10 contracts current mark
  unrealizedPnLDollar: number;
  unrealizedPnLPct: number;
  daysInTrade: number;
  remainingDTE: number;
  targetExpiration: string;
  longStrike: number;
  shortStrike: number | null;
  determination: 'STAY' | 'EXIT';
  subVerdict: 
    | 'STAY - ON TRACK'
    | 'STAY - PULLBACK HOLD'
    | 'EXIT - PROFIT TARGET HIT'
    | 'EXIT - STOP LOSS TRIGGERED'
    | 'EXIT - THETA TIME DECAY'
    | 'EXIT - TREND REVERSAL';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  rationale: string;
  recommendedAction: string;
  keyMetrics: {
    deltaStatus: string;
    thetaStatus: string;
    stopDistancePct: number;
    targetDistancePct: number;
    currentIv: number;
  };
  evaluatedAt: string;
}

export interface DailyDatasetInfo {
  date: string;
  timestamp: string;
  isScheduleSnapshot: boolean;
  scheduleDescription: string;
  nextScheduledRun: string;
  timezone: string;
  candidatesCount: number;
  topRankedTicker: string;
  loadedFromCache: boolean;
}

export interface AgentChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  suggestedRanks?: number[];
  loggedTrade?: PlacedTrade;
  evaluation?: TradeEvaluation;
}

export interface PipelineSettings {
  minStockPrice: number;
  minDTE: number;
  maxDTE: number;
  minOpenInterest: number;
  maxSpreadPct: number;
  targetLongDelta: number;
  targetShortDelta: number;
  riskFreeRate: number;
  stopLossPct: number;
  profitTargetPct: number;
  universeType: 'sp500' | 'megacaps' | 'tech' | 'energy' | 'financials' | 'custom';
  customTickers: string[];
}

export interface PlacedTrade {
  id: string;
  rankNumber: number; // Rank number from the suggestion report
  ticker: string;
  companyName: string;
  strategy: 'Straight Call' | 'Bull Call Spread';
  entryDate: string; // ISO date string or formatted date
  entryStockPrice: number;
  entryNetDebit: number; // Option debit per share ($)
  contracts: number; // Number of contracts (1 contract = 100 shares)
  targetDTE: number;
  targetExpiration: string;
  longStrike: number;
  longDelta: number;
  shortStrike: number | null;
  shortDelta: number | null;
  stopLossStockPrice: number; // -3% stop level
  profitTargetStockPrice: number; // +6% target level
  status: 'ACTIVE' | 'CLOSED_PROFIT' | 'CLOSED_STOP' | 'CLOSED_MANUAL' | 'EXPIRED';
  closedDate?: string;
  closedStockPrice?: number;
  closedNetCredit?: number;
  notes?: string;
}

export interface StayExitDecision {
  tradeId: string;
  rankNumber: number;
  ticker: string;
  companyName: string;
  strategy: 'Straight Call' | 'Bull Call Spread';
  decision: 'STAY' | 'EXIT';
  urgency: 'NORMAL' | 'HIGH' | 'CRITICAL';
  statusBadge: string; // e.g. "EXIT: +6.4% Target Reached" or "STAY: Bullish Trend Intact"
  reasonCategory: 
    | 'PROFIT_TARGET_HIT'
    | 'STOP_LOSS_HIT'
    | 'THETA_DTE_EXHAUSTION'
    | 'MOMENTUM_BREAKDOWN'
    | 'THESIS_HEALTHY'
    | 'EARNINGS_RISK';
  headline: string;
  detailedAnalysis: string;
  entryStockPrice: number;
  currentStockPrice: number;
  stockChangePct: number;
  entryNetDebit: number;
  estimatedCurrentOptionValue: number;
  estimatedPnLPct: number;
  estimatedPnLDollars: number;
  contracts: number;
  daysHeld: number;
  remainingDTE: number;
  suggestedAction: string;
  evaluatedAt: string;
}

export interface AgentChatMessage {
  id: string;
  sender: 'agent' | 'user' | 'system';
  text: string;
  timestamp: string;
  suggestedRanks?: number[];
  ingestedTrades?: PlacedTrade[];
}

export interface EmailDispatchResult {
  success: boolean;
  message: string;
  recipient: string;
  subject: string;
  hasAttachment: boolean;
  attachmentName: string;
  timestamp: string;
  simulated?: boolean;
  messageId?: string;
}

export interface SchedulerInfo {
  enabled: boolean;
  scheduledTimeStr: string;
  targetHourUTC: number;
  targetMinuteUTC: number;
  lastRunDate: string | null;
  lastRunTimestamp: string | null;
  lastRunSuccess: boolean;
  lastRunMessage: string;
  nextRunEstimated: string;
  lastEmailResult: EmailDispatchResult | null;
  lastDriveResult: DriveSaveResult | null;
  isExecutingNow: boolean;
  centralTime: string;
  centralDate: string;
  isWeekday: boolean;
}


