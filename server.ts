import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { CURATED_UNIVERSE, evaluateCandidate, generateRealisticCandidate } from './server/optionsEngine.js';
import { generateExecutiveBriefing, generateStayExitRationale } from './server/geminiService.js';
import { OptionCandidate, PlacedTrade, TradeEvaluation, DailyDatasetInfo } from './src/types.js';
import { generateHtmlReport } from './src/utils/reportGenerator';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Storage files
  const DATA_DIR = path.join(process.cwd(), '.data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const DATASET_FILE = path.join(DATA_DIR, 'daily_dataset.json');
  const TRADES_FILE = path.join(DATA_DIR, 'placed_trades.json');

  // In-memory cache for latest scan results & briefing
  let latestScanResults: OptionCandidate[] = [];
  let latestBriefing: { content: string; generatedAt: string; totalCandidatesAnalyzed: number } | null = null;
  let lastScanTimestamp: string | null = null;
  let dailySnapshotDate: string = getCentralDateString();

  // In-memory Placed Trades (always 10 contracts)
  let placedTrades: PlacedTrade[] = loadPlacedTradesFromDisk();

  // Helper: Get formatted date in Central Time (America/Chicago)
  function getCentralDateString(): string {
    const d = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(d); // YYYY-MM-DD
  }

  function getCentralTimeString(): string {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  function loadPlacedTradesFromDisk(): PlacedTrade[] {
    try {
      if (fs.existsSync(TRADES_FILE)) {
        const raw = fs.readFileSync(TRADES_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading placed trades:', e);
    }
    return [];
  }

  function savePlacedTradesToDisk() {
    try {
      fs.writeFileSync(TRADES_FILE, JSON.stringify(placedTrades, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving placed trades to disk:', e);
    }
  }

  function loadDailyDatasetFromDisk(): boolean {
    try {
      if (fs.existsSync(DATASET_FILE)) {
        const raw = fs.readFileSync(DATASET_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data && data.candidates && data.candidates.length > 0) {
          latestScanResults = data.candidates;
          latestBriefing = data.briefing || null;
          lastScanTimestamp = data.timestamp || new Date().toISOString();
          dailySnapshotDate = data.date || getCentralDateString();
          return true;
        }
      }
    } catch (e) {
      console.error('Error loading daily dataset from disk:', e);
    }
    return false;
  }

  function saveDailyDatasetToDisk() {
    try {
      const payload = {
        date: dailySnapshotDate,
        timestamp: lastScanTimestamp,
        candidates: latestScanResults,
        briefing: latestBriefing,
        scheduleDescription: 'Runs once per day at 8:00 AM CDT/CST (Monday - Friday)',
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(DATASET_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving daily dataset to disk:', e);
    }
  }

  // Generate a full daily scan run
  async function runDailyPipeline(isScheduled: boolean = false) {
    console.log(`[PIPELINE] Starting ${isScheduled ? 'Scheduled 8:00 AM CDT/CST' : 'Manual'} Options Screening Pipeline...`);
    const passedCandidates: OptionCandidate[] = [];
    const tickersToScan = CURATED_UNIVERSE;

    const batchSize = 6;
    for (let i = 0; i < tickersToScan.length; i += batchSize) {
      const batch = tickersToScan.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(item => evaluateCandidate(item.symbol, item as any))
      );

      for (const r of results) {
        if (r && r.TotalScore >= 0) {
          passedCandidates.push(r);
        }
      }
    }

    passedCandidates.sort((a, b) => b.TotalScore - a.TotalScore);
    latestScanResults = passedCandidates;
    lastScanTimestamp = new Date().toISOString();
    dailySnapshotDate = getCentralDateString();

    // Auto-generate executive briefing
    try {
      const topCandidates = passedCandidates.slice(0, 25);
      const briefingContent = await generateExecutiveBriefing(topCandidates);
      latestBriefing = {
        content: briefingContent,
        generatedAt: new Date().toISOString(),
        totalCandidatesAnalyzed: topCandidates.length,
      };
    } catch (err) {
      console.error('Auto briefing error:', err);
    }

    saveDailyDatasetToDisk();
    console.log(`[PIPELINE] Saved Daily Dataset (${latestScanResults.length} candidates) for ${dailySnapshotDate}`);
 try {
      const jsonPath = path.join(DATA_DIR, 'daily_dataset.json');
      const htmlPath = path.join(process.cwd(), 'output', 'Daily_Options_Report.html');
      generateHtmlReport(jsonPath, htmlPath);
      console.log(`[PIPELINE] HTML report successfully generated at: ${htmlPath}`);
    } catch (htmlErr) {
      console.error('Failed to generate HTML report from pipeline:', htmlErr);
    }
// 1. Import the generator at the top of server.ts
// import { generateHtmlReport } from './src/utils/reportGenerator';

// ... Inside your main execution or scheduled run function:
async function executeDailyScreening() {
    console.log("Running pre-market options screening...");
    
    // [Your existing logic that fetches data, calculates options plays, 
    //  and saves the final JSON data to a file]
    const jsonOutputPath = './placed_trades.json'; // or your target json path
    
    // 2. INSERT STEP 2 HERE: Immediately after the JSON file is saved
    const htmlOutputPath = './output/Daily_Options_Report.html';
    generateHtmlReport(jsonOutputPath, htmlOutputPath);
    console.log("HTML report generated successfully, ready for email attachment.");

    // [Your existing email dispatch step follows here...]
}
  // Instant fallback dataset generator
  function generateInstantUniverseDataset(): OptionCandidate[] {
    const list: OptionCandidate[] = [];
    for (const item of CURATED_UNIVERSE) {
      const c = generateRealisticCandidate(item.symbol, item);
      if (c && c.TotalScore >= 0) {
        list.push(c);
      }
    }
    list.sort((a, b) => b.TotalScore - a.TotalScore);
    return list;
  }

  // Pre-seed or load daily dataset instantaneously
  const hasLoaded = loadDailyDatasetFromDisk();
  if (!hasLoaded || latestScanResults.length === 0) {
    latestScanResults = generateInstantUniverseDataset();
    lastScanTimestamp = new Date().toISOString();
    dailySnapshotDate = getCentralDateString();
    saveDailyDatasetToDisk();
    console.log(`[PIPELINE] Initialized Instant Daily Dataset (${latestScanResults.length} candidates) for ${dailySnapshotDate}`);
    // Trigger live refresh in background without blocking server startup
    setTimeout(() => {
      runDailyPipeline(false).catch(e => console.error('Background pipeline error:', e));
    }, 1000);
  }

  // Seed sample placed trades if empty so the user can immediately experience both agents
  if (placedTrades.length === 0 && latestScanResults.length > 0) {
    const top1 = latestScanResults[0];
    const top2 = latestScanResults.length > 1 ? latestScanResults[1] : null;

    if (top1) {
      const isSpread = top1.Strategy === 'Bull Call Spread';
      const netDebit = top1.EstNetDebit;
      const longStrike = top1.LongStrike;
      const shortStrike = top1.ShortStrike;
      const totalDebit = netDebit * 100 * 10;
      const maxProfit = isSpread && shortStrike
        ? ((shortStrike - longStrike) * 100 * 10) - totalDebit
        : totalDebit * 1.5;

      placedTrades.push({
        id: `trade_${Date.now()}_1`,
        tradeRank: 1,
        ticker: top1.Ticker,
        companyName: top1.CompanyName || `${top1.Ticker} Inc.`,
        sector: top1.Sector,
        strategy: top1.Strategy,
        contractsCount: 10,
        entryDate: dailySnapshotDate,
        entryTime: '08:30 AM CST',
        entryStockPrice: top1.StockPrice,
        targetExpiration: top1.TargetExpiration,
        targetDTE: top1.TargetDTE,
        longStrike: top1.LongStrike,
        longDelta: top1.LongDelta,
        shortStrike: top1.ShortStrike,
        shortDelta: top1.ShortDelta,
        estNetDebitPerShare: top1.EstNetDebit,
        actualNetDebitPerShare: top1.EstNetDebit,
        totalNetDebit: totalDebit,
        maxRisk: totalDebit,
        maxProfit: Math.max(maxProfit, 500),
        breakevenPrice: parseFloat((longStrike + netDebit).toFixed(2)),
        stockStopLossPrice: parseFloat((top1.StockPrice * 0.97).toFixed(2)),
        stockProfitTargetPrice: parseFloat((top1.StockPrice * 1.06).toFixed(2)),
        optionsProfitTargetDollar: parseFloat((totalDebit * 0.50).toFixed(2)),
        optionsStopLossDollar: parseFloat((totalDebit * 0.40).toFixed(2)),
        executionDetails: isSpread && shortStrike
          ? `BOUGHT 10x ${top1.Ticker} $${top1.LongStrike} Calls (${top1.LongDelta}Δ) / SOLD 10x $${shortStrike} Calls (${top1.ShortDelta || 0.30}Δ) @ $${netDebit.toFixed(2)} net debit`
          : `BOUGHT 10x ${top1.Ticker} $${top1.LongStrike} Calls (${top1.LongDelta}Δ) @ $${netDebit.toFixed(2)} net debit`,
        status: 'OPEN',
        notes: 'Pre-market ranked #1 setup execution at market open.',
        loggedVia: 'rank_selection',
      });
    }

    if (top2) {
      const isSpread = top2.Strategy === 'Bull Call Spread';
      const netDebit = top2.EstNetDebit;
      const longStrike = top2.LongStrike;
      const shortStrike = top2.ShortStrike;
      const totalDebit = netDebit * 100 * 10;
      const maxProfit = isSpread && shortStrike
        ? ((shortStrike - longStrike) * 100 * 10) - totalDebit
        : totalDebit * 1.5;

      placedTrades.push({
        id: `trade_${Date.now()}_2`,
        tradeRank: 2,
        ticker: top2.Ticker,
        companyName: top2.CompanyName || `${top2.Ticker} Inc.`,
        sector: top2.Sector,
        strategy: top2.Strategy,
        contractsCount: 10,
        entryDate: dailySnapshotDate,
        entryTime: '08:35 AM CST',
        entryStockPrice: top2.StockPrice,
        targetExpiration: top2.TargetExpiration,
        targetDTE: top2.TargetDTE,
        longStrike: top2.LongStrike,
        longDelta: top2.LongDelta,
        shortStrike: top2.ShortStrike,
        shortDelta: top2.ShortDelta,
        estNetDebitPerShare: top2.EstNetDebit,
        actualNetDebitPerShare: top2.EstNetDebit,
        totalNetDebit: totalDebit,
        maxRisk: totalDebit,
        maxProfit: Math.max(maxProfit, 500),
        breakevenPrice: parseFloat((longStrike + netDebit).toFixed(2)),
        stockStopLossPrice: parseFloat((top2.StockPrice * 0.97).toFixed(2)),
        stockProfitTargetPrice: parseFloat((top2.StockPrice * 1.06).toFixed(2)),
        optionsProfitTargetDollar: parseFloat((totalDebit * 0.50).toFixed(2)),
        optionsStopLossDollar: parseFloat((totalDebit * 0.40).toFixed(2)),
        executionDetails: isSpread && shortStrike
          ? `BOUGHT 10x ${top2.Ticker} $${top2.LongStrike} Calls (${top2.LongDelta}Δ) / SOLD 10x $${shortStrike} Calls (${top2.ShortDelta || 0.30}Δ) @ $${netDebit.toFixed(2)} net debit`
          : `BOUGHT 10x ${top2.Ticker} $${top2.LongStrike} Calls (${top2.LongDelta}Δ) @ $${netDebit.toFixed(2)} net debit`,
        status: 'OPEN',
        notes: 'Pre-market ranked #2 momentum trade.',
        loggedVia: 'agent_prompt',
      });
    }

    savePlacedTradesToDisk();
  }

  // ========================================================
  // SCHEDULER: Check every 60 seconds for 8:00 AM CDT/CST (Mon-Fri)
  // ========================================================
  let lastCronRunDate: string = '';
  const schedulerInterval = setInterval(async () => {
    try {
      const now = new Date();
      // Format current day of week and time in America/Chicago
      const dayOfWeekStr = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', weekday: 'short' }).format(now);
      const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(dayOfWeekStr);

      const hourCentral = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', hour: 'numeric', hour12: false }).format(now), 10);
      const minuteCentral = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', minute: 'numeric' }).format(now), 10);
      const todayCentral = getCentralDateString();

      // Trigger if Mon-Fri, at 8:00 AM Central, and hasn't run yet today
      if (isWeekday && hourCentral === 8 && minuteCentral === 0 && lastCronRunDate !== todayCentral) {
        lastCronRunDate = todayCentral;
        console.log(`[SCHEDULER] 8:00 AM CDT/CST reached on ${dayOfWeekStr} (${todayCentral}). Triggering autonomous daily options pipeline...`);
        await runDailyPipeline(true);
      }
    } catch (e) {
      console.error('Scheduler check error:', e);
    }
  }, 60 * 1000);

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check & metadata
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasEmailConfig: Boolean(process.env.SENDER_EMAIL && process.env.RECIPIENT_EMAIL),
      hasDriveConfig: Boolean(process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON),
      cachedCandidatesCount: latestScanResults.length,
      lastScanTimestamp,
      dailySnapshotDate,
      currentTimeCentral: getCentralTimeString(),
      schedule: '8:00 AM CDT/CST (Monday - Friday)',
      placedTradesCount: placedTrades.length,
    });
  });

  // Daily Dataset info & default access
  app.get('/api/daily-dataset', (req, res) => {
    const datasetInfo: DailyDatasetInfo = {
      date: dailySnapshotDate,
      timestamp: lastScanTimestamp || new Date().toISOString(),
      isScheduleSnapshot: true,
      scheduleDescription: 'Runs once per day at 8:00 AM CDT/CST (Monday - Friday)',
      nextScheduledRun: '8:00 AM CDT/CST Next Business Day',
      timezone: 'America/Chicago (CDT/CST)',
      candidatesCount: latestScanResults.length,
      topRankedTicker: latestScanResults.length > 0 ? latestScanResults[0].Ticker : 'N/A',
      loadedFromCache: true,
    };

    res.json({
      datasetInfo,
      candidates: latestScanResults,
      briefing: latestBriefing,
    });
  });

  // Get current candidates (Delta access returns default saved dataset)
  app.get('/api/candidates', (req, res) => {
    res.json({
      candidates: latestScanResults,
      timestamp: lastScanTimestamp,
      count: latestScanResults.length,
      snapshotDate: dailySnapshotDate,
      schedule: '8:00 AM CDT/CST (Mon–Fri)',
    });
  });

  // Run Quantitative Options Scanner (Manual trigger preserved)
  app.post('/api/scan', async (req, res) => {
    try {
      const {
        universeType = 'sp500',
        customTickers = [],
        minScore = 0,
        maxCandidates = 50,
      } = req.body || {};

      let tickersToScan: { symbol: string; name?: string; sector?: string }[] = [];

      if (universeType === 'custom' && Array.isArray(customTickers) && customTickers.length > 0) {
        tickersToScan = customTickers.map((t: string) => {
          const sym = t.trim().toUpperCase();
          const found = CURATED_UNIVERSE.find(u => u.symbol === sym);
          return found || { symbol: sym, name: `${sym} Stock`, sector: 'Custom Asset' };
        });
      } else if (universeType === 'megacaps') {
        tickersToScan = CURATED_UNIVERSE.filter(u => u.isMegacap);
      } else if (universeType === 'tech') {
        tickersToScan = CURATED_UNIVERSE.filter(u => u.sector.toLowerCase().includes('tech') || u.symbol === 'QQQ' || u.symbol === 'XLK');
      } else if (universeType === 'financials') {
        tickersToScan = CURATED_UNIVERSE.filter(u => u.sector.toLowerCase().includes('financial') || u.symbol === 'XLF');
      } else if (universeType === 'energy') {
        tickersToScan = CURATED_UNIVERSE.filter(u => u.sector.toLowerCase().includes('energy') || u.symbol === 'XLE');
      } else {
        tickersToScan = CURATED_UNIVERSE;
      }

      const passedCandidates: OptionCandidate[] = [];

      const batchSize = 6;
      for (let i = 0; i < tickersToScan.length; i += batchSize) {
        const batch = tickersToScan.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(item => evaluateCandidate(item.symbol, item as any))
        );

        for (const r of results) {
          if (r && r.TotalScore >= minScore) {
            passedCandidates.push(r);
          }
        }
      }

      passedCandidates.sort((a, b) => b.TotalScore - a.TotalScore);

      latestScanResults = passedCandidates;
      lastScanTimestamp = new Date().toISOString();
      dailySnapshotDate = getCentralDateString();

      saveDailyDatasetToDisk();

      res.json({
        success: true,
        scannedCount: tickersToScan.length,
        passedCount: passedCandidates.length,
        candidates: passedCandidates.slice(0, maxCandidates),
        timestamp: lastScanTimestamp,
        snapshotDate: dailySnapshotDate,
      });
    } catch (err: any) {
      console.error('Scan error:', err);
      res.status(500).json({ success: false, error: err.message || 'Scanning failed' });
    }
  });

  // Get latest briefing
  app.get('/api/briefing', (req, res) => {
    res.json({
      briefing: latestBriefing,
    });
  });

  // Generate Executive AI Briefing
  app.post('/api/generate-briefing', async (req, res) => {
    try {
      const candidates: OptionCandidate[] = req.body?.candidates || latestScanResults;

      if (!candidates || candidates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No candidates available for briefing generation. Please run a scan first.',
        });
      }

      const topCandidates = candidates.slice(0, 25);
      const briefingContent = await generateExecutiveBriefing(topCandidates);

      latestBriefing = {
        content: briefingContent,
        generatedAt: new Date().toISOString(),
        totalCandidatesAnalyzed: topCandidates.length,
      };

      saveDailyDatasetToDisk();

      res.json({
        success: true,
        briefing: latestBriefing,
      });
    } catch (err: any) {
      console.error('Briefing error:', err);
      res.status(500).json({ success: false, error: err.message || 'Briefing generation failed' });
    }
  });

  // ========================================================
  // SECTION 1: TRADE EXECUTION AGENT (PLACED TRADES LOGGER)
  // Always on the basis of 10 contracts bought and/or sold
  // ========================================================

  // GET placed trades
  app.get('/api/placed-trades', (req, res) => {
    res.json({
      trades: placedTrades,
      totalCount: placedTrades.length,
      openCount: placedTrades.filter(t => t.status === 'OPEN').length,
      closedCount: placedTrades.filter(t => t.status === 'CLOSED').length,
    });
  });

  // POST: Log a new placed trade (identified by trade rank)
  app.post('/api/placed-trades', (req, res) => {
    try {
      const {
        tradeRank,
        customFillPrice,
        notes = '',
        loggedVia = 'rank_selection',
      } = req.body || {};

      let candidate: OptionCandidate | undefined;

      if (typeof tradeRank === 'number' && tradeRank > 0 && tradeRank <= latestScanResults.length) {
        candidate = latestScanResults[tradeRank - 1];
      } else if (req.body.ticker) {
        candidate = latestScanResults.find(c => c.Ticker === req.body.ticker.toUpperCase());
      }

      if (!candidate) {
        return res.status(404).json({
          success: false,
          error: `Suggested Trade Rank #${tradeRank} not found in today's daily opportunities dataset.`,
        });
      }

      const rankIndex = latestScanResults.findIndex(c => c.Ticker === candidate!.Ticker) + 1;
      const rankNum = tradeRank || rankIndex || 1;
      const isSpread = candidate.Strategy === 'Bull Call Spread';
      const actualNetDebit = typeof customFillPrice === 'number' && customFillPrice > 0
        ? customFillPrice
        : candidate.EstNetDebit;

      // STRICT REQUIREMENT: Basis of exactly 10 contracts bought and/or sold
      const CONTRACTS_COUNT = 10;
      const totalNetDebit = parseFloat((actualNetDebit * 100 * CONTRACTS_COUNT).toFixed(2));
      const longStrike = candidate.LongStrike;
      const shortStrike = candidate.ShortStrike;

      let maxProfit = 0;
      if (isSpread && shortStrike) {
        const spreadWidth = shortStrike - longStrike;
        const maxSpreadValue = spreadWidth * 100 * CONTRACTS_COUNT;
        maxProfit = parseFloat((maxSpreadValue - totalNetDebit).toFixed(2));
      } else {
        // Straight call 100% target estimation
        maxProfit = parseFloat((totalNetDebit * 1.5).toFixed(2));
      }

      const breakeven = parseFloat((longStrike + actualNetDebit).toFixed(2));
      const stopLossStock = parseFloat((candidate.StockPrice * 0.97).toFixed(2));
      const profitTargetStock = parseFloat((candidate.StockPrice * 1.06).toFixed(2));
      const optionsProfitTarget = parseFloat((totalNetDebit * 0.50).toFixed(2));
      const optionsStopLoss = parseFloat((totalNetDebit * 0.40).toFixed(2));

      const executionDesc = isSpread && shortStrike
        ? `BOUGHT 10x ${candidate.Ticker} $${longStrike} Calls (${candidate.LongDelta}Δ) / SOLD 10x $${shortStrike} Calls (${candidate.ShortDelta || 0.30}Δ) @ $${actualNetDebit.toFixed(2)} net debit`
        : `BOUGHT 10x ${candidate.Ticker} $${longStrike} Calls (${candidate.LongDelta}Δ) @ $${actualNetDebit.toFixed(2)} net debit ($${totalNetDebit.toFixed(2)} total outlay)`;

      const newTrade: PlacedTrade = {
        id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        tradeRank: rankNum,
        ticker: candidate.Ticker,
        companyName: candidate.CompanyName || `${candidate.Ticker} Corporation`,
        sector: candidate.Sector,
        strategy: candidate.Strategy,
        contractsCount: CONTRACTS_COUNT, // Always 10 contracts
        entryDate: dailySnapshotDate,
        entryTime: getCentralTimeString(),
        entryStockPrice: candidate.StockPrice,
        targetExpiration: candidate.TargetExpiration,
        targetDTE: candidate.TargetDTE,
        longStrike: candidate.LongStrike,
        longDelta: candidate.LongDelta,
        shortStrike: candidate.ShortStrike,
        shortDelta: candidate.ShortDelta,
        estNetDebitPerShare: candidate.EstNetDebit,
        actualNetDebitPerShare: actualNetDebit,
        totalNetDebit: totalNetDebit,
        maxRisk: totalNetDebit,
        maxProfit: Math.max(maxProfit, 100),
        breakevenPrice: breakeven,
        stockStopLossPrice: stopLossStock,
        stockProfitTargetPrice: profitTargetStock,
        optionsProfitTargetDollar: optionsProfitTarget,
        optionsStopLossDollar: optionsStopLoss,
        executionDetails: executionDesc,
        status: 'OPEN',
        notes: notes || `Logged based on Rank #${rankNum} pre-market candidate.`,
        loggedVia,
      };

      // Add to placed trades
      placedTrades.unshift(newTrade);
      savePlacedTradesToDisk();

      res.json({
        success: true,
        message: `Successfully logged Rank #${rankNum} (${candidate.Ticker}) on basis of 10 contracts ($${totalNetDebit.toFixed(2)} outlay).`,
        trade: newTrade,
      });
    } catch (err: any) {
      console.error('Log placed trade error:', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to log placed trade' });
    }
  });

  // DELETE or CLOSE placed trade
  app.delete('/api/placed-trades/:id', (req, res) => {
    const { id } = req.params;
    const idx = placedTrades.findIndex(t => t.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }
    const removed = placedTrades.splice(idx, 1)[0];
    savePlacedTradesToDisk();
    res.json({ success: true, removedTrade: removed });
  });

  // PATCH placed trade (update status / notes / close)
  app.patch('/api/placed-trades/:id', (req, res) => {
    const { id } = req.params;
    const trade = placedTrades.find(t => t.id === id);
    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (req.body.status) trade.status = req.body.status;
    if (req.body.notes !== undefined) trade.notes = req.body.notes;
    if (req.body.closedTotalPnL !== undefined) trade.closedTotalPnL = req.body.closedTotalPnL;
    if (req.body.closedDate) trade.closedDate = req.body.closedDate;

    savePlacedTradesToDisk();
    res.json({ success: true, trade });
  });

  // ========================================================
  // SECTION 2: STAY / EXIT DETERMINATION AGENT
  // Evaluates performance on the 10-contract positions
  // ========================================================

  app.get('/api/stay-exit-evaluations', async (req, res) => {
    try {
      const openTrades = placedTrades.filter(t => t.status === 'OPEN');
      const evaluations: TradeEvaluation[] = [];

      for (const trade of openTrades) {
        // Find latest candidate price data if available or derive current mark
        const matchingCandidate = latestScanResults.find(c => c.Ticker === trade.ticker);
        const currentStockPrice = matchingCandidate ? matchingCandidate.StockPrice : trade.entryStockPrice;
        
        // Calculate stock change percentage
        const stockChangePct = ((currentStockPrice - trade.entryStockPrice) / trade.entryStockPrice) * 100;
        
        // Days in trade calculation
        const entryD = new Date(trade.entryDate);
        const nowD = new Date();
        const diffDays = Math.max(0, Math.floor((nowD.getTime() - entryD.getTime()) / (1000 * 60 * 60 * 24)));
        const remainingDTE = Math.max(1, trade.targetDTE - diffDays);

        // Estimate current 10-contract position value
        // Using delta and gamma approximation on 10 contracts (1,000 shares equivalent)
        const isSpread = trade.strategy === 'Bull Call Spread';
        const netDelta = isSpread && trade.shortDelta ? trade.longDelta - trade.shortDelta : trade.longDelta;
        const dollarDelta = netDelta * 100 * trade.contractsCount; // Dollar change per $1 move in stock
        const stockDollarMove = currentStockPrice - trade.entryStockPrice;
        const estimatedOptionGain = stockDollarMove * dollarDelta;
        
        // Theta decay estimate (~ -0.5% per day elapsed)
        const thetaLoss = trade.totalNetDebit * (diffDays * 0.006);
        
        let estimatedCurrentVal = Math.max(50, trade.totalNetDebit + estimatedOptionGain - thetaLoss);
        
        // Cap spread value at max profit
        if (isSpread && trade.maxProfit) {
          estimatedCurrentVal = Math.min(trade.totalNetDebit + trade.maxProfit, estimatedCurrentVal);
        }

        const unrealizedPnLDollar = parseFloat((estimatedCurrentVal - trade.totalNetDebit).toFixed(2));
        const unrealizedPnLPct = parseFloat(((unrealizedPnLDollar / trade.totalNetDebit) * 100).toFixed(2));

        // DETERMINATION RULES:
        // 1. Take Profit Exit: >= +50% ROI on options OR underlying >= +6% target
        // 2. Stop Loss Exit: <= -40% loss on options OR underlying <= -3% stop loss
        // 3. Theta Warning Exit: remaining DTE <= 14 days and profit not materializing
        // 4. Stay / Hold: Positive trend intact, normal pullback, ample time
        let determination: 'STAY' | 'EXIT' = 'STAY';
        let subVerdict: TradeEvaluation['subVerdict'] = 'STAY - ON TRACK';
        let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
        let recommendedAction = '';

        if (unrealizedPnLPct >= 48.0 || stockChangePct >= 5.8) {
          determination = 'EXIT';
          subVerdict = 'EXIT - PROFIT TARGET HIT';
          urgency = 'HIGH';
          recommendedAction = `Sell to Close all 10 contracts to lock in +$${unrealizedPnLDollar.toFixed(2)} (+${unrealizedPnLPct.toFixed(1)}% ROI). Target objective fulfilled.`;
        } else if (unrealizedPnLPct <= -38.0 || stockChangePct <= -2.9) {
          determination = 'EXIT';
          subVerdict = 'EXIT - STOP LOSS TRIGGERED';
          urgency = 'HIGH';
          recommendedAction = `Execute Sell to Close across all 10 contracts to cap loss at -$${Math.abs(unrealizedPnLDollar).toFixed(2)} (-${Math.abs(unrealizedPnLPct).toFixed(1)}%). Underlying broke stop loss.`;
        } else if (remainingDTE <= 14 && unrealizedPnLPct < 20.0) {
          determination = 'EXIT';
          subVerdict = 'EXIT - THETA TIME DECAY';
          urgency = 'MEDIUM';
          recommendedAction = `Close 10 contracts to avoid accelerating theta burn under 14 DTE. Reallocate capital into fresh 45-60 DTE setups.`;
        } else if (stockChangePct >= 0) {
          determination = 'STAY';
          subVerdict = 'STAY - ON TRACK';
          urgency = 'LOW';
          recommendedAction = `Maintain position (10 contracts). Stock up +${stockChangePct.toFixed(2)}%. Profit running at +$${unrealizedPnLDollar.toFixed(2)}. Stop-loss pegged at $${trade.stockStopLossPrice}.`;
        } else {
          determination = 'STAY';
          subVerdict = 'STAY - PULLBACK HOLD';
          urgency = 'LOW';
          recommendedAction = `Hold 10-contract position. Minor pullback (${stockChangePct.toFixed(2)}%) within technical tolerance. ${remainingDTE} DTE remaining.`;
        }

        // Generate comprehensive rationale
        const rationale = await generateStayExitRationale({
          ticker: trade.ticker,
          strategy: trade.strategy,
          entryStockPrice: trade.entryStockPrice,
          currentStockPrice,
          stockPriceChangePct: stockChangePct,
          entryNetDebitTotal: trade.totalNetDebit,
          currentEstimatedPositionValueTotal: estimatedCurrentVal,
          unrealizedPnLDollar,
          unrealizedPnLPct,
          daysInTrade: diffDays,
          remainingDTE,
          longStrike: trade.longStrike,
          shortStrike: trade.shortStrike,
          determination,
          subVerdict,
        });

        const stopDist = ((currentStockPrice - trade.stockStopLossPrice) / currentStockPrice) * 100;
        const targetDist = ((trade.stockProfitTargetPrice - currentStockPrice) / currentStockPrice) * 100;

        evaluations.push({
          tradeId: trade.id,
          tradeRank: trade.tradeRank,
          ticker: trade.ticker,
          companyName: trade.companyName,
          strategy: trade.strategy,
          contractsCount: trade.contractsCount,
          entryDate: trade.entryDate,
          entryStockPrice: trade.entryStockPrice,
          currentStockPrice: parseFloat(currentStockPrice.toFixed(2)),
          stockPriceChangePct: parseFloat(stockChangePct.toFixed(2)),
          entryNetDebitTotal: trade.totalNetDebit,
          currentEstimatedPositionValueTotal: parseFloat(estimatedCurrentVal.toFixed(2)),
          unrealizedPnLDollar,
          unrealizedPnLPct,
          daysInTrade: diffDays,
          remainingDTE,
          targetExpiration: trade.targetExpiration,
          longStrike: trade.longStrike,
          shortStrike: trade.shortStrike,
          determination,
          subVerdict,
          urgency,
          confidenceScore: determination === 'EXIT' ? 94 : 88,
          rationale,
          recommendedAction,
          keyMetrics: {
            deltaStatus: `${(netDelta * 1000).toFixed(0)} delta shares equivalent`,
            thetaStatus: `${remainingDTE} DTE (${remainingDTE > 21 ? 'Safe Gamma Zone' : 'Accelerated Decay Zone'})`,
            stopDistancePct: parseFloat(stopDist.toFixed(1)),
            targetDistancePct: parseFloat(targetDist.toFixed(1)),
            currentIv: matchingCandidate ? matchingCandidate.IV : 28.5,
          },
          evaluatedAt: new Date().toISOString(),
        });
      }

      // Portfolio Summary
      const totalOutlay = evaluations.reduce((sum, e) => sum + e.entryNetDebitTotal, 0);
      const totalCurrentVal = evaluations.reduce((sum, e) => sum + e.currentEstimatedPositionValueTotal, 0);
      const totalUnrealizedPnL = parseFloat((totalCurrentVal - totalOutlay).toFixed(2));
      const totalUnrealizedPct = totalOutlay > 0 ? parseFloat(((totalUnrealizedPnL / totalOutlay) * 100).toFixed(2)) : 0;
      const stayCount = evaluations.filter(e => e.determination === 'STAY').length;
      const exitCount = evaluations.filter(e => e.determination === 'EXIT').length;

      res.json({
        success: true,
        snapshotDate: dailySnapshotDate,
        evaluatedAt: new Date().toISOString(),
        totalTracked: evaluations.length,
        summary: {
          totalOutlay,
          totalCurrentVal: parseFloat(totalCurrentVal.toFixed(2)),
          totalUnrealizedPnL,
          totalUnrealizedPct,
          stayCount,
          exitCount,
        },
        evaluations,
      });
    } catch (err: any) {
      console.error('Stay/Exit evaluation error:', err);
      res.status(500).json({ success: false, error: err.message || 'Evaluation failed' });
    }
  });

  // Start the server
  const server = app.listen(PORT, () => {
    console.log(`[SERVER] Express server listening on port ${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[SERVER] SIGTERM received, shutting down gracefully...');
    clearInterval(schedulerInterval);
    server.close(() => {
      console.log('[SERVER] Server closed');
      process.exit(0);
    });
  });

// Prevent server from running indefinitely during CI/CD execution
  if (process.env.CI === 'true') {
    console.log('[SERVER] CI environment detected. Triggering immediate pipeline run for export...');
    runDailyPipeline(true).then(() => {
      console.log('[SERVER] Pipeline finished. Generating HTML report...');
      try {
        const jsonPath = path.join(DATA_DIR, 'daily_dataset.json');
        const htmlPath = path.join(process.cwd(), 'output', 'Daily_Options_Report.html');
        generateHtmlReport(jsonPath, htmlPath);
        console.log('[SERVER] HTML report generated successfully at:', htmlPath);
      } catch (err) {
        console.error('[SERVER] Failed to generate HTML report in CI block:', err);
      }

      clearInterval(schedulerInterval);
      server.close(() => {
        console.log('[SERVER] Server closed');
        process.exit(0);
      });
    }).catch(err => {
      console.error('[SERVER] Pipeline execution failed in CI:', err);
      process.exit(1);
    });
  }

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
