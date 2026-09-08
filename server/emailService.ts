import nodemailer from 'nodemailer';
import { OptionCandidate, StayExitDecision } from '../src/types.js';
import { generateCsvContent } from './googleDriveService.js';

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

/**
 * Creates a Nodemailer transporter based on available environment variables.
 * Supports standard SMTP (host/port/user/pass) or simplified Gmail/service authentication.
 */
function createTransporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER || process.env.SENDER_EMAIL;
  const pass = process.env.SMTP_PASS || process.env.SENDER_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  // If using Gmail or generic service
  if (user.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  // Generic fallback SMTP on default port 587
  return nodemailer.createTransport({
    host: 'smtp.' + user.split('@')[1],
    port,
    secure: false,
    auth: { user, pass },
  });
}

/**
 * Generates an executive-formatted HTML email body
 */
function buildEmailHtml(
  candidates: OptionCandidate[],
  stayExitDecisions: StayExitDecision[],
  briefingText: string = ''
): string {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const top3 = candidates.slice(0, 3);
  const exitDecisions = stayExitDecisions.filter(d => d.decision === 'EXIT');
  const stayDecisions = stayExitDecisions.filter(d => d.decision === 'STAY');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 680px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; overflow: hidden; }
    .header { background: #0f172a; padding: 24px; border-bottom: 1px solid #334155; }
    .badge { display: inline-block; background: #064e3b; color: #34d399; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; margin-bottom: 8px; }
    h1 { margin: 0 0 6px 0; font-size: 20px; color: #ffffff; }
    .subtitle { color: #94a3b8; font-size: 13px; margin: 0; }
    .content { padding: 24px; }
    .alert-box { background: #0f172a; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; line-height: 1.5; color: #cbd5e1; }
    .section-title { font-size: 14px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px; margin: 20px 0 12px 0; border-bottom: 1px solid #334155; padding-bottom: 6px; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 10px; }
    .card-title { font-size: 15px; font-weight: 700; color: #ffffff; display: flex; justify-content: space-between; }
    .card-meta { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .pill-green { background: #064e3b; color: #6ee7b7; }
    .pill-red { background: #7f1d1d; color: #fca5a5; }
    .pill-blue { background: #1e3a8a; color: #93c5fd; }
    .attachment-notice { background: #042f2e; border: 1px solid #0d9488; color: #ccfbf1; padding: 12px 16px; border-radius: 8px; font-size: 12px; margin-top: 24px; display: flex; align-items: center; }
    .footer { background: #0f172a; padding: 16px 24px; border-top: 1px solid #334155; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">8:00 AM CDT Pre-Market Options Report</div>
      <h1>Daily Options Strategy & Execution Briefing</h1>
      <p class="subtitle">${dateStr} &bull; Pre-Market Run (Mon&ndash;Fri 8:00 AM CDT)</p>
    </div>

    <div class="content">
      ${stayExitDecisions.length > 0 ? `
        <div class="section-title">🚨 Active Positions: Stay / Exit Directives (${stayExitDecisions.length} Active)</div>
        <div class="alert-box">
          <strong>Summary:</strong> ${exitDecisions.length} Exit Alerts &bull; ${stayDecisions.length} Stay / Hold Positions.
        </div>
        ${stayExitDecisions.map(d => `
          <div class="card">
            <div class="card-title">
              <span>${d.ticker} &mdash; ${d.strategy} (Rank #${d.rankNumber})</span>
              <span class="pill ${d.decision === 'EXIT' ? 'pill-red' : 'pill-green'}">${d.decision} &bull; ${d.urgency}</span>
            </div>
            <div class="card-meta">
              Entry: $${d.entryStockPrice.toFixed(2)} &bull; Current: $${d.currentStockPrice.toFixed(2)} (${d.stockChangePct >= 0 ? '+' : ''}${d.stockChangePct}%) &bull; Est. P&L: <strong>${d.estimatedPnLPct >= 0 ? '+' : ''}${d.estimatedPnLPct}%</strong> ($${d.estimatedPnLDollars.toFixed(2)})
            </div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 8px;">
              <strong>Action:</strong> <code>${d.suggestedAction}</code>
            </div>
          </div>
        `).join('')}
      ` : ''}

      <div class="section-title">⭐ Top Screened Option Setups (45–60 DTE)</div>
      ${top3.map((c, i) => `
        <div class="card">
          <div class="card-title">
            <span>#${i + 1} ${c.Ticker} &mdash; ${c.Strategy}</span>
            <span class="pill pill-blue">Score: ${c.TotalScore}/100</span>
          </div>
          <div class="card-meta">
            Stock: ${c.FormattedStockPrice} &bull; Exp: ${c.TargetExpiration} (${c.TargetDTE} DTE) &bull; Long Strike: ${c.FormattedLongStrike} (0.70Δ) ${c.ShortStrike ? `&bull; Short Strike: ${c.FormattedShortStrike} (0.30Δ)` : ''}
          </div>
          <div class="card-meta">
            Est. Net Debit: <strong>${c.FormattedEstNetDebit}</strong> &bull; Max Profit: ${c.MaxProfitPotential} &bull; RSI: ${c.RSI} &bull; Spread: ${c.FormattedSpreadPct}
          </div>
        </div>
      `).join('')}

      <div class="attachment-notice">
        📎 <strong>Attached:</strong> <code>pre_market_options_report.csv</code> &mdash; Full CSV data including all ${candidates.length} ranked candidate strikes and active Stay/Exit directives.
      </div>
    </div>

    <div class="footer">
      Automated Quantitative Pre-Market Execution Engine &bull; Scheduled Daily at 8:00 AM CDT (Monday&ndash;Friday) &bull; Risk Discipline: -3% Stop / +6% Profit Target
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends the daily options report email with pre_market_options_report.csv attached.
 */
export async function sendDailyReportEmail(
  candidates: OptionCandidate[],
  stayExitDecisions: StayExitDecision[] = [],
  briefingText: string = '',
  targetRecipient?: string,
  customSubject?: string
): Promise<EmailDispatchResult> {
  const timestamp = new Date().toISOString();
  const recipient = (targetRecipient || process.env.RECIPIENT_EMAIL || process.env.SENDER_EMAIL || '').trim();
  const dateTag = new Date().toISOString().split('T')[0];
  const subject = customSubject || `Pre-Market Options Report (${dateTag}) - 8:00 AM CDT Run [CSV Attached]`;
  const attachmentFileName = `pre_market_options_report_${dateTag}.csv`;

  // 1. Generate full CSV content
  const csvContent = generateCsvContent(candidates, stayExitDecisions);

  const transporter = createTransporter();
  const sender = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'options-engine@tradingdesk.local';

  // If no SMTP credentials configured, simulate dispatch and return rich metadata
  if (!transporter || !recipient) {
    console.log(`[EmailService] Simulated dispatch of ${attachmentFileName} to ${recipient || 'configured recipient'}`);
    return {
      success: true,
      simulated: true,
      recipient: recipient || 'Not specified (set RECIPIENT_EMAIL)',
      subject,
      hasAttachment: true,
      attachmentName: attachmentFileName,
      message: `Email prepared with ${attachmentFileName} attached (${(Buffer.byteLength(csvContent) / 1024).toFixed(1)} KB). To send live emails, configure SENDER_EMAIL/SENDER_PASSWORD and RECIPIENT_EMAIL in Settings > Secrets.`,
      timestamp,
    };
  }

  try {
    const htmlBody = buildEmailHtml(candidates, stayExitDecisions, briefingText);

    const info = await transporter.sendMail({
      from: `"Pre-Market Options Desk" <${sender}>`,
      to: recipient,
      subject,
      html: htmlBody,
      text: `8:00 AM CDT Daily Options Strategy Report\nDate: ${dateTag}\n\nTop Candidates:\n${candidates.slice(0, 5).map((c, i) => `#${i + 1} ${c.Ticker} - ${c.Strategy} - Score: ${c.TotalScore}`).join('\n')}\n\nPlease find the full pre_market_options_report.csv attached.`,
      attachments: [
        {
          filename: attachmentFileName,
          content: csvContent,
          contentType: 'text/csv',
        },
      ],
    });

    console.log(`[EmailService] Live email successfully sent to ${recipient}. MessageId: ${info.messageId}`);

    return {
      success: true,
      simulated: false,
      recipient,
      subject,
      hasAttachment: true,
      attachmentName: attachmentFileName,
      messageId: info.messageId,
      message: `Successfully sent 8:00 AM CDT daily report with ${attachmentFileName} attached to ${recipient}`,
      timestamp,
    };
  } catch (err: any) {
    console.error('[EmailService] SMTP email dispatch error:', err);
    return {
      success: false,
      recipient,
      subject,
      hasAttachment: true,
      attachmentName: attachmentFileName,
      message: `Failed to dispatch email: ${err.message || 'SMTP transport error'}`,
      timestamp,
    };
  }
}
