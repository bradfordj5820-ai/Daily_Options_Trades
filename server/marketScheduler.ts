import fs from 'fs';
import path from 'path';
import { CURATED_UNIVERSE, evaluateCandidate } from './optionsEngine.js';
import { generateExecutiveBriefing } from './geminiService.js';
import { saveReportToGoogleDrive, DriveUploadResult } from './googleDriveService.js';
import { sendDailyReportEmail, EmailDispatchResult } from './emailService.js';
import { getActivePlacedTrades, ensureTradesLoaded } from './tradesStorage.js';
import { generateStayExitDecisions } from './stayExitEngine.js';
import { OptionCandidate, StayExitDecision } from '../src/types.js';

export interface SchedulerState {
  enabled: boolean;
  scheduledTimeStr: string; // "8:00 AM CDT (Mon–Fri)"
  targetHourUTC: number;    // 13 (8:00 AM CDT)
  targetMinuteUTC: number;  // 0
  lastRunDate: string | null; // e.g. "2026-08-27"
  lastRunTimestamp: string | null;
  lastRunSuccess: boolean;
  lastRunMessage: string;
  nextRunEstimated: string;
  lastEmailResult: EmailDispatchResult | null;
  lastDriveResult: DriveUploadResult | null;
  isExecutingNow: boolean;
}

export interface PipelineExecutionResult {
  success: boolean;
  candidatesCount: number;
  stayExitCount: number;
  driveResult: DriveUploadResult | null;
  emailResult: EmailDispatchResult | null;
  timestamp: string;
  message: string;
}

// 8:00 AM CDT is 13:00 UTC (during Daylight Saving Time)
const TARGET_CDT_HOUR = 8;
const TARGET_CDT_MINUTE = 0;

