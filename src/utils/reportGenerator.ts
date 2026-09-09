import * as fs from 'fs';
import * as path from 'path';

export function generateHtmlReport(jsonFilePath: string, outputHtmlPath: string): void {
    if (!fs.existsSync(jsonFilePath)) {
        console.warn(`[REPORT] Dataset JSON not found at: ${jsonFilePath}. Creating empty fallback report.`);
    }

    let candidates: any[] = [];
    try {
        const rawData = fs.readFileSync(jsonFilePath, 'utf8');
        const parsed = JSON.parse(rawData);
        // Supports both raw candidate arrays and the structured daily dataset object
        candidates = Array.isArray(parsed) ? parsed : (parsed.candidates || []);
    } catch (e) {
        console.error('Error parsing dataset JSON for HTML report:', e);
    }

    const currentDate = new Date().toLocaleDateString('en-US', {
        timeZone: 'America/Chicago',
        dateStyle: 'full'
    });

    const tableRows = candidates.map(row => `
        <tr>
            <td><strong>${row.Ticker || row.ticker || 'N/A'}</strong></td>
            <td><span class="badge">${row.Strategy || row.strategy || 'Options Play'}</span></td>
            <td>$${row.LongStrike || row.longStrike || 'N/A'}</td>
            <td>${row.TargetExpiration || row.targetExpiration || 'N/A'}</td>
            <td><strong>${typeof row.TotalScore === 'number' ? row.TotalScore.toFixed(1) : (row.TotalScore || 'N/A')}</strong></td>
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
                    <th>Long Strike</th>
                    <th>Expiration</th>
                    <th>Total Score</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows || '<tr><td colspan="5" style="text-align:center;">No qualifying options signals found today.</td></tr>'}
            </tbody>
        </table>
    </div>
</body>
</html>`;

    const dir = path.dirname(outputHtmlPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputHtmlPath, htmlContent, 'utf8');
}
