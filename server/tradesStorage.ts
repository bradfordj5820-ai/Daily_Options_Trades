import fs from 'fs';
import path from 'path';
import { PlacedTrade, OptionCandidate } from '../src/types.js';
import { savePortfolioBackupToGoogleDrive, loadPortfolioBackupFromGoogleDrive } from './googleDriveService.js';

const STORAGE_FILE = path.join(process.cwd(), 'placed_trades.json');
const BACKUP_STORAGE_DIR = path.join(process.cwd(), 'server', 'data');
const BACKUP_STORAGE_FILE = path.join(BACKUP_STORAGE_DIR, 'placed_trades.json');

// In-memory cache of placed trades
let cachedTrades: PlacedTrade[] = [];
let hasAttemptedDriveRestore = false;

function ensureDataDir() {
  try {
    if (!fs.existsSync(BACKUP_STORAGE_DIR)) {
      fs.mkdirSync(BACKUP_STORAGE_DIR, { recursive: true });
    }
  } catch (err) {
    // Ignore error
  }
}

/**
 * Load placed trades from disk with graceful fallback and cloud restore
 */
export function loadPlacedTrades(): PlacedTrade[] {
  try {
    // 1. Try primary storage file
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedTrades = parsed;
        return cachedTrades;
      }
    }

    // 2. Try backup data directory file
    if (fs.existsSync(BACKUP_STORAGE_FILE)) {
      const data = fs.readFileSync(BACKUP_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedTrades = parsed;
        // Resave to primary
        savePlacedTrades(cachedTrades);
        return cachedTrades;
      }
    }
  } catch (err) {
    console.error('[TradesStorage] Error reading placed_trades.json:', err);
  }

  // 3. If disk is empty, trigger async cloud restore from Google Drive
  if (!hasAttemptedDriveRestore) {
    hasAttemptedDriveRestore = true;
    loadPortfolioBackupFromGoogleDrive().then(driveTrades => {
      if (driveTrades && Array.isArray(driveTrades) && driveTrades.length > 0) {
        console.log(`[TradesStorage] Restored ${driveTrades.length} trades from Google Drive backup!`);
        cachedTrades = driveTrades;
        savePlacedTrades(driveTrades);
      }
    }).catch(err => {
      console.warn('[TradesStorage] Drive restore check warning:', err.message);
    });
  }

  cachedTrades = [];
  return cachedTrades;
}

/**
 * Persist placed trades to disk and cloud backup
 */
export function savePlacedTrades(trades: PlacedTrade[]): void {
  try {
    cachedTrades = trades;
    
    // Save to root directory
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(trades, null, 2), 'utf-8');
    
    // Save to backup directory
    ensureDataDir();
    fs.writeFileSync(BACKUP_STORAGE_FILE, JSON.stringify(trades, null, 2), 'utf-8');
    
    console.log(`[TradesStorage] Saved ${trades.length} trades to ${STORAGE_FILE} and backup`);

    // Asynchronously backup to Google Drive folder
    savePortfolioBackupToGoogleDrive(trades).catch(err => {
      console.warn('[TradesStorage] Async Google Drive backup note:', err.message);
    });
  } catch (err) {
    console.error('[TradesStorage] Error saving placed_trades.json:', err);
  }
}

/**
 * Sync and merge trades (e.g. from browser localStorage when container restarts)
 */
export function syncTrades(incomingTrades: PlacedTrade[]): PlacedTrade[] {
  if (!Array.isArray(incomingTrades) || incomingTrades.length === 0) {
    return getPlacedTrades();
  }

  const currentTrades = getPlacedTrades();
  const tradeMap = new Map<string, PlacedTrade>();

  // Add existing server trades first
  for (const t of currentTrades) {
    tradeMap.set(t.id, t);
  }

  // Merge incoming client trades
  let newTradesCount = 0;
  for (const inc of incomingTrades) {
    if (!inc || !inc.ticker) continue;
    // Check by ID or matching ticker + entryDate + strategy
    const existingKey = Array.from(tradeMap.keys()).find(k => {
      const existing = tradeMap.get(k);
      return existing && (existing.id === inc.id || (
        existing.ticker === inc.ticker && 
        existing.entryDate === inc.entryDate && 
        existing.strategy === inc.strategy
      ));
    });

    if (!existingKey) {
      tradeMap.set(inc.id, inc);
      newTradesCount++;
    } else {
      // If incoming has a newer status, keep it
      const existing = tradeMap.get(existingKey)!;
      if (inc.status !== 'ACTIVE' && existing.status === 'ACTIVE') {
        tradeMap.set(existingKey, { ...existing, ...inc });
      }
    }
  }

  const merged = Array.from(tradeMap.values());
  if (newTradesCount > 0 || merged.length !== currentTrades.length) {
    console.log(`[TradesStorage] Merged & synced ${newTradesCount} trades from client. Total: ${merged.length}`);
    savePlacedTrades(merged);
  }

  return merged;
}

