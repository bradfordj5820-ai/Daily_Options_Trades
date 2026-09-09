import * as fs from 'fs';
import * as path from 'path';

export interface OptionRow {
    ticker: string;
    strategy: string;
    strike: string;
    expiration: string;
    score: number | string;
    [key: string]: any; // Allows additional fields from your JSON
}

export function generateHtmlReport(jsonFilePath: string, outputHtmlPath: string): void {
    if (!fs.existsSync(jsonFilePath)) {
        throw new Error(`JSON report not found at: ${jsonFilePath}`);
    }

    const rawData = fs.readFileSync(jsonFilePath, 'utf8');
    const rows: OptionRow[] = JSON.parse(rawData);

    const currentDate = new Date().toLocaleDateString('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'full'
    });

    const tableRows = rows.map(row => `
        <tr>
            <td><strong>${row.ticker || 'N/A'}</strong></td>
            <td><span class="badge">${row.strategy || 'Options Play'}</span></td>
            <td>${row.strike || 'N/A'}</td>
            <td>${row.expiration || 'N/A'}</td>
            <td><strong>${typeof row.score === 'number' ? row.score.toFixed(1) : (row.score || 'N/A')}</strong></td>
        </tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Daily Options Screening Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f6f8; color: #333; padding: 20px; }
        .container { max-width: 850px; margin: auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; color: #111; border-bottom: 2px solid #eaeaea; padding-bottom: 10px; margin-top: 0; }
        .date { font-size: 13px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eaeaea; font-size: 14px; }
        th { background: #f8f9fa; font-weight: 600; color: #444; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #e3f2fd; color: #0d47a1; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Daily Options Screening Report</h1>
        <div class="date">Generated automatically on ${currentDate}</div>
        <table>
            <thead>
                <tr>
                    <th>Ticker</th>
                    <th>Strategy</th>
                    <th>Strike</th>
                    <th>Expiration</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows || '<tr><td colspan="5" style="text-align:center;">No qualifying options signals found today.</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>`;

    // Ensure output directory exists
    const dir = path.dirname(outputHtmlPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputHtmlPath, htmlContent, 'utf8');
}
