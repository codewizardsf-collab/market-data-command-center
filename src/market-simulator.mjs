export function createSeededRandom(seed = 42) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function createMarketSimulator(options = {}) {
  const random = createSeededRandom(options.seed ?? 20260608);
  const now = options.now ?? (() => new Date().toISOString());
  const symbols = options.symbols ?? [
    { symbol: "AAPL", price: 214.42 },
    { symbol: "MSFT", price: 493.88 },
    { symbol: "NVDA", price: 142.63 },
    { symbol: "JPM", price: 273.44 },
    { symbol: "TSLA", price: 178.61 }
  ];

  const state = new Map(symbols.map(item => [
    item.symbol,
    {
      symbol: item.symbol,
      price: item.price,
      previousClose: roundPrice(item.price * (0.985 + random() * 0.03)),
      volume: 100000 + Math.floor(random() * 800000),
      history: [item.price]
    }
  ]));

  return {
    nextSnapshot() {
      const asOf = now();
      const ticks = [...state.values()].map(item => {
        const drift = (random() - 0.49) * 0.006;
        const shock = random() > 0.985 ? (random() - 0.5) * 0.045 : 0;
        item.price = roundPrice(Math.max(1, item.price * (1 + drift + shock)));
        item.volume += Math.floor(500 + random() * 4500);
        item.history = [...item.history.slice(-80), item.price];

        return {
          symbol: item.symbol,
          price: item.price,
          previousClose: item.previousClose,
          change: roundPrice(item.price - item.previousClose),
          changePercent: roundPercent(((item.price - item.previousClose) / item.previousClose) * 100),
          volume: item.volume,
          history: item.history,
          asOf
        };
      });

      return { asOf, ticks };
    },

    currentPrices() {
      return Object.fromEntries([...state.values()].map(item => [item.symbol, item.price]));
    },

    previousClosePrices() {
      return Object.fromEntries([...state.values()].map(item => [item.symbol, item.previousClose]));
    }
  };
}

export function roundPrice(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundPercent(value) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000;
}