/**
 * Retrieve all placed trades
 */
export function getPlacedTrades(): PlacedTrade[] {
  if (cachedTrades.length === 0) {
    return loadPlacedTrades();
  }
  return cachedTrades;
}

/**
 * Retrieve only active placed trades
 */
export function getActivePlacedTrades(): PlacedTrade[] {
  const all = getPlacedTrades();
  return all.filter(t => t.status === 'ACTIVE');
}

/**
 * Ingest trade details by Rank Number(s) from the candidate list
 */
export function ingestTradesByRank(
  rankNumbers: number[],
  currentCandidates: OptionCandidate[],
  options: { contracts?: number; notes?: string; entryDate?: string } = {}
): { ingested: PlacedTrade[]; notFound: number[] } {
  const allTrades = getPlacedTrades();
  const ingested: PlacedTrade[] = [];
  const notFound: number[] = [];
  const todayStr = options.entryDate || new Date().toISOString().split('T')[0];

  for (const rank of rankNumbers) {
    const candidateIdx = rank - 1;
    const candidate = currentCandidates[candidateIdx];

    if (!candidate) {
      notFound.push(rank);
      continue;
    }

    // Stop Loss = -3.0% on stock; Profit Target = +6.0% on stock
    const stopLossPrice = parseFloat((candidate.StockPrice * 0.97).toFixed(2));
    const profitTargetPrice = parseFloat((candidate.StockPrice * 1.06).toFixed(2));

    const newTrade: PlacedTrade = {
      id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      rankNumber: rank,
      ticker: candidate.Ticker,
      companyName: candidate.CompanyName || `${candidate.Ticker} Equity`,
      strategy: candidate.Strategy,
      entryDate: todayStr,
      entryStockPrice: candidate.StockPrice,
      entryNetDebit: candidate.EstNetDebit,
      contracts: options.contracts && options.contracts > 0 ? options.contracts : 1,
      targetDTE: candidate.TargetDTE,
      targetExpiration: candidate.TargetExpiration,
      longStrike: candidate.LongStrike,
      longDelta: candidate.LongDelta,
      shortStrike: candidate.ShortStrike,
      shortDelta: candidate.ShortDelta,
      stopLossStockPrice: stopLossPrice,
      profitTargetStockPrice: profitTargetPrice,
      status: 'ACTIVE',
      notes: options.notes || `Ingested by Trade Agent for Rank #${rank} (${candidate.Ticker})`,
    };

    allTrades.unshift(newTrade);
    ingested.push(newTrade);
  }

  savePlacedTrades(allTrades);
  return { ingested, notFound };
}

/**
 * Ingest a custom trade directly
 */
export function addPlacedTrade(trade: Omit<PlacedTrade, 'id'>): PlacedTrade {
  const allTrades = getPlacedTrades();
  const newTrade: PlacedTrade = {
    ...trade,
    id: `trade-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
  allTrades.unshift(newTrade);
  savePlacedTrades(allTrades);
  return newTrade;
}

/**
 * Update trade status (e.g. mark closed or exited)
 */
export function updateTradeStatus(
  id: string,
  status: 'ACTIVE' | 'CLOSED_PROFIT' | 'CLOSED_STOP' | 'CLOSED_MANUAL' | 'EXPIRED',
  closedDetails?: { closedStockPrice?: number; closedNetCredit?: number }
): PlacedTrade | null {
  const allTrades = getPlacedTrades();
  const idx = allTrades.findIndex(t => t.id === id);
  if (idx === -1) return null;

  allTrades[idx] = {
    ...allTrades[idx],
    status,
    closedDate: new Date().toISOString().split('T')[0],
    closedStockPrice: closedDetails?.closedStockPrice,
    closedNetCredit: closedDetails?.closedNetCredit,
  };

  savePlacedTrades(allTrades);
  return allTrades[idx];
}

/**
 * Delete a trade from portfolio
 */
export function deleteTrade(id: string): boolean {
  const allTrades = getPlacedTrades();
  const initialLength = allTrades.length;
  const filtered = allTrades.filter(t => t.id !== id);
  if (filtered.length !== initialLength) {
    savePlacedTrades(filtered);
    return true;
  }
  return false;
}

/**
 * Ensure trades are loaded, checking Google Drive cloud backup if local memory/disk has 0 trades
 */
export async function ensureTradesLoaded(): Promise<PlacedTrade[]> {
  const current = getPlacedTrades();
  if (current.length > 0) {
    return current;
  }

  try {
    const driveTrades = await loadPortfolioBackupFromGoogleDrive();
    if (driveTrades && Array.isArray(driveTrades) && driveTrades.length > 0) {
      console.log(`[TradesStorage] Loaded ${driveTrades.length} trades from Google Drive backup.`);
      savePlacedTrades(driveTrades);
      return driveTrades;
    }
  } catch (err: any) {
    console.warn('[TradesStorage] ensureTradesLoaded error:', err.message);
  }

  return [];
}
