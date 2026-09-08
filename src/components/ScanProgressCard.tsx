import React from 'react';
import { Activity, CheckCircle2, CloudUpload, HardDrive, RefreshCw, Sparkles, X } from 'lucide-react';
import { ScanProgress, DriveSaveResult } from '../types.ts';

interface ScanProgressCardProps {
  progress: ScanProgress;
  driveResult: DriveSaveResult | null;
  onDismissDriveNotification?: () => void;
}

export const ScanProgressCard: React.FC<ScanProgressCardProps> = ({
  progress,
  driveResult,
  onDismissDriveNotification,
}) => {
  const isScanning = progress.status === 'scanning';
  const percent = progress.totalTickers > 0
    ? Math.min(100, Math.round((progress.currentIndex / progress.totalTickers) * 100))
    : 0;

  if (!isScanning && !driveResult) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Live Scanning Progress Banner */}
      {isScanning && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
          {/* Subtle animated background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
          
          <div className="relative z-10 space-y-3">
            {/* Top row: Counter & Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center font-bold">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      Active Pre-Market Quantitative Scan
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Scanned {progress.currentIndex} of {progress.totalTickers} ({percent}%)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span>Reviewing:</span>
                    <strong className="text-cyan-300 font-mono font-bold">{progress.currentTicker}</strong>
                    {progress.currentName && (
                      <span className="text-slate-400 hidden md:inline">({progress.currentName})</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Real-time Qualifying Counter */}
              <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                    Setups Passing Hard Filters
                  </span>
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{progress.passedCount} found so far</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-300 transition-all duration-150 ease-out shadow-sm shadow-cyan-500/50"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>0 stocks</span>
                <span className="text-cyan-400 font-bold">Scanned {progress.currentIndex} of {progress.totalTickers}</span>
                <span>{progress.totalTickers} stocks</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Auto-Save Status Banner upon Scan Completion */}
      {driveResult && !isScanning && (
        <div className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
          driveResult.success
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
            : driveResult.simulated
            ? 'bg-slate-900 border-slate-800 text-slate-300'
            : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              driveResult.success
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-cyan-400'
            }`}>
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <strong className="font-semibold text-white">Google Drive Pipeline Auto-Save:</strong>
                <span className="font-mono text-[11px] bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800">
                  {driveResult.fileName || 'pre_market_options_report.csv'}
                </span>
                {driveResult.folderId && (
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    (Folder: {driveResult.folderId})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{driveResult.message}</p>
              {driveResult.webViewLink && (
                <a
                  href={driveResult.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 underline mt-1"
                >
                  Open in Google Drive ↗
                </a>
              )}
              {driveResult.serviceAccountEmail && (
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span>Service Account:</span>
                  <code className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-cyan-300 font-mono select-all">
                    {driveResult.serviceAccountEmail}
                  </code>
                </div>
              )}
            </div>
          </div>

          {onDismissDriveNotification && (
            <button
              onClick={onDismissDriveNotification}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