const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const SCHEDULER_STATE_FILE = path.join(DATA_DIR, 'scheduler_state.json');
const MARKET_CACHE_FILE = path.join(DATA_DIR, 'market_cache.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Returns current date/time details in America/Chicago timezone (CDT/CST)
 */
export function getCentralTimeInfo(d: Date = new Date()) {
  const cdtString = d.toLocaleString('en-US', { timeZone: 'America/Chicago' });
  const cdtDate = new Date(cdtString);

  const dayOfWeek = cdtDate.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  const hours = cdtDate.getHours();
  const minutes = cdtDate.getMinutes();
  const dateKey = `${cdtDate.getFullYear()}-${String(cdtDate.getMonth() + 1).padStart(2, '0')}-${String(cdtDate.getDate()).padStart(2, '0')}`;

  return {
    cdtDate,
    dayOfWeek,
    isWeekday,
    hours,
    minutes,
    dateKey,
    formattedTime: cdtDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

/**
 * Computes the estimated next scheduled 8:00 AM CDT run timestamp
 */
export function calculateNext8AmCdtRun(): string {
  const now = new Date();
  const cdtInfo = getCentralTimeInfo(now);

  // Start with today in CDT
  const nextTarget = new Date(cdtInfo.cdtDate);
  nextTarget.setHours(TARGET_CDT_HOUR, TARGET_CDT_MINUTE, 0, 0);

  // If today is a weekend or past 8:00 AM CDT today, advance to next weekday 8:00 AM CDT
  if (cdtInfo.cdtDate.getTime() >= nextTarget.getTime() || !cdtInfo.isWeekday) {
    do {
      nextTarget.setDate(nextTarget.getDate() + 1);
    } while (nextTarget.getDay() === 0 || nextTarget.getDay() === 6); // Skip Sun & Sat
  }

  // Format description
  const dayName = nextTarget.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${dayName} at 8:00 AM CDT`;
}

export class MarketScheduler {
  private state: SchedulerState = {
    enabled: true,
    scheduledTimeStr: '8:00 AM CDT (Mon–Fri)',
    targetHourUTC: 13,
    targetMinuteUTC: 0,
    lastRunDate: null,
    lastRunTimestamp: null,
    lastRunSuccess: false,
    lastRunMessage: 'Scheduled to run once daily at 8:00 AM CDT (Mon–Fri)',
    nextRunEstimated: calculateNext8AmCdtRun(),
    lastEmailResult: null,
    lastDriveResult: null,
    isExecutingNow: false,
  };

  private intervalTimer: NodeJS.Timeout | null = null;
  private onPipelineCompleted?: (
    candidates: OptionCandidate[],
    stayExitDecisions: StayExitDecision[],
    briefing: { content: string; generatedAt: string; totalCandidatesAnalyzed: number },
    driveResult: DriveUploadResult | null,
    emailResult: EmailDispatchResult | null
  ) => void;

  constructor(
    onPipelineCompleted?: (
      candidates: OptionCandidate[],
      stayExitDecisions: StayExitDecision[],
      briefing: { content: string; generatedAt: string; totalCandidatesAnalyzed: number },
      driveResult: DriveUploadResult | null,
      emailResult: EmailDispatchResult | null
    ) => void
  ) {
    this.onPipelineCompleted = onPipelineCompleted;
    this.loadPersistedState();
  }

  private loadPersistedState() {
    try {
      ensureDataDir();
      if (fs.existsSync(SCHEDULER_STATE_FILE)) {
        const raw = fs.readFileSync(SCHEDULER_STATE_FILE, 'utf-8');
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          this.state = {
            ...this.state,
            ...saved,
            isExecutingNow: false,
            nextRunEstimated: calculateNext8AmCdtRun(),
          };
          console.log(`[MarketScheduler] Loaded persisted scheduler state (last run: ${this.state.lastRunDate})`);
        }
      }
    } catch (err) {
      console.warn('[MarketScheduler] Error loading persisted state:', err);
    }
  }

  private persistState() {
    try {
      ensureDataDir();
      fs.writeFileSync(SCHEDULER_STATE_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[MarketScheduler] Error saving persisted state:', err);
    }
  }

  public getState(): SchedulerState {
    this.state.nextRunEstimated = calculateNext8AmCdtRun();
    return { ...this.state };
  }

  /**
   * Starts the scheduler and initiates immediate evaluation check
   */
  public start() {
    if (this.intervalTimer) return;

    console.log('[MarketScheduler] Initialized daily cron (8:00 AM CDT, Mon–Fri)');
    
    // Check schedule immediately on boot
    this.checkSchedule();

    // Check periodically every 20 seconds
    this.intervalTimer = setInterval(() => {
      this.checkSchedule();
    }, 20 * 1000);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Evaluates if 8:00 AM CDT pipeline should execute
   */
  private async checkSchedule() {
    if (!this.state.enabled || this.state.isExecutingNow) {
      return;
    }

    const { isWeekday, hours, minutes, dateKey } = getCentralTimeInfo();

    // Only run on weekdays (Monday - Friday)
    if (!isWeekday) {
      return;
    }

    // Check if Central Time is at or past 8:00 AM CDT
    const isAtOrPast8Am = hours > TARGET_CDT_HOUR || (hours === TARGET_CDT_HOUR && minutes >= TARGET_CDT_MINUTE);

    // If today is a weekday and Central Time >= 8:00 AM CDT, and today's run has not completed:
    if (isAtOrPast8Am && this.state.lastRunDate !== dateKey) {
      console.log(`[MarketScheduler] 🔔 8:00 AM CDT Market Trigger active for ${dateKey}! Executing daily pipeline...`);
      await this.executeFullDailyPipeline('SCHEDULED_8AM_CDT');
    }
  }

  /**
   * Executes the full daily options pipeline
   */
  public async executeFullDailyPipeline(
    triggerSource: 'SCHEDULED_8AM_CDT' | 'MANUAL_TRIGGER' = 'MANUAL_TRIGGER',
    customTickers?: string[]
  ): Promise<PipelineExecutionResult> {
    if (this.state.isExecutingNow) {
      return {
        success: false,
        candidatesCount: 0,
        stayExitCount: 0,
        driveResult: this.state.lastDriveResult,
        emailResult: this.state.lastEmailResult,
        timestamp: new Date().toISOString(),
        message: 'A pipeline execution is already in progress.',
      };
    }

    this.state.isExecutingNow = true;
    const { dateKey } = getCentralTimeInfo();
    const timestamp = new Date().toISOString();

    try {
      console.log(`[MarketScheduler] Starting ${triggerSource} pipeline run for ${dateKey}...`);

      // 1. Candidate Screening
      const universeToScan = customTickers && customTickers.length > 0
        ? customTickers.map(sym => ({ symbol: sym.toUpperCase(), name: `${sym.toUpperCase()} Stock`, sector: 'Custom' }))
        : CURATED_UNIVERSE;

      const passedCandidates: OptionCandidate[] = [];
      const batchSize = 6;
      for (let i = 0; i < universeToScan.length; i += batchSize) {
        const batch = universeToScan.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(item => evaluateCandidate(item.symbol, item as any))
        );
        for (const r of results) {
          if (r) {
            passedCandidates.push(r);
          }
        }
      }

      // Sort by TotalScore descending
      passedCandidates.sort((a, b) => b.TotalScore - a.TotalScore);

      // 2. Active Trade Stay/Exit Decisions
      await ensureTradesLoaded();
      const activeTrades = getActivePlacedTrades();
      const stayExitDecisions = await generateStayExitDecisions(activeTrades, passedCandidates);

      // 3. AI Executive Morning Briefing
      const topCandidates = passedCandidates.slice(0, 15);
      const briefingContent = await generateExecutiveBriefing(topCandidates, stayExitDecisions);
      const briefing = {
        content: briefingContent,
        generatedAt: timestamp,
        totalCandidatesAnalyzed: topCandidates.length,
      };

      // 4. Google Drive CSV Save
      let driveResult: DriveUploadResult | null = null;
      try {
        driveResult = await saveReportToGoogleDrive(
          passedCandidates,
          'pre_market_options_report.csv',
          stayExitDecisions
        );
        this.state.lastDriveResult = driveResult;
      } catch (err: any) {
        console.error('[MarketScheduler] Google Drive save error:', err);
      }

      // 5. Email Dispatch with CSV attached
      let emailResult: EmailDispatchResult | null = null;
      try {
        emailResult = await sendDailyReportEmail(
          passedCandidates,
          stayExitDecisions,
          briefingContent
        );
        this.state.lastEmailResult = emailResult;
      } catch (err: any) {
        console.error('[MarketScheduler] Email dispatch error:', err);
      }

      // Update state
      this.state.lastRunDate = dateKey;
      this.state.lastRunTimestamp = timestamp;
      this.state.lastRunSuccess = true;
      this.state.lastRunMessage = `Daily 8:00 AM CDT pipeline completed successfully (${passedCandidates.length} candidate setups, ${stayExitDecisions.length} active positions, CSV attached to email).`;
      this.state.nextRunEstimated = calculateNext8AmCdtRun();

      // Persist cache to disk
      try {
        ensureDataDir();
        const cachePayload = {
          dateKey,
          timestamp,
          candidates: passedCandidates,
          stayExitDecisions,
          briefing,
          driveResult,
          emailResult,
        };
        fs.writeFileSync(MARKET_CACHE_FILE, JSON.stringify(cachePayload, null, 2), 'utf-8');
      } catch (err) {
        console.warn('[MarketScheduler] Error saving market cache to disk:', err);
      }

      this.persistState();

      // Notify server callback to update in-memory caches
      if (this.onPipelineCompleted) {
        this.onPipelineCompleted(
          passedCandidates,
          stayExitDecisions,
          briefing,
          driveResult,
          emailResult
        );
      }

      console.log(`[MarketScheduler] ✅ Pipeline finished: ${this.state.lastRunMessage}`);

      return {
        success: true,
        candidatesCount: passedCandidates.length,
        stayExitCount: stayExitDecisions.length,
        driveResult,
        emailResult,
        timestamp,
        message: this.state.lastRunMessage,
      };
    } catch (err: any) {
      console.error('[MarketScheduler] Pipeline execution failure:', err);
      this.state.lastRunSuccess = false;
      this.state.lastRunMessage = `Pipeline error: ${err.message || 'Unknown error'}`;
      this.persistState();
      return {
        success: false,
        candidatesCount: 0,
        stayExitCount: 0,
        driveResult: null,
        emailResult: null,
        timestamp,
        message: this.state.lastRunMessage,
      };
    } finally {
      this.state.isExecutingNow = false;
    }
  }
}

