import { OptionCandidate } from '../types.ts';

export function exportCandidatesToCsv(candidates: OptionCandidate[], filename: string = 'pre_market_options_report.csv') {
  if (!candidates || candidates.length === 0) return;

  const headers = [
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

  const rows = candidates.map(c => [
    `"${c.Ticker}"`,
    c.TotalScore,
    `"${c.FormattedStockPrice}"`,
    `"${c.Strategy}"`,
    c.TargetDTE,
    `"${c.FormattedLongStrike}"`,
    `"${c.FormattedShortStrike}"`,
    `"${c.FormattedEstNetDebit}"`,
    `"${c.MaxProfitPotential.replace(/"/g, '""')}"`,
    c.RSI,
    `"${c.FormattedSpreadPct}"`,
    c.OpenInterest,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
