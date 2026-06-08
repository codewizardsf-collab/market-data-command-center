const state = {
  selectedSymbol: "AAPL",
  snapshot: null
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

const integerFormatter = new Intl.NumberFormat("en-US");

const elements = {
  connectionState: document.querySelector("#connectionState"),
  lastUpdate: document.querySelector("#lastUpdate"),
  symbolSelect: document.querySelector("#symbolSelect"),
  priceChart: document.querySelector("#priceChart"),
  grossExposure: document.querySelector("#grossExposure"),
  netExposure: document.querySelector("#netExposure"),
  var95: document.querySelector("#var95"),
  largestPosition: document.querySelector("#largestPosition"),
  riskStatus: document.querySelector("#riskStatus"),
  portfolioRows: document.querySelector("#portfolioRows"),
  bidRows: document.querySelector("#bidRows"),
  askRows: document.querySelector("#askRows"),
  spreadValue: document.querySelector("#spreadValue")
};

elements.symbolSelect.addEventListener("change", async event => {
  state.selectedSymbol = event.target.value;
  drawChart();
  await renderOrderBook();
});

const events = new EventSource("/events");

events.addEventListener("open", () => {
  elements.connectionState.textContent = "Live";
  elements.connectionState.classList.add("live");
});

events.addEventListener("error", () => {
  elements.connectionState.textContent = "Reconnecting";
  elements.connectionState.classList.remove("live");
});

events.addEventListener("snapshot", async event => {
  state.snapshot = JSON.parse(event.data);
  hydrateSymbols(state.snapshot.ticks);
  renderSnapshot();
  await renderOrderBook();
});

function hydrateSymbols(ticks) {
  if (elements.symbolSelect.options.length > 0) {
    return;
  }

  for (const tick of ticks) {
    const option = document.createElement("option");
    option.value = tick.symbol;
    option.textContent = tick.symbol;
    elements.symbolSelect.append(option);
  }

  elements.symbolSelect.value = state.selectedSymbol;
}

function renderSnapshot() {
  const snapshot = state.snapshot;
  elements.lastUpdate.textContent = new Date(snapshot.asOf).toLocaleTimeString();
  renderRisk(snapshot.risk);
  renderPortfolio(snapshot.portfolio);
  drawChart();
}

function renderRisk(risk) {
  elements.grossExposure.textContent = formatter.format(risk.grossExposure);
  elements.netExposure.textContent = formatter.format(risk.netExposure);
  elements.var95.textContent = formatter.format(risk.oneDayVar95);
  elements.largestPosition.textContent = `${risk.largestPosition.symbol} ${risk.largestPosition.concentrationPercent}%`;
  elements.riskStatus.textContent = risk.status === "watch" ? "Watch" : "Normal";
  elements.riskStatus.classList.toggle("watch", risk.status === "watch");
}

function renderPortfolio(portfolio) {
  elements.portfolioRows.replaceChildren(...portfolio.rows.map(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.symbol}</td>
      <td>${integerFormatter.format(row.quantity)}</td>
      <td>${formatter.format(row.marketPrice)}</td>
      <td class="${tone(row.dayPnl)}">${formatter.format(row.dayPnl)}</td>
      <td class="${tone(row.totalPnl)}">${formatter.format(row.totalPnl)}</td>
    `;
    return tr;
  }));
}

async function renderOrderBook() {
  if (!state.snapshot) {
    return;
  }

  const response = await fetch(`/api/order-book?symbol=${encodeURIComponent(state.selectedSymbol)}`);
  const book = await response.json();
  const bid = book.bids[0];
  const ask = book.asks[0];

  elements.spreadValue.textContent = `Spread ${formatter.format(ask.price - bid.price)}`;
  elements.bidRows.replaceChildren(...book.bids.slice(0, 6).map(level => renderLevel(level, "bid")));
  elements.askRows.replaceChildren(...book.asks.slice(0, 6).map(level => renderLevel(level, "ask")));
}

function renderLevel(level, side) {
  const row = document.createElement("li");
  row.className = side === "bid" ? "positive" : "negative";
  row.innerHTML = `<span>${formatter.format(level.price)}</span><span>${integerFormatter.format(level.size)} ${level.venue}</span>`;
  return row;
}

function drawChart() {
  if (!state.snapshot) {
    return;
  }

  const tick = state.snapshot.ticks.find(item => item.symbol === state.selectedSymbol);
  const canvas = elements.priceChart;
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const padding = 28;
  const values = tick.history;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.01);

  context.clearRect(0, 0, width, height);
  context.strokeStyle = "#d8dee8";
  context.lineWidth = 1;

  for (let line = 0; line < 5; line++) {
    const y = padding + ((height - padding * 2) / 4) * line;
    context.beginPath();
    context.moveTo(padding, y);
    context.lineTo(width - padding, y);
    context.stroke();
  }

  context.strokeStyle = tick.change >= 0 ? "#168556" : "#c63d3d";
  context.lineWidth = 3;
  context.beginPath();

  values.forEach((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.stroke();
  context.fillStyle = "#172033";
  context.font = "700 18px system-ui";
  context.fillText(`${tick.symbol} ${formatter.format(tick.price)}`, padding, 26);
  context.fillStyle = tick.change >= 0 ? "#168556" : "#c63d3d";
  context.font = "700 13px system-ui";
  context.fillText(`${tick.change >= 0 ? "+" : ""}${tick.changePercent}%`, width - 112, 26);
}

function tone(value) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "";
}
