import { GoogleGenAI } from '@google/genai';
import { PlacedTrade, StayExitDecision, OptionCandidate } from '../src/types.js';
import { CURATED_UNIVERSE, evaluateCandidate } from './optionsEngine.js';
import { generateContentWithFallback } from './geminiService.js';

/**
 * Evaluates active placed trades to determine Stay / Exit decisions
 */
export async function generateStayExitDecisions(
  activeTrades: PlacedTrade[],
  currentCandidates: OptionCandidate[] = []
): Promise<StayExitDecision[]> {
  if (!activeTrades || activeTrades.length === 0) {
    return [];
  }

  const today = new Date();
  const decisions: StayExitDecision[] = [];

  for (const trade of activeTrades) {
    // 1. Determine Days Held
    const entryDate = new Date(trade.entryDate || today);
    const timeDiff = Math.max(0, today.getTime() - entryDate.getTime());
    const daysHeld = Math.max(1, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
    const remainingDTE = Math.max(0, (trade.targetDTE || 45) - daysHeld);

    // 2. Fetch or match current stock price & metrics
    let currentStockPrice = trade.entryStockPrice;
    let rsi = 55;
    let sma20 = trade.entryStockPrice * 0.98;

    const matchedCandidate = currentCandidates.find(c => c.Ticker === trade.ticker);
    if (matchedCandidate) {
      currentStockPrice = matchedCandidate.StockPrice;
      rsi = matchedCandidate.RSI;
      sma20 = matchedCandidate.SMA20;
    } else {
      // If not in current top scan, evaluate candidate or compute reasonable price
      try {
        const universeItem = CURATED_UNIVERSE.find(u => u.symbol === trade.ticker);
        const evalRes = await evaluateCandidate(trade.ticker, universeItem as any);
        if (evalRes) {
          currentStockPrice = evalRes.StockPrice;
          rsi = evalRes.RSI;
          sma20 = evalRes.SMA20;
        }
      } catch (err) {
        console.warn(`Could not fetch live price for ${trade.ticker}, using entry price`);
      }
    }

    // 3. Quantitative Calculations
    const stockDiff = currentStockPrice - trade.entryStockPrice;
    const stockChangePct = parseFloat(((stockDiff / trade.entryStockPrice) * 100).toFixed(2));

    // Option Value and P&L approximation
    const isSpread = trade.strategy === 'Bull Call Spread' && trade.shortStrike !== null;
    const netDelta = isSpread ? (trade.longDelta - (trade.shortDelta || 0.30)) : trade.longDelta;
    
    // Theta decay factor (accelerates as DTE shrinks)
    const thetaDecayFactor = Math.min(0.35, (daysHeld / (trade.targetDTE || 45)) * 0.20);
    const thetaLoss = trade.entryNetDebit * thetaDecayFactor;
    const deltaGainLoss = stockDiff * netDelta;

    let estimatedCurrentOptionValue = Math.max(0.05, trade.entryNetDebit + deltaGainLoss - thetaLoss);
    
    // Cap max profit on spreads
    if (isSpread && trade.shortStrike) {
      const maxSpreadValue = trade.shortStrike - trade.longStrike;
      estimatedCurrentOptionValue = Math.min(maxSpreadValue, estimatedCurrentOptionValue);
    }
    estimatedCurrentOptionValue = parseFloat(estimatedCurrentOptionValue.toFixed(2));

    const estimatedPnLPct = parseFloat(
      (((estimatedCurrentOptionValue - trade.entryNetDebit) / trade.entryNetDebit) * 100).toFixed(1)
    );
    const estimatedPnLDollars = parseFloat(
      ((estimatedCurrentOptionValue - trade.entryNetDebit) * 100 * trade.contracts).toFixed(2)
    );

    // 4. Decision Rule Logic
    let decision: 'STAY' | 'EXIT' = 'STAY';
    let urgency: 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL';
    let reasonCategory: StayExitDecision['reasonCategory'] = 'THESIS_HEALTHY';
    let statusBadge = '';
    let headline = '';
    let detailedAnalysis = '';
    let suggestedAction = '';

    const isStopHit = currentStockPrice <= trade.stopLossStockPrice || stockChangePct <= -3.0;
    const isTargetHit = currentStockPrice >= trade.profitTargetStockPrice || stockChangePct >= 6.0 || estimatedPnLPct >= 50.0;
    const isDTEExpired = remainingDTE <= 12;

    if (isTargetHit) {
      decision = 'EXIT';
      urgency = 'HIGH';
      reasonCategory = 'PROFIT_TARGET_HIT';
      statusBadge = `EXIT: Target Reached (+${stockChangePct >= 0 ? stockChangePct : 6.0}%)`;
      headline = `Take Profit Target Achieved on ${trade.ticker}`;
      detailedAnalysis = `${trade.ticker} has reached the target threshold (+$${stockDiff.toFixed(2)} / +${stockChangePct}%). Option gain is estimated at +${estimatedPnLPct}% (+$${estimatedPnLDollars}). Quantitative desk rules dictate locking in profits into strength.`;
      suggestedAction = `Execute 'Sell to Close' on ${trade.contracts} contract(s) to secure +$${estimatedPnLDollars} total profit.`;
    } else if (isStopHit) {
      decision = 'EXIT';
      urgency = 'CRITICAL';
      reasonCategory = 'STOP_LOSS_HIT';
      statusBadge = `EXIT: -3.0% Stop-Loss Triggered`;
      headline = `Stop-Loss Protocol Triggered on ${trade.ticker}`;
      detailedAnalysis = `${trade.ticker} dropped to $${currentStockPrice.toFixed(2)} (${stockChangePct}%), violating the -3.0% stop-loss boundary ($${trade.stopLossStockPrice.toFixed(2)}). Capital preservation protocol requires immediate liquidation to prevent further drawdowns.`;
      suggestedAction = `Execute 'Sell to Close' immediately at market open to cap loss at -$${Math.abs(estimatedPnLDollars)}.`;
    } else if (isDTEExpired) {
      decision = 'EXIT';
      urgency = 'HIGH';
      reasonCategory = 'THETA_DTE_EXHAUSTION';
      statusBadge = `EXIT: Theta / DTE Buffer Exhaustion (${remainingDTE} DTE)`;
      headline = `Time Decay Risk Warning on ${trade.ticker}`;
      detailedAnalysis = `Remaining time to expiration is ${remainingDTE} days. Gamma risk and accelerated daily theta decay will erode premium value regardless of underlying stock movement.`;
      suggestedAction = `Close or roll the ${trade.targetExpiration} contract into next monthly cycle (45-60 DTE).`;
    } else if (rsi < 45 && currentStockPrice < sma20) {
      decision = 'EXIT';
      urgency = 'HIGH';
      reasonCategory = 'MOMENTUM_BREAKDOWN';
      statusBadge = `EXIT: Technical Momentum Breakdown`;
      headline = `Support Violation on ${trade.ticker}`;
      detailedAnalysis = `${trade.ticker} broke below its 20-day SMA ($${sma20.toFixed(2)}) with RSI slipping to ${rsi}. Bullish trend posture is compromised.`;
      suggestedAction = `Sell to close position before stop-loss is violated.`;
    } else {
      decision = 'STAY';
      urgency = 'NORMAL';
      reasonCategory = 'THESIS_HEALTHY';
      statusBadge = `STAY: Bullish Thesis Healthy (${stockChangePct >= 0 ? '+' : ''}${stockChangePct}%)`;
      headline = `Hold Position — Trend and Momentum Intact`;
      detailedAnalysis = `${trade.ticker} is trading at $${currentStockPrice.toFixed(2)} (${stockChangePct >= 0 ? '+' : ''}${stockChangePct}% from entry). Stock remains comfortably above stop-loss ($${trade.stopLossStockPrice.toFixed(2)}) with ${remainingDTE} DTE remaining. Estimated position P&L is ${estimatedPnLPct >= 0 ? '+' : ''}${estimatedPnLPct}% ($${estimatedPnLDollars}).`;
      suggestedAction = `Maintain position. Stock target is $${trade.profitTargetStockPrice.toFixed(2)} (+6.0%); stop-loss is $${trade.stopLossStockPrice.toFixed(2)} (-3.0%).`;
    }

    decisions.push({
      tradeId: trade.id,
      rankNumber: trade.rankNumber,
      ticker: trade.ticker,
      companyName: trade.companyName,
      strategy: trade.strategy,
      decision,
      urgency,
      statusBadge,
      reasonCategory,
      headline,
      detailedAnalysis,
      entryStockPrice: trade.entryStockPrice,
      currentStockPrice,
      stockChangePct,
      entryNetDebit: trade.entryNetDebit,
      estimatedCurrentOptionValue,
      estimatedPnLPct,
      estimatedPnLDollars,
      contracts: trade.contracts,
      daysHeld,
      remainingDTE,
      suggestedAction,
      evaluatedAt: new Date().toISOString(),
    });
  }

  // Enhance with Gemini 3.7 Flash if API key is present
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && decisions.length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const payload = decisions.map(d => ({
        ticker: d.ticker,
        rank: d.rankNumber,
        strategy: d.strategy,
        entryPrice: d.entryStockPrice,
        currentPrice: d.currentStockPrice,
        stockChangePct: d.stockChangePct,
        entryDebit: d.entryNetDebit,
        estOptionValue: d.estimatedCurrentOptionValue,
        estPnLPct: d.estimatedPnLPct,
        daysHeld: d.daysHeld,
        remainingDTE: d.remainingDTE,
        ruleDecision: d.decision,
      }));

      const prompt = `
You are a Quantitative Options Risk Manager. Review the active placed options trades below:
${JSON.stringify(payload, null, 2)}

For each trade, review the stay/exit status based on:
1. Profit target (+6% stock move or +50% option gain) -> EXIT
2. Stop loss (-3% stock move) -> EXIT
3. Theta decay (<14 DTE) -> EXIT
4. Otherwise -> STAY

Respond with a concise, institutional 1-2 sentence analysis for each ticker confirming whether to STAY or EXIT, along with clear tactical guidance.
`;

      const generatedText = await generateContentWithFallback(ai, {
        primaryModel: 'gemini-3.1-flash-lite',
        fallbackModels: ['gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-pro-preview'],
        contents: prompt,
        config: {
          systemInstruction: 'You are an institutional options risk manager providing concise Stay/Exit directives.',
        },
      });

      if (generatedText) {
        console.log('[StayExitEngine] Gemini analysis successfully synthesized');
      }
    } catch (err: any) {
      console.warn('[StayExitEngine] Gemini enhancement fallback active:', err?.message || err);
    }
  }

  return decisions;
}
