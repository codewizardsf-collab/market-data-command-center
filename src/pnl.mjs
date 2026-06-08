import { roundPrice } from "./market-simulator.mjs";

export const defaultPositions = [
  { symbol: "AAPL", quantity: 820, averageCost: 201.32, realizedPnl: 1420.18 },
  { symbol: "MSFT", quantity: 410, averageCost: 462.1, realizedPnl: 812.44 },
  { symbol: "NVDA", quantity: 1250, averageCost: 121.74, realizedPnl: 2410.8 },
  { symbol: "JPM", quantity: -360, averageCost: 268.9, realizedPnl: 520.2 },
  { symbol: "TSLA", quantity: 530, averageCost: 188.26, realizedPnl: -940.5 }
];

export function calculatePositionPnl(position, marketPrice, previousClose) {
  const marketValue = roundMoney(position.quantity * marketPrice);
  const costBasis = roundMoney(position.quantity * position.averageCost);
  const unrealizedPnl = roundMoney(marketValue - costBasis);
  const dayPnl = roundMoney(position.quantity * (marketPrice - previousClose));
  const totalPnl = roundMoney(position.realizedPnl + unrealizedPnl);

  return {
    ...position,
    marketPrice,
    previousClose,
    marketValue,
    costBasis,
    dayPnl,
    unrealizedPnl,
    totalPnl
  };
}

export function calculatePortfolio(positions, prices, previousClosePrices) {
  const rows = positions.map(position => calculatePositionPnl(
    position,
    prices[position.symbol],
    previousClosePrices[position.symbol]
  ));

  return {
    rows,
    totals: {
      marketValue: roundMoney(rows.reduce((sum, row) => sum + row.marketValue, 0)),
      dayPnl: roundMoney(rows.reduce((sum, row) => sum + row.dayPnl, 0)),
      unrealizedPnl: roundMoney(rows.reduce((sum, row) => sum + row.unrealizedPnl, 0)),
      realizedPnl: roundMoney(rows.reduce((sum, row) => sum + row.realizedPnl, 0)),
      totalPnl: roundMoney(rows.reduce((sum, row) => sum + row.totalPnl, 0))
    }
  };
}

export function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
