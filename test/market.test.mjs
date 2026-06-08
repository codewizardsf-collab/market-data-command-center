import test from "node:test";
import assert from "node:assert/strict";
import { createMarketSimulator } from "../src/market-simulator.mjs";
import { buildOrderBook, bestBidAsk } from "../src/order-book.mjs";
import { calculatePortfolio } from "../src/pnl.mjs";
import { calculateRiskSnapshot } from "../src/risk.mjs";

test("market simulator is deterministic for the same seed", () => {
  const options = {
    seed: 99,
    now: () => "2026-06-08T00:00:00.000Z",
    symbols: [{ symbol: "AAPL", price: 200 }]
  };
  const left = createMarketSimulator(options);
  const right = createMarketSimulator(options);

  assert.deepEqual(left.nextSnapshot().ticks, right.nextSnapshot().ticks);
  assert.deepEqual(left.nextSnapshot().ticks, right.nextSnapshot().ticks);
});

test("portfolio mark-to-market calculates day and total pnl", () => {
  const portfolio = calculatePortfolio(
    [{ symbol: "AAPL", quantity: 10, averageCost: 100, realizedPnl: 15 }],
    { AAPL: 110 },
    { AAPL: 108 }
  );

  assert.equal(portfolio.rows[0].marketValue, 1100);
  assert.equal(portfolio.rows[0].dayPnl, 20);
  assert.equal(portfolio.rows[0].unrealizedPnl, 100);
  assert.equal(portfolio.rows[0].totalPnl, 115);
  assert.equal(portfolio.totals.totalPnl, 115);
});

test("order book sorts bids descending and asks ascending", () => {
  const book = buildOrderBook("MSFT", 500, 5);
  const top = bestBidAsk(book);

  assert.equal(book.bids.length, 5);
  assert.equal(book.asks.length, 5);
  assert.ok(book.bids[0].price > book.bids[1].price);
  assert.ok(book.asks[0].price < book.asks[1].price);
  assert.ok(top.spread > 0);
});

test("risk snapshot flags concentrated exposure", () => {
  const portfolio = calculatePortfolio(
    [
      { symbol: "AAPL", quantity: 1000, averageCost: 100, realizedPnl: 0 },
      { symbol: "JPM", quantity: 50, averageCost: 100, realizedPnl: 0 }
    ],
    { AAPL: 140, JPM: 100 },
    { AAPL: 139, JPM: 99 }
  );

  const risk = calculateRiskSnapshot(portfolio);

  assert.equal(risk.status, "watch");
  assert.equal(risk.largestPosition.symbol, "AAPL");
  assert.ok(risk.oneDayVar95 > 0);
});
