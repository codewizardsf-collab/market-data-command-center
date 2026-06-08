import { roundMoney } from "./pnl.mjs";

export function calculateRiskSnapshot(portfolio) {
  const grossExposure = roundMoney(portfolio.rows.reduce((sum, row) => sum + Math.abs(row.marketValue), 0));
  const netExposure = roundMoney(portfolio.rows.reduce((sum, row) => sum + row.marketValue, 0));
  const largestPosition = portfolio.rows
    .map(row => ({
      symbol: row.symbol,
      exposure: Math.abs(row.marketValue),
      concentrationPercent: grossExposure === 0 ? 0 : Math.round((Math.abs(row.marketValue) / grossExposure) * 10000) / 100
    }))
    .sort((left, right) => right.exposure - left.exposure)[0];

  const oneDayVar95 = roundMoney(grossExposure * 0.018);

  return {
    grossExposure,
    netExposure,
    oneDayVar95,
    largestPosition,
    status: largestPosition?.concentrationPercent > 35 ? "watch" : "normal"
  };
}
