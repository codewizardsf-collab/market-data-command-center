import { roundPrice } from "./market-simulator.mjs";

export function buildOrderBook(symbol, midPrice, levels = 8) {
  const symbolWeight = [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const bids = [];
  const asks = [];

  for (let level = 1; level <= levels; level++) {
    const spread = 0.01 + level * 0.03 + (symbolWeight % 7) * 0.002;
    const sizeBase = 100 + ((symbolWeight * level) % 850);

    bids.push({
      price: roundPrice(midPrice - spread),
      size: sizeBase + level * 25,
      venue: level % 2 === 0 ? "BATS" : "ARCA"
    });

    asks.push({
      price: roundPrice(midPrice + spread),
      size: sizeBase + level * 30,
      venue: level % 2 === 0 ? "IEX" : "NASDAQ"
    });
  }

  return {
    symbol,
    bids: bids.sort((left, right) => right.price - left.price),
    asks: asks.sort((left, right) => left.price - right.price),
    generatedAt: new Date().toISOString()
  };
}

export function bestBidAsk(book) {
  return {
    bid: book.bids[0],
    ask: book.asks[0],
    spread: roundPrice(book.asks[0].price - book.bids[0].price)
  };
}
