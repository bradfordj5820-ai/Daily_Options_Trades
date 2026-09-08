import React from 'react';
import { X, Clock, Mail, HardDrive, Cpu, Terminal, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Autonomous Options Pipeline Architecture</h3>
              <p className="text-[11px] text-slate-400">Pre-Market Automated Execution Workflow</p>
            </div>
          </div>
          <button
            id="btn-close-automation-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300 max-h-[75vh] overflow-y-auto">
          
          {/* Pipeline Schedule Banner */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
            <Clock className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-100 text-xs mb-0.5">Pre-Market Automated Cron Schedule</h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                The pipeline runs autonomously Monday through Friday at <strong className="text-cyan-300">8:00 AM CDT/CST (13:00 UTC)</strong>, immediately ahead of the 8:30 AM CDT US market opening bell. The resulting quantitative scan is persisted directly to the daily snapshot cache for instantaneous loading.
              </p>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider text-slate-400">
              Autonomous 6-Step Daily Pipeline Workflow
            </h4>

            <div className="space-y-2 font-sans">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  1
                </div>
                <div>
                  <strong className="text-slate-100 block">Pre-Market Universe Screening</strong>
                  <span className="text-slate-400 text-[11px]">
                    Ingests S&P 500 equities, NASDAQ-100 leaders, and core sector ETFs, evaluating price momentum and open interest.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  2
                </div>
                <div>
                  <strong className="text-slate-100 block">Hard Quantitative Hurdle Filters</strong>
                  <span className="text-slate-400 text-[11px]">
                    Enforces Price ≥ $20, Target 45–60 DTE expiration, Open Interest ≥ 500, and Option Bid-Ask Spread ≤ 5.0%.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  3
                </div>
                <div>
                  <strong className="text-slate-100 block">100-Point Scoring & Delta Strike Selection</strong>
                  <span className="text-slate-400 text-[11px]">
                    Evaluates Black-Scholes Delta (0.70Δ Long Calls, 0.30Δ Short Calls for Spreads or Straight Calls) and scores technical alignment.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  4
                </div>
                <div>
                  <strong className="text-slate-100 block">Section 1: Trade Execution Agent (10 Contracts)</strong>
                  <span className="text-slate-400 text-[11px]">
                    Prompts trader for executed trade rank numbers, automatically calculating capital outlays and risk parameters on a strict 10-contract lot basis.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  5
                </div>
                <div>
                  <strong className="text-slate-100 block">Section 2: Stay / Exit Determination Agent</strong>
                  <span className="text-slate-400 text-[11px]">
                    Daily 8:00 AM position re-evaluation across all 10-contract active trades, generating authoritative Stay vs Exit directives and broker order tickets.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                  6
                </div>
                <div>
                  <strong className="text-slate-100 block">Reports, Drive Sync & Email Dispatch</strong>
                  <span className="text-slate-400 text-[11px]">
                    Exports <code>pre_market_options_report.csv</code>, uploads to Google Drive, and sends the executive morning briefing via SMTP.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Endpoint for Autonomous Waking */}
          <div className="bg-slate-950 p-4 rounded-xl border border-cyan-900/40 space-y-2">
            <h4 className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              External Webhook Trigger (for Cloud Scheduler / cron-job.org):
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Cloud containers automatically idle when closed. To wake the app every weekday at 8:00 AM CDT, set your cron job to ping:
            </p>
            <div className="flex items-center gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 select-all break-all">
              <span>{typeof window !== 'undefined' ? `${window.location.origin}/api/schedule/trigger?async=true` : '/api/schedule/trigger?async=true'}</span>
            </div>
            <div className="text-[10px] text-slate-400 space-y-0.5 pt-1">
              <div>• <strong>Method:</strong> <code>GET</code> or <code>POST</code> (both supported)</div>
              <div>• <strong>Schedule:</strong> 8:00 AM US Central Time (America/Chicago), Mon–Fri</div>
              <div>• <strong>Parameter:</strong> <code>?async=true</code> ensures instant 200 OK acknowledgment to prevent cron timeouts.</div>
            </div>
          </div>

          {/* Environment Variables Reference */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Environment Secrets Configuration:
            </h4>
            <div className="space-y-1 font-mono text-[11px] text-slate-400">
              <div><strong className="text-emerald-400">GEMINI_API_KEY</strong>: Google Gen AI API key for executive strategy synthesis</div>
              <div><strong className="text-cyan-400">SENDER_EMAIL / SENDER_PASSWORD</strong>: SMTP dispatch credentials</div>
              <div><strong className="text-cyan-400">RECIPIENT_EMAIL</strong>: Target recipient for automated morning email alerts</div>
              <div><strong className="text-emerald-400">GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON</strong>: Service account JSON for automated Drive storage</div>
              <div><strong className="text-emerald-400">GOOGLE_DRIVE_FOLDER_ID</strong>: Target Google Drive folder destination for reports</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            id="btn-close-automation-modal-footer"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
