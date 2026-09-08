import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2, AlertTriangle, Download, Paperclip, Clock, ShieldCheck } from 'lucide-react';
import { OptionCandidate, StayExitDecision, EmailDispatchResult } from '../types.ts';

interface EmailDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: OptionCandidate[];
  stayExitDecisions: StayExitDecision[];
  lastEmailResult: EmailDispatchResult | null;
  onEmailDispatched: (result: EmailDispatchResult) => void;
}

export const EmailDispatchModal: React.FC<EmailDispatchModalProps> = ({
  isOpen,
  onClose,
  candidates,
  stayExitDecisions,
  lastEmailResult,
  onEmailDispatched,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] = useState<EmailDispatchResult | null>(lastEmailResult);

  if (!isOpen) return null;

  const dateTag = new Date().toISOString().split('T')[0];
  const defaultSubject = `Pre-Market Options Report (${dateTag}) - 8:00 AM CDT Run [CSV Attached]`;
  const attachmentName = `pre_market_options_report_${dateTag}.csv`;

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/dispatch-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: recipient.trim() || undefined,
          subject: subject.trim() || defaultSubject,
        }),
      });

      const data: EmailDispatchResult = await res.json();
      setDispatchResult(data);
      onEmailDispatched(data);

      if (data.success) {
        setStatusMessage(data.message);
      } else {
        setStatusMessage(`Error: ${data.message}`);
      }
    } catch (err: any) {
      console.error('Email dispatch failed:', err);
      setStatusMessage(`Dispatch error: ${err.message || 'Network error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleDownloadCsv = () => {
    window.location.href = '/api/download-csv';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Email Options Report & CSV Attachment</h3>
              <p className="text-[11px] text-slate-400">8:00 AM CDT Daily Execution Summary with Attached Dataset</p>
            </div>
          </div>
          <button
            id="btn-close-email-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/60 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-300 max-h-[75vh] overflow-y-auto">
          
          {/* Automatic Attachment Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Paperclip className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100 text-xs">CSV Attachment Included:</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {attachmentName}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1">
                Contains all <strong>{candidates.length} screened option candidate strikes</strong> (0.70Δ / 0.30Δ) and <strong>{stayExitDecisions.length} active Stay/Exit directives</strong> with entry debits and P&L tracking.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  id="btn-modal-download-csv"
                  onClick={handleDownloadCsv}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  Download CSV Directly
                </button>
              </div>
            </div>
          </div>

          {/* Daily Schedule Banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2.5 text-[11px] text-slate-400">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Automated 8:00 AM CDT Schedule:</strong> After the Monday–Friday 8:00 AM CDT run completes, the daily report and attached CSV are automatically dispatched to your configured recipient.
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSendEmail} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Recipient Email Address <span className="text-slate-500 font-normal">(Leave blank to use RECIPIENT_EMAIL secret)</span>
              </label>
              <input
                id="input-recipient-email"
                type="email"
                placeholder="e.g., trader@example.com"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Subject
              </label>
              <input
                id="input-email-subject"
                type="text"
                placeholder={defaultSubject}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                dispatchResult?.success 
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
              }`}>
                {dispatchResult?.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{statusMessage}</p>
                  {dispatchResult?.hasAttachment && (
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Attached File: <code>{dispatchResult.attachmentName}</code>
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                SMTP & Direct Simulation Active
              </span>
              <button
                type="submit"
                id="btn-submit-send-email"
                disabled={isSending}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
                {isSending ? 'Dispatching...' : 'Send Email with CSV Now'}
              </button>
            </div>
          </form>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            id="btn-close-email-modal-footer"
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
