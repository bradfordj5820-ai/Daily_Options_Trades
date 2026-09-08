import { google } from 'googleapis';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { OptionCandidate, StayExitDecision } from '../src/types.js';

export interface DriveUploadResult {
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

/**
 * Generate CSV content string from OptionCandidate list and Stay/Exit decisions
 */
export function generateCsvContent(
  candidates: OptionCandidate[],
  stayExitDecisions: StayExitDecision[] = []
): string {
  const sections: string[] = [];

  // If there are active Stay/Exit decisions, add them right at the top of the CSV report
  if (stayExitDecisions && stayExitDecisions.length > 0) {
    sections.push('# --- SECTION 1: ACTIVE TRADES STAY/EXIT DECISIONS ---');
    const stayExitHeaders = [
      'Rank Placed',
      'Ticker',
      'Decision',
      'Urgency',
      'Strategy',
      'Entry Stock Price',
      'Current Stock Price',
      'Stock Change %',
      'Entry Net Debit',
      'Est Option Value',
      'Est PnL %',
      'Est PnL $',
      'Contracts',
      'Days Held',
      'Remaining DTE',
      'Suggested Action',
      'Detailed Analysis',
    ];

    const stayExitRows = stayExitDecisions.map(d => [
      d.rankNumber,
      `"${d.ticker}"`,
      `"${d.decision}"`,
      `"${d.urgency}"`,
      `"${d.strategy}"`,
      `"$${d.entryStockPrice.toFixed(2)}"`,
      `"$${d.currentStockPrice.toFixed(2)}"`,
      `"${d.stockChangePct >= 0 ? '+' : ''}${d.stockChangePct}%"`,
      `"$${d.entryNetDebit.toFixed(2)}"`,
      `"$${d.estimatedCurrentOptionValue.toFixed(2)}"`,
      `"${d.estimatedPnLPct >= 0 ? '+' : ''}${d.estimatedPnLPct}%"`,
      `"$${d.estimatedPnLDollars.toFixed(2)}"`,
      d.contracts,
      d.daysHeld,
      d.remainingDTE,
      `"${(d.suggestedAction || '').replace(/"/g, '""')}"`,
      `"${(d.detailedAnalysis || '').replace(/"/g, '""')}"`,
    ]);

    sections.push(stayExitHeaders.join(','));
    sections.push(...stayExitRows.map(r => r.join(',')));
    sections.push(''); // blank separator line
    sections.push('# --- SECTION 2: SCREENED PRE-MARKET OPTION CANDIDATES ---');
  }

  const headers = [
    'Rank',
    'Ticker',
    'Total Score',
    'Stock Price',
    'Strategy',
    'Target DTE',
    'Long Strike (0.70Δ)',
    'Short Strike (0.30Δ)',
    'Est. Net Debit',
    'Max Profit Potential',
    'RSI',
    'Spread %',
    'Open Interest',
  ];

  const rows = candidates.map((c, i) => [
    i + 1,
    `"${c.Ticker}"`,
    c.TotalScore,
    `"${c.FormattedStockPrice}"`,
    `"${c.Strategy}"`,
    c.TargetDTE,
    `"${c.FormattedLongStrike}"`,
    `"${c.FormattedShortStrike}"`,
    `"${c.FormattedEstNetDebit}"`,
    `"${(c.MaxProfitPotential || '').replace(/"/g, '""')}"`,
    c.RSI,
    `"${c.FormattedSpreadPct}"`,
    c.OpenInterest,
  ]);

  sections.push(headers.join(','));
  sections.push(...rows.map(row => row.join(',')));

  return sections.join('\n');
}

/**
 * Parses the GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON environment variable.
 * Supports direct JSON string, base64 encoded JSON, or file path.
 */
function parseServiceAccountCredentials(): any | null {
  const raw = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
  if (!raw || !raw.trim()) {
    return null;
  }

  const trimmed = raw.trim();

  // Try direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {
    // Try base64 decoded JSON parse
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      // Try file path if it exists
      try {
        if (fs.existsSync(trimmed)) {
          const fileContent = fs.readFileSync(trimmed, 'utf-8');
          return JSON.parse(fileContent);
        }
      } catch (err) {
        console.error('Failed to read service account from file path:', err);
      }
    }
  }

  return null;
}

/**
 * Saves pre_market_options_report.csv locally and uploads it directly to Google Drive
 * using GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON and GOOGLE_DRIVE_FOLDER_ID
 */
