import React from 'react';
import { Clock, RefreshCw, Mail, Download, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { SchedulerInfo } from '../types.ts';

interface MarketScheduleBannerProps {
  schedulerInfo: SchedulerInfo | null;
  lastUpdated: string | null;
  isScanning: boolean;
  onManualRun: () => void;
  onOpenEmailModal: () => void;
  candidatesCount: number;
}

export const MarketScheduleBanner: React.FC<MarketScheduleBannerProps> = ({
  schedulerInfo,
  lastUpdated,
  isScanning,
  onManualRun,
  onOpenEmailModal,
  candidatesCount,
}) => {
  const nextRun = schedulerInfo?.nextRunEstimated || 'Weekdays at 8:00 AM CDT';
  const centralTime = schedulerInfo?.centralTime || 'Central Time (CDT)';
  const lastRunDate = schedulerInfo?.lastRunDate || (lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Today');

  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md mb-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Schedule Info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 sm:mt-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                8:00 AM CDT Daily Execution Schedule
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Mon–Fri Market Days
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                (Current CT: {centralTime})
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <strong className="text-slate-300">Next Scheduled Run:</strong> {nextRun} &bull; <span className="text-cyan-400">Tokens & Epochs Preserved:</span> Report is generated once per morning and cached.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Email Report with CSV Attachment */}
          <button
            id="btn-schedule-open-email"
            onClick={onOpenEmailModal}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            title="Send daily executive report with pre_market_options_report.csv attached"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span>Email + CSV</span>
          </button>

          {/* Download Direct CSV */}
          <button
            id="btn-schedule-download-csv"
            onClick={() => { window.location.href = '/api/download-csv'; }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            title="Download pre_market_options_report.csv"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          {/* Manual Run Button */}
          <button
            id="btn-schedule-manual-run"
            onClick={onManualRun}
            disabled={isScanning}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
              isScanning
                ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/20 animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            } disabled:opacity-80`}
            title="Trigger an on-demand re-calculation immediately"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Running...' : 'Run Manual Scan'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