export async function saveReportToGoogleDrive(
  candidates: OptionCandidate[],
  fileName: string = 'pre_market_options_report.csv',
  stayExitDecisions: StayExitDecision[] = []
): Promise<DriveUploadResult> {
  const timestamp = new Date().toISOString();
  const csvData = generateCsvContent(candidates, stayExitDecisions);

  // 1. Always save a copy locally
  try {
    const localFilePath = path.join(process.cwd(), fileName);
    fs.writeFileSync(localFilePath, csvData, 'utf-8');
    console.log(`[GoogleDriveService] Local report saved to ${localFilePath}`);
  } catch (err) {
    console.error('[GoogleDriveService] Local file write error:', err);
  }

  const credentials = parseServiceAccountCredentials();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  const clientEmail = credentials?.client_email || undefined;

  // If no credentials provided, return structured status
  if (!credentials) {
    return {
      success: false,
      simulated: true,
      fileName,
      folderId,
      message: `Report generated (${candidates.length} candidates, ${stayExitDecisions.length} active positions). Google Drive auto-save is pending configuration of GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON.`,
      timestamp,
    };
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    const drive = google.drive({ version: 'v3', auth });

    const getFreshMedia = () => ({
      mimeType: 'text/csv',
      body: Readable.from([Buffer.from(csvData, 'utf-8')]),
    });

    // First, test or attempt upload with folderId if provided
    let targetFolderId: string | null = folderId || null;
    let isFallbackToRoot = false;

    // Check if file already exists
    let existingFileId: string | null = null;
    if (targetFolderId) {
      try {
        const listRes = await drive.files.list({
          q: `name = '${fileName}' and '${targetFolderId}' in parents and trashed = false`,
          fields: 'files(id, name, webViewLink)',
          spaces: 'drive',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        if (listRes.data.files && listRes.data.files.length > 0) {
          existingFileId = listRes.data.files[0].id || null;
        }
      } catch (listErr: any) {
        console.warn(`[GoogleDriveService] Folder check query error (${listErr.message}).`);
        // If folder is not found/not shared (404), fall back to root
        if (listErr.message?.includes('File not found') || listErr.status === 404) {
          targetFolderId = null;
          isFallbackToRoot = true;
        }
      }
    }

    // If no target folder (or fell back to root), check root files
    if (!existingFileId && !targetFolderId) {
      try {
        const rootListRes = await drive.files.list({
          q: `name = '${fileName}' and trashed = false`,
          fields: 'files(id, name, webViewLink)',
          spaces: 'drive',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        });
        if (rootListRes.data.files && rootListRes.data.files.length > 0) {
          existingFileId = rootListRes.data.files[0].id || null;
        }
      } catch {
        // Continue to create
      }
    }

    let response;
    let uploadSuccess = false;

    if (existingFileId) {
      // Update existing file content with fresh media stream
      try {
        response = await drive.files.update({
          fileId: existingFileId,
          media: getFreshMedia(),
          fields: 'id, name, webViewLink',
          supportsAllDrives: true,
        });
        uploadSuccess = true;
        console.log(`[GoogleDriveService] Updated existing Google Drive file: ${existingFileId}`);
      } catch (updateErr: any) {
        console.warn(`[GoogleDriveService] Update failed (${updateErr.message}), trying create...`);
      }
    }

    if (!uploadSuccess) {
      const fileMetadata: any = {
        name: fileName,
      };
      if (targetFolderId) {
        fileMetadata.parents = [targetFolderId];
      }

      try {
        response = await drive.files.create({
          requestBody: fileMetadata,
          media: getFreshMedia(),
          fields: 'id, name, webViewLink',
          supportsAllDrives: true,
        });
        uploadSuccess = true;
        console.log(`[GoogleDriveService] Created Google Drive file: ${response.data.id}`);
      } catch (createErr: any) {
        // If creating inside folderId failed with 'File not found' (404), fallback to service account root drive
        if (targetFolderId && (createErr.message?.includes('File not found') || createErr.status === 404)) {
          console.warn(`[GoogleDriveService] Folder "${targetFolderId}" not found or not shared with ${clientEmail}. Retrying upload to Drive root...`);
          isFallbackToRoot = true;
          const rootMetadata = { name: fileName };
          response = await drive.files.create({
            requestBody: rootMetadata,
            media: getFreshMedia(),
            fields: 'id, name, webViewLink',
            supportsAllDrives: true,
          });
          uploadSuccess = true;
          console.log(`[GoogleDriveService] Saved file to Drive root: ${response.data.id}`);
        } else {
          throw createErr;
        }
      }
    }

    const uploadedFileId = response?.data?.id || existingFileId || undefined;
    const webViewLink = response?.data?.webViewLink || undefined;

    let statusMessage = `Successfully saved ${fileName} to Google Drive`;
    if (isFallbackToRoot) {
      statusMessage = `Saved ${fileName} to Service Account Google Drive. Note: Target folder "${folderId}" is not shared with service account. To save directly into that folder, open Google Drive, right-click the folder, click Share, and grant Editor access to: ${clientEmail}`;
    } else if (folderId) {
      statusMessage += ` (Folder: ${folderId})`;
    }

    return {
      success: true,
      fileId: uploadedFileId,
      fileName,
      folderId: isFallbackToRoot ? undefined : folderId,
      webViewLink,
      serviceAccountEmail: clientEmail,
      message: statusMessage,
      timestamp,
    };
  } catch (err: any) {
    console.error('[GoogleDriveService] Drive upload error:', err);
    let errMsg = err.message || 'Unknown error';
    if (errMsg.includes('File not found') && folderId) {
      errMsg = `Target folder "${folderId}" was not found or is not shared. Please share the Google Drive folder with your service account email: ${clientEmail || 'your service account email'} (give Editor permissions).`;
    }
    return {
      success: false,
      fileName,
      folderId,
      serviceAccountEmail: clientEmail,
      message: `Google Drive upload failed: ${errMsg}`,
      timestamp,
    };
  }
}

/**
 * Backup active placed trades directly to portfolio_trades.json in Google Drive
 */
export async function savePortfolioBackupToGoogleDrive(trades: any[]): Promise<boolean> {
  const credentials = parseServiceAccountCredentials();
  if (!credentials) return false;

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const fileName = 'portfolio_trades.json';
    const jsonStr = JSON.stringify(trades, null, 2);
    const media = {
      mimeType: 'application/json',
      body: Readable.from([Buffer.from(jsonStr, 'utf-8')]),
    };

    // Check if file exists
    let existingFileId: string | null = null;
    try {
      let q = `name = '${fileName}' and trashed = false`;
      if (folderId) {
        q += ` and '${folderId}' in parents`;
      }
      const listRes = await drive.files.list({
        q,
        fields: 'files(id, name)',
        spaces: 'drive',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      if (listRes.data.files && listRes.data.files.length > 0) {
        existingFileId = listRes.data.files[0].id || null;
      }
    } catch {
      // Continue to create or update
    }

    if (existingFileId) {
      await drive.files.update({
        fileId: existingFileId,
        media,
        fields: 'id, name',
        supportsAllDrives: true,
      });
      console.log(`[GoogleDriveService] Updated portfolio backup in Google Drive: ${existingFileId}`);
    } else {
      const fileMetadata: any = { name: fileName };
      if (folderId) fileMetadata.parents = [folderId];
      const createRes = await drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, name',
        supportsAllDrives: true,
      });
      console.log(`[GoogleDriveService] Created portfolio backup in Google Drive: ${createRes.data.id}`);
    }
    return true;
  } catch (err: any) {
    console.warn('[GoogleDriveService] Failed to backup portfolio to Google Drive:', err.message);
    return false;
  }
}

/**
 * Restore placed trades from portfolio_trades.json in Google Drive if container disk is fresh
 */
export async function loadPortfolioBackupFromGoogleDrive(): Promise<any[] | null> {
  const credentials = parseServiceAccountCredentials();
  if (!credentials) return null;

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  try {
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const fileName = 'portfolio_trades.json';
    let q = `name = '${fileName}' and trashed = false`;
    if (folderId) {
      q += ` and '${folderId}' in parents`;
    }

    const listRes = await drive.files.list({
      q,
      fields: 'files(id, name)',
      spaces: 'drive',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (!listRes.data.files || listRes.data.files.length === 0) {
      return null;
    }

    const fileId = listRes.data.files[0].id;
    if (!fileId) return null;

    const fileRes = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'text' }
    );

    if (typeof fileRes.data === 'string') {
      const parsed = JSON.parse(fileRes.data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[GoogleDriveService] Restored ${parsed.length} trades from Google Drive backup.`);
        return parsed;
      }
    } else if (Array.isArray(fileRes.data)) {
      return fileRes.data;
    }
  } catch (err: any) {
    console.warn('[GoogleDriveService] Could not load portfolio backup from Google Drive:', err.message);
  }
  return null;
}

